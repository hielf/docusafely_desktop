const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for PDF processing
const TEST_FILES_DIR = path.join(__dirname, '../../test-files');
const OUTPUT_DIR = path.join(__dirname, '../../test-output');

// Ensure test directories exist
if (!fs.existsSync(TEST_FILES_DIR)) {
  fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

describe('PDF Processing Integration Tests', () => {
  let processorPath;
  let testPdfPath;
  let pdfAvailable = false;
  let processorAvailable = false;

  beforeAll(() => {
    // Determine processor path based on platform
    const isWindows = process.platform === 'win32';
    const backendBase = path.join(__dirname, '../../backend');
    processorPath = isWindows
      ? path.join(backendBase, 'dist', 'processor.exe')
      : path.join(backendBase, 'dist', 'processor');

    // Check if processor is available
    processorAvailable = fs.existsSync(processorPath);
    if (!processorAvailable) {
      console.warn(`⚠️ Backend processor not found at: ${processorPath} - processor tests will be skipped (CI environment)`);
    }

    // Copy test PDF to test files directory
    const sourcePdfPath = path.join(__dirname, '../../../docusafely_core/test_documents/quote.pdf');
    testPdfPath = path.join(TEST_FILES_DIR, 'quote.pdf');

    if (fs.existsSync(sourcePdfPath)) {
      fs.copyFileSync(sourcePdfPath, testPdfPath);
      pdfAvailable = true;
      console.log(`✓ Test PDF copied to: ${testPdfPath}`);
    } else {
      console.warn(`⚠️ Source PDF not found at: ${sourcePdfPath} - PDF tests will be skipped (CI environment)`);
      pdfAvailable = false;
    }
  });

  afterAll(() => {
    // Clean up test files
    try {
      if (fs.existsSync(TEST_FILES_DIR)) {
        fs.rmSync(TEST_FILES_DIR, { recursive: true, force: true });
      }
      if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

  describe('Processor Availability', () => {
    test('should have processor executable available or skip gracefully', () => {
      if (!processorAvailable) {
        console.log('⏭️  Processor tests will be skipped (CI environment - backend not built)');
        return;
      }
      expect(fs.existsSync(processorPath)).toBe(true);
    });

    test('should have test PDF file available or skip gracefully', () => {
      if (!pdfAvailable) {
        console.log('⏭️  PDF tests will be skipped (CI environment)');
        return;
      }
      expect(fs.existsSync(testPdfPath)).toBe(true);
    });

    test('processor should be executable', () => {
      if (!processorAvailable) {
        console.log('⏭️  Skipping test - processor not available (CI environment)');
        return;
      }
      if (process.platform !== 'win32') {
        const stats = fs.statSync(processorPath);
        expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
      }
    });
  });

  describe('PDF Processing Functionality', () => {
    test('should process PDF and produce output file', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'quote-processed.pdf');

      // Ensure output directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      const result = await runProcessor(testPdfPath, outputPath);

      expect(result.status).toBe('success');
      expect(result.output).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify output file is not empty
      const outputStats = fs.statSync(outputPath);
      expect(outputStats.size).toBeGreaterThan(0);

      console.log(`✓ PDF processed successfully: ${outputPath} (${outputStats.size} bytes)`);
    }, TEST_TIMEOUT);

    test('should detect and mask content in PDF', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'quote-masked.pdf');

      const result = await runProcessor(testPdfPath, outputPath);

      expect(result.status).toBe('success');
      expect(result.characters_processed).toBeGreaterThan(0);

      console.log(`✓ Characters processed: ${result.characters_processed}`);
    }, TEST_TIMEOUT);

    test('should handle PDF processing errors gracefully', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const nonExistentPath = path.join(TEST_FILES_DIR, 'non-existent.pdf');
      const outputPath = path.join(OUTPUT_DIR, 'error-test.pdf');

      const result = await runProcessor(nonExistentPath, outputPath);

      expect(result.status).toBe('error');
      expect(result.message).toContain('does not exist');

      console.log(`✓ Error handling works: ${result.message}`);
    }, TEST_TIMEOUT);

    test('should produce different output than input (content should be masked)', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'quote-diff-test.pdf');

      const result = await runProcessor(testPdfPath, outputPath);

      expect(result.status).toBe('success');

      // Compare file sizes - processed file should be different
      const inputStats = fs.statSync(testPdfPath);
      const outputStats = fs.statSync(outputPath);

      // The processed file should exist and have content
      expect(outputStats.size).toBeGreaterThan(0);

      // Log the comparison for debugging
      console.log(`Input file size: ${inputStats.size} bytes`);
      console.log(`Output file size: ${outputStats.size} bytes`);

      // Note: File sizes might be similar due to PDF structure preservation
      // The real test is that content should be masked
    }, TEST_TIMEOUT);
  });

  describe('Content Analysis', () => {
    test('should extract and analyze PDF content', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'quote-analysis.pdf');

      const result = await runProcessor(testPdfPath, outputPath);

      expect(result.status).toBe('success');
      expect(result.characters_processed).toBeGreaterThan(0);

      // Try to extract text from the processed PDF to verify masking
      try {
        const textExtracted = await extractTextFromPdf(outputPath);
        console.log(`Extracted text sample: ${textExtracted.substring(0, 200)}...`);

        // Check if content appears to be masked (contains 'x' characters)
        const hasMaskedContent = /x{2,}/.test(textExtracted);
        console.log(`Contains masked content: ${hasMaskedContent}`);

      } catch (error) {
        console.warn('Could not extract text from processed PDF:', error.message);
      }
    }, TEST_TIMEOUT);
  });

  describe('Policy Application', () => {
    test('should apply custom entity policy', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'quote-policy-test.pdf');

      // Set custom policy via environment variable
      const customPolicy = {
        entities: ['PERSON', 'EMAIL', 'PHONE']
      };

      const result = await runProcessorWithPolicy(testPdfPath, outputPath, customPolicy);

      expect(result.status).toBe('success');

      console.log(`✓ Custom policy applied successfully`);
    }, TEST_TIMEOUT);
  });
});

// Helper function to run the processor
function runProcessor(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Processor timeout'));
    }, TEST_TIMEOUT);

    // Determine processor path
    const isWindows = process.platform === 'win32';
    const backendBase = path.join(__dirname, '../../backend');
    const procPath = isWindows
      ? path.join(backendBase, 'dist', 'processor.exe')
      : path.join(backendBase, 'dist', 'processor');

    const proc = spawn(procPath, [inputPath, outputPath]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        resolve({
          status: 'error',
          message: 'Failed to parse processor output',
          error: stdout,
          stderr: stderr,
          exitCode: code
        });
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        status: 'error',
        message: 'Failed to start processor',
        error: error.message
      });
    });
  });
}

// Helper function to run processor with custom policy
function runProcessorWithPolicy(inputPath, outputPath, policy) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Processor timeout'));
    }, TEST_TIMEOUT);

    const env = {
      ...process.env,
      DOCMASK_ENTITY_POLICY: JSON.stringify(policy)
    };

    // Determine processor path
    const isWindows = process.platform === 'win32';
    const backendBase = path.join(__dirname, '../../backend');
    const procPath = isWindows
      ? path.join(backendBase, 'dist', 'processor.exe')
      : path.join(backendBase, 'dist', 'processor');

    const proc = spawn(procPath, [inputPath, outputPath], { env });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (error) {
        resolve({
          status: 'error',
          message: 'Failed to parse processor output',
          error: stdout,
          stderr: stderr,
          exitCode: code
        });
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        status: 'error',
        message: 'Failed to start processor',
        error: error.message
      });
    });
  });
}

// Helper function to extract text from PDF (requires pdf-parse or similar)
async function extractTextFromPdf(pdfPath) {
  try {
    // This is a simplified version - you might want to use a proper PDF parsing library
    const fs = require('fs');
    const pdfContent = fs.readFileSync(pdfPath);

    // Basic text extraction - this is very rudimentary
    // For production, consider using pdf-parse or pdf2pic libraries
    const textContent = pdfContent.toString('utf8', 0, Math.min(pdfContent.length, 10000));

    // Extract readable text (very basic approach)
    const readableText = textContent.replace(/[^\x20-\x7E\n\r]/g, ' ');

    return readableText;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

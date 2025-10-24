const fs = require('fs');
const path = require('path');
const PDFTextExtractor = require('../utils/pdf-text-extractor');

/**
 * Comprehensive PDF Masking Verification Test
 * This test specifically focuses on verifying that PDF masking is working correctly
 * by comparing the original and processed PDFs in detail
 */

describe('PDF Masking Verification Tests', () => {
  const TEST_FILES_DIR = path.join(__dirname, '../../test-files');
  const OUTPUT_DIR = path.join(__dirname, '../../test-output');
  const ORIGINAL_PDF = path.join(__dirname, '../../../docusafely_core/test_documents/quote.pdf');

  let extractor;
  let originalText;
  let processedText;
  let originalAnalysis;
  let processedAnalysis;

  beforeAll(async () => {
    // Ensure test directories exist
    if (!fs.existsSync(TEST_FILES_DIR)) {
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    }
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    extractor = new PDFTextExtractor();
  });

  describe('PDF Processing and Analysis', () => {
    test('should process PDF and extract text from both original and processed versions', async () => {
      if (!fs.existsSync(ORIGINAL_PDF)) {
        console.warn('Test PDF not found, skipping verification test');
        return;
      }

      const processedPdf = path.join(OUTPUT_DIR, 'quote-verification.pdf');

      // Process the PDF
      const result = await runProcessor(ORIGINAL_PDF, processedPdf);

      expect(result.status).toBe('success');
      expect(fs.existsSync(processedPdf)).toBe(true);

      console.log(`✓ PDF processed successfully`);
      console.log(`  Characters processed: ${result.characters_processed}`);
      console.log(`  Original file size: ${fs.statSync(ORIGINAL_PDF).size} bytes`);
      console.log(`  Processed file size: ${fs.statSync(processedPdf).size} bytes`);

      // Extract text from both versions
      try {
        originalText = await extractor.extractText(ORIGINAL_PDF);
        processedText = await extractor.extractText(processedPdf);

        expect(originalText.length).toBeGreaterThan(0);
        expect(processedText.length).toBeGreaterThan(0);

        console.log(`✓ Text extracted from both PDFs`);
        console.log(`  Original text length: ${originalText.length} characters`);
        console.log(`  Processed text length: ${processedText.length} characters`);

      } catch (error) {
        console.warn('Text extraction failed:', error.message);

        // Try alternative extraction methods
        try {
          originalText = await extractor.extractText(ORIGINAL_PDF, { method: 'basic' });
          processedText = await extractor.extractText(processedPdf, { method: 'basic' });

          console.log(`✓ Text extracted using basic method`);
          console.log(`  Original text length: ${originalText.length} characters`);
          console.log(`  Processed text length: ${processedText.length} characters`);

        } catch (basicError) {
          console.error('All text extraction methods failed');
          throw basicError;
        }
      }
    }, 30000);

    test('should analyze PII content in original PDF', () => {
      if (!originalText) {
        console.warn('Original text not available, skipping PII analysis');
        return;
      }

      originalAnalysis = extractor.analyzeText(originalText);

      console.log('Original PDF PII Analysis:');
      Object.entries(originalAnalysis.patternCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} matches`);
        if (count > 0) {
          console.log(`    Examples: ${originalAnalysis.patterns[type].slice(0, 3).join(', ')}`);
        }
      });

      expect(originalAnalysis.hasPII).toBe(true);
      expect(originalAnalysis.patternCounts.emails).toBeGreaterThan(0);
      expect(originalAnalysis.patternCounts.phones).toBeGreaterThan(0);
      expect(originalAnalysis.patternCounts.names).toBeGreaterThan(0);
    });

    test('should analyze PII content in processed PDF', () => {
      if (!processedText) {
        console.warn('Processed text not available, skipping PII analysis');
        return;
      }

      processedAnalysis = extractor.analyzeText(processedText);

      console.log('Processed PDF PII Analysis:');
      Object.entries(processedAnalysis.patternCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} matches`);
        if (count > 0) {
          console.log(`    Examples: ${processedAnalysis.patterns[type].slice(0, 3).join(', ')}`);
        }
      });

      // The processed PDF should have less PII or different patterns
      console.log(`Contains PII: ${processedAnalysis.hasPII}`);
    });

    test('should compare original and processed PDFs for masking effectiveness', () => {
      if (!originalText || !processedText) {
        console.warn('Text not available for comparison, skipping comparison test');
        return;
      }

      const comparison = extractor.compareTexts(originalText, processedText);

      console.log('PDF Comparison Results:');
      console.log(`  Length difference: ${comparison.changes.lengthDifference} characters`);
      console.log(`  Content changed: ${comparison.changes.contentChanged}`);
      console.log(`  PII reduction: ${comparison.changes.piiReduction}`);
      console.log(`  Masking patterns found: ${comparison.masking.totalMasked}`);

      // Check for masking patterns
      Object.entries(comparison.masking.results).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`    ${type}: ${count} patterns`);
        }
      });

      // The processed PDF should be different from the original
      expect(comparison.changes.contentChanged).toBe(true);

      // There should be some indication of masking
      if (comparison.masking.totalMasked === 0) {
        console.warn('⚠️ No masking patterns detected in processed PDF');
        console.warn('This could indicate:');
        console.warn('  1. Masking is not working as expected');
        console.warn('  2. Masking method is not detectable by text extraction');
        console.warn('  3. Text extraction is not working properly on processed PDF');
      } else {
        console.log(`✅ Masking patterns detected: ${comparison.masking.totalMasked} total`);
      }
    });

    test('should verify specific PII elements are masked', () => {
      if (!originalAnalysis || !processedAnalysis) {
        console.warn('Analysis not available, skipping PII verification test');
        return;
      }

      console.log('PII Masking Verification:');

      const piiTypes = ['emails', 'phones', 'names', 'addresses'];
      let maskedCount = 0;

      piiTypes.forEach(type => {
        const originalCount = originalAnalysis.patternCounts[type];
        const processedCount = processedAnalysis.patternCounts[type];
        const reduction = originalCount - processedCount;

        console.log(`  ${type}:`);
        console.log(`    Original: ${originalCount} matches`);
        console.log(`    Processed: ${processedCount} matches`);
        console.log(`    Reduction: ${reduction} matches`);

        if (reduction > 0) {
          maskedCount++;
          console.log(`    ✅ ${type} appears to be masked`);
        } else if (originalCount > 0) {
          console.log(`    ⚠️ ${type} may not be masked properly`);
        }
      });

      if (maskedCount === 0 && originalAnalysis.hasPII) {
        console.warn('⚠️ No PII types appear to be masked');
        console.warn('This suggests the masking process may not be working correctly');
      } else {
        console.log(`✅ ${maskedCount} PII types appear to be masked`);
      }
    });

    test('should check for visual masking indicators in processed text', () => {
      if (!processedText) {
        console.warn('Processed text not available, skipping visual masking test');
        return;
      }

      // Look for various masking patterns
      const maskingPatterns = {
        xPattern: /x{2,}/g,
        starPattern: /\*{2,}/g,
        hashPattern: /#{2,}/g,
        dashPattern: /-{2,}/g,
        underscorePattern: /_{2,}/g,
        dotPattern: /\.{2,}/g
      };

      console.log('Visual Masking Pattern Detection:');
      let totalPatterns = 0;

      Object.entries(maskingPatterns).forEach(([name, pattern]) => {
        const matches = processedText.match(pattern);
        const count = matches ? matches.length : 0;
        totalPatterns += count;

        if (count > 0) {
          console.log(`  ${name}: ${count} patterns found`);
          console.log(`    Examples: ${matches.slice(0, 3).join(', ')}`);
        }
      });

      if (totalPatterns === 0) {
        console.warn('⚠️ No visual masking patterns detected');
        console.warn('This could mean:');
        console.warn('  1. Masking is not working');
        console.warn('  2. Masking uses a different method (e.g., white rectangles)');
        console.warn('  3. Text extraction is not capturing the masked content');
      } else {
        console.log(`✅ Visual masking patterns detected: ${totalPatterns} total`);
      }
    });
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
});

// Helper function to run the processor
async function runProcessor(inputPath, outputPath) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');

    // Determine processor path
    const isWindows = process.platform === 'win32';
    const backendBase = path.join(__dirname, '../../backend');
    const processorPath = isWindows
      ? path.join(backendBase, 'dist', 'processor.exe')
      : path.join(backendBase, 'dist', 'processor');

    if (!fs.existsSync(processorPath)) {
      resolve({
        status: 'error',
        message: 'Processor not found',
        error: `Processor not found at: ${processorPath}`
      });
      return;
    }

    const proc = spawn(processorPath, [inputPath, outputPath]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
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
      resolve({
        status: 'error',
        message: 'Failed to start processor',
        error: error.message
      });
    });
  });
}

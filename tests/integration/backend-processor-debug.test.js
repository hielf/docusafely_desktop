const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Backend Processor Debug Test
 * This test directly tests the backend processor to understand why PDF masking is not working
 */

describe('Backend Processor Debug Tests', () => {
  const TEST_FILES_DIR = path.join(__dirname, '../../test-files');
  const OUTPUT_DIR = path.join(__dirname, '../../test-output');
  const ORIGINAL_PDF = path.join(__dirname, '../../../docusafely_core/test_documents/quote.pdf');

  let processorPath;
  let pdfAvailable = false;
  let processorAvailable = false;

  beforeAll(() => {
    // Ensure test directories exist
    if (!fs.existsSync(TEST_FILES_DIR)) {
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    }
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Determine processor path
    const isWindows = process.platform === 'win32';
    const backendBase = path.join(__dirname, '../../backend');
    processorPath = isWindows
      ? path.join(backendBase, 'dist', 'processor.exe')
      : path.join(backendBase, 'dist', 'processor');

    // Check if processor is available
    processorAvailable = fs.existsSync(processorPath);
    if (!processorAvailable) {
      console.warn('⚠️ Backend processor not found, processor tests will be skipped (CI environment)');
      console.warn(`   Expected location: ${processorPath}`);
    }

    // Check if test PDF is available
    pdfAvailable = fs.existsSync(ORIGINAL_PDF);
    if (!pdfAvailable) {
      console.warn('⚠️ Test PDF not found, PDF tests will be skipped');
      console.warn(`   Expected location: ${ORIGINAL_PDF}`);
    }
  });

  describe('Direct Processor Testing', () => {
    test('should run processor with verbose output to debug masking issue', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'debug-processed.pdf');

      console.log('🔍 Debugging PDF Processing...');
      console.log(`  Input: ${ORIGINAL_PDF}`);
      console.log(`  Output: ${outputPath}`);
      console.log(`  Processor: ${processorPath}`);

      // Test with explicit policy
      console.log('\n📋 Test: Explicit Policy');
      const explicitPolicy = {
        entities: ['PERSON', 'EMAIL', 'PHONE', 'ADDRESS']
      };
      const result = await runProcessorWithPolicy(processorPath, ORIGINAL_PDF, outputPath + '.explicit', explicitPolicy);
      console.log('Result:', JSON.stringify(result, null, 2));

      // Test should report success
      expect(result.status).toBe('success');

      // Check if output is different from input
      const originalSize = fs.statSync(ORIGINAL_PDF).size;
      const outputSize = fs.statSync(outputPath + '.explicit').size;

      console.log('\n📊 File Size Comparison:');
      console.log(`  Original: ${originalSize} bytes`);
      console.log(`  Processed: ${outputSize} bytes (diff: ${outputSize - originalSize})`);

      // File size should be different if masking is working
      const hasChanges = outputSize !== originalSize;

      if (!hasChanges) {
        console.warn('⚠️ No file size changes detected - masking may not be working');
      } else {
        console.log('✅ File size changes detected - masking is working');
      }

      // Expect file size to change when masking
      expect(hasChanges).toBe(true);
    }, 60000);

    test('should test processor with different file types to isolate PDF issue', async () => {
      if (!processorAvailable) {
        console.log('⏭️  Skipping test - processor not available (CI environment)');
        return;
      }

      // Create a simple text file with PII
      const testTextPath = path.join(TEST_FILES_DIR, 'test-pii.txt');
      const testContent = `
Test Document with PII

Name: John Doe
Email: john.doe@example.com
Phone: 555-123-4567
Address: 123 Main Street, Anytown, USA
SSN: 123-45-6789
`;

      fs.writeFileSync(testTextPath, testContent);

      const outputPath = path.join(OUTPUT_DIR, 'test-pii-processed.txt');

      console.log('🔍 Testing Text File Processing...');
      console.log(`  Input: ${testTextPath}`);
      console.log(`  Output: ${outputPath}`);

      const result = await runProcessorWithDebug(processorPath, testTextPath, outputPath);
      console.log('Text Processing Result:', JSON.stringify(result, null, 2));

      expect(result.status).toBe('success');

      // Check if text file was actually masked
      if (fs.existsSync(outputPath)) {
        const originalContent = fs.readFileSync(testTextPath, 'utf8');
        const processedContent = fs.readFileSync(outputPath, 'utf8');

        console.log('\n📝 Content Comparison:');
        console.log('Original:', originalContent);
        console.log('Processed:', processedContent);

        const contentChanged = originalContent !== processedContent;
        console.log(`Content changed: ${contentChanged}`);

        if (!contentChanged) {
          console.warn('⚠️ Text file processing also shows no changes - issue may be in core processor');
        } else {
          console.log('✅ Text file processing works - issue may be PDF-specific');
        }
      }
    }, 60000);

    test('should test processor with environment variables and debug flags', async () => {
      if (!pdfAvailable || !processorAvailable) {
        console.log('⏭️  Skipping test - PDF file or processor not available (CI environment)');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'debug-env.pdf');

      console.log('🔍 Testing with Environment Variables...');

      // Test with debug environment variables
      const env = {
        ...process.env,
        DOCMASK_ENTITY_POLICY: JSON.stringify({
          entities: ['PERSON', 'EMAIL', 'PHONE', 'ADDRESS']
        }),
        DOCMASK_DEBUG: 'true',
        DOCMASK_VERBOSE: 'true',
        PYTHONPATH: path.join(__dirname, '../../../docusafely_core/src')
      };

      const result = await runProcessorWithEnvironment(processorPath, ORIGINAL_PDF, outputPath, env);
      console.log('Environment Test Result:', JSON.stringify(result, null, 2));

      expect(result.status).toBe('success');

      // Check if the output file exists and is different
      if (fs.existsSync(outputPath)) {
        const originalSize = fs.statSync(ORIGINAL_PDF).size;
        const outputSize = fs.statSync(outputPath).size;

        console.log(`File size comparison: ${originalSize} -> ${outputSize} (diff: ${outputSize - originalSize})`);
      }
    }, 60000);
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

// Helper function to run processor with debug output
async function runProcessorWithDebug(processorPath, inputPath, outputPath) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');

    const proc = spawn(processorPath, [inputPath, outputPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

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

// Helper function to run processor with policy
async function runProcessorWithPolicy(processorPath, inputPath, outputPath, policy) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');

    const env = {
      ...process.env,
      DOCMASK_ENTITY_POLICY: JSON.stringify(policy)
    };

    const proc = spawn(processorPath, [inputPath, outputPath], { env });

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

// Helper function to run processor with custom environment
async function runProcessorWithEnvironment(processorPath, inputPath, outputPath, env) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');

    const proc = spawn(processorPath, [inputPath, outputPath], { env });

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

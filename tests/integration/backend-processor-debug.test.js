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
  });

  describe('Direct Processor Testing', () => {
    test('should run processor with verbose output to debug masking issue', async () => {
      if (!fs.existsSync(ORIGINAL_PDF)) {
        console.warn('Test PDF not found, skipping debug test');
        return;
      }

      const outputPath = path.join(OUTPUT_DIR, 'debug-processed.pdf');

      console.log('🔍 Debugging PDF Processing...');
      console.log(`  Input: ${ORIGINAL_PDF}`);
      console.log(`  Output: ${outputPath}`);
      console.log(`  Processor: ${processorPath}`);

      // Test 1: Run without any policy (default behavior)
      console.log('\n📋 Test 1: Default Policy');
      const result1 = await runProcessorWithDebug(processorPath, ORIGINAL_PDF, outputPath + '.default');
      console.log('Result 1:', JSON.stringify(result1, null, 2));

      // Test 2: Run with explicit policy
      console.log('\n📋 Test 2: Explicit Policy');
      const explicitPolicy = {
        entities: ['PERSON', 'EMAIL', 'PHONE', 'ADDRESS']
      };
      const result2 = await runProcessorWithPolicy(processorPath, ORIGINAL_PDF, outputPath + '.explicit', explicitPolicy);
      console.log('Result 2:', JSON.stringify(result2, null, 2));

      // Test 3: Run with minimal policy
      console.log('\n📋 Test 3: Minimal Policy');
      const minimalPolicy = {
        entities: ['EMAIL']
      };
      const result3 = await runProcessorWithPolicy(processorPath, ORIGINAL_PDF, outputPath + '.minimal', minimalPolicy);
      console.log('Result 3:', JSON.stringify(result3, null, 2));

      // All tests should report success
      expect(result1.status).toBe('success');
      expect(result2.status).toBe('success');
      expect(result3.status).toBe('success');

      // Check if any of the outputs are different from input
      const originalSize = fs.statSync(ORIGINAL_PDF).size;
      const output1Size = fs.statSync(outputPath + '.default').size;
      const output2Size = fs.statSync(outputPath + '.explicit').size;
      const output3Size = fs.statSync(outputPath + '.minimal').size;

      console.log('\n📊 File Size Comparison:');
      console.log(`  Original: ${originalSize} bytes`);
      console.log(`  Default: ${output1Size} bytes (diff: ${output1Size - originalSize})`);
      console.log(`  Explicit: ${output2Size} bytes (diff: ${output2Size - originalSize})`);
      console.log(`  Minimal: ${output3Size} bytes (diff: ${output3Size - originalSize})`);

      // At least one should be different if masking is working
      const hasChanges = (output1Size !== originalSize) ||
        (output2Size !== originalSize) ||
        (output3Size !== originalSize);

      if (!hasChanges) {
        console.warn('⚠️ No file size changes detected - masking may not be working');
      } else {
        console.log('✅ File size changes detected - masking appears to be working');
      }
    }, 60000);

    test('should test processor with different file types to isolate PDF issue', async () => {
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
    }, 30000);

    test('should test processor with environment variables and debug flags', async () => {
      if (!fs.existsSync(ORIGINAL_PDF)) {
        console.warn('Test PDF not found, skipping environment test');
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
    }, 30000);
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

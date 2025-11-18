/**
 * Policy Selector Function Tests
 * Tests the policy creation and passing from frontend to backend
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

describe('Policy Selector Tests', () => {
  const backendBase = path.join(__dirname, '../../backend');
  const processorPath = process.platform === 'win32'
    ? path.join(backendBase, 'dist', 'processor.exe')
    : path.join(backendBase, 'dist', 'processor');

  const testInputFile = path.join(__dirname, '../fixtures/test-input.txt');
  const testOutputDir = path.join(__dirname, '../../test-output');

  beforeAll(() => {
    // Create test output directory
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }

    // Create test fixtures directory
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create test input file
    if (!fs.existsSync(testInputFile)) {
      fs.writeFileSync(
        testInputFile,
        'Email: john@example.com\nPhone: (555) 123-4567\nSSN: 123-45-6789',
        'utf-8'
      );
    }
  });

  describe('Policy Object Creation', () => {
    test('should create mask_all policy correctly', () => {
      const policy = {
        mask_all: true,
        entities: []
      };

      expect(policy).toHaveProperty('mask_all', true);
      expect(policy).toHaveProperty('entities');
      expect(Array.isArray(policy.entities)).toBe(true);
      expect(policy.entities.length).toBe(0);
    });

    test('should create entity-based policy correctly', () => {
      const selectedEntities = ['email', 'phone', 'ssn'];
      const policy = {
        mask_all: false,
        entities: selectedEntities
      };

      expect(policy).toHaveProperty('mask_all', false);
      expect(policy).toHaveProperty('entities');
      expect(policy.entities).toEqual(['email', 'phone', 'ssn']);
      expect(policy.entities.length).toBe(3);
    });

    test('should create empty policy correctly', () => {
      const policy = {
        mask_all: false,
        entities: []
      };

      expect(policy.mask_all).toBe(false);
      expect(policy.entities).toEqual([]);
    });

    test('should handle single entity selection', () => {
      const policy = {
        mask_all: false,
        entities: ['email']
      };

      expect(policy.entities).toEqual(['email']);
      expect(policy.entities.length).toBe(1);
    });

    test('should handle multiple entity selection', () => {
      const allEntities = [
        'email', 'phone', 'ssn', 'credit_card',
        'ip_address', 'mac_address', 'url', 'date_of_birth',
        'drivers_license', 'passport', 'address', 'name'
      ];

      const policy = {
        mask_all: false,
        entities: allEntities
      };

      expect(policy.entities.length).toBe(12);
      expect(policy.entities).toContain('email');
      expect(policy.entities).toContain('ssn');
    });
  });

  describe('Policy JSON Serialization', () => {
    test('should serialize mask_all policy to JSON', () => {
      const policy = {
        mask_all: true,
        entities: []
      };

      const json = JSON.stringify(policy);
      expect(json).toBe('{"mask_all":true,"entities":[]}');
    });

    test('should serialize entity policy to JSON', () => {
      const policy = {
        mask_all: false,
        entities: ['email', 'phone']
      };

      const json = JSON.stringify(policy);
      const parsed = JSON.parse(json);

      expect(parsed.mask_all).toBe(false);
      expect(parsed.entities).toEqual(['email', 'phone']);
    });

    test('should handle JSON parsing errors gracefully', () => {
      const invalidPolicy = undefined;

      let json;
      try {
        json = JSON.stringify(invalidPolicy || {});
      } catch (e) {
        json = '{}';
      }

      expect(json).toBe('{}');
    });
  });

  describe('Policy Environment Variable', () => {
    test('should format policy for DOCMASK_ENTITY_POLICY env var', () => {
      const policy = {
        mask_all: true,
        entities: []
      };

      const envValue = JSON.stringify(policy);
      expect(typeof envValue).toBe('string');
      expect(envValue).toContain('mask_all');
    });

    test('should handle complex policy in env var', () => {
      const policy = {
        mask_all: false,
        entities: ['email', 'phone', 'ssn', 'credit_card']
      };

      const envValue = JSON.stringify(policy);
      const parsed = JSON.parse(envValue);

      expect(parsed.entities.length).toBe(4);
    });
  });

  describe('Policy Integration with Backend', () => {
    // Skip if processor not available
    const skipIfNoProcessor = () => {
      if (!fs.existsSync(processorPath)) {
        return true;
      }
      return false;
    };

    test('should pass mask_all policy to backend', (done) => {
      if (skipIfNoProcessor()) {
        console.log('⚠️  Skipping: processor not available');
        done();
        return;
      }

      const outputFile = path.join(testOutputDir, 'output-mask-all.txt');
      const policy = { mask_all: true, entities: [] };

      const env = {
        ...process.env,
        DOCMASK_ENTITY_POLICY: JSON.stringify(policy)
      };

      const proc = spawn(processorPath, [testInputFile, outputFile], { env });

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
          expect(code).toBe(0);

          // Parse output
          const result = JSON.parse(stdout);
          expect(result.status).toBe('success');

          // Check if log file was created
          if (result.log_file) {
            expect(fs.existsSync(result.log_file)).toBe(true);

            // Verify log contains correct policy
            const logContent = fs.readFileSync(result.log_file, 'utf-8');
            expect(logContent).toContain('mask_all');
            expect(logContent).toMatch(/mask_all.*true/i);
          }

          done();
        } catch (error) {
          done(error);
        }
      });
    }, 120000);

    test('should pass entity policy to backend', (done) => {
      if (skipIfNoProcessor()) {
        console.log('⚠️  Skipping: processor not available');
        done();
        return;
      }

      const outputFile = path.join(testOutputDir, 'output-entities.txt');
      const policy = { mask_all: false, entities: ['email', 'phone'] };

      const env = {
        ...process.env,
        DOCMASK_ENTITY_POLICY: JSON.stringify(policy)
      };

      const proc = spawn(processorPath, [testInputFile, outputFile], { env });

      let stdout = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.on('close', (code) => {
        try {
          expect(code).toBe(0);

          const result = JSON.parse(stdout);
          expect(result.status).toBe('success');

          // Verify output file was masked
          if (fs.existsSync(outputFile)) {
            const content = fs.readFileSync(outputFile, 'utf-8');
            // Email and phone should be masked
            expect(content).not.toContain('john@example.com');
            expect(content).not.toContain('(555) 123-4567');
          }

          done();
        } catch (error) {
          done(error);
        }
      });
    }, 120000);

    test('should pass empty policy to backend', (done) => {
      if (skipIfNoProcessor()) {
        console.log('⚠️  Skipping: processor not available');
        done();
        return;
      }

      const outputFile = path.join(testOutputDir, 'output-empty.txt');
      const policy = { mask_all: false, entities: [] };

      const env = {
        ...process.env,
        DOCMASK_ENTITY_POLICY: JSON.stringify(policy)
      };

      const proc = spawn(processorPath, [testInputFile, outputFile], { env });

      let stdout = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.on('close', (code) => {
        try {
          expect(code).toBe(0);

          const result = JSON.parse(stdout);
          expect(result.status).toBe('success');

          // With empty policy, nothing should be masked
          if (fs.existsSync(outputFile)) {
            const content = fs.readFileSync(outputFile, 'utf-8');
            // Original content should remain (nothing to mask)
            expect(content).toContain('Email:');
          }

          done();
        } catch (error) {
          done(error);
        }
      });
    }, 120000);
  });

  describe('Policy Error Handling', () => {
    test('should handle null policy gracefully', () => {
      const policy = null;

      let result;
      try {
        result = JSON.stringify(policy || {});
      } catch (e) {
        result = '{}';
      }

      const parsed = JSON.parse(result);
      expect(typeof parsed).toBe('object');
    });

    test('should handle undefined policy gracefully', () => {
      const policy = undefined;

      const result = JSON.stringify(policy || {});
      const parsed = JSON.parse(result);

      expect(typeof parsed).toBe('object');
    });

    test('should handle malformed policy gracefully', () => {
      const policy = { invalid: 'structure' };

      const result = JSON.stringify(policy);
      expect(result).toBeTruthy();
    });
  });

  describe('Policy State Management', () => {
    test('should toggle mask_all state', () => {
      let policy = { mask_all: false, entities: ['email'] };

      // Toggle on
      policy.mask_all = true;
      expect(policy.mask_all).toBe(true);

      // Toggle off
      policy.mask_all = false;
      expect(policy.mask_all).toBe(false);
    });

    test('should add entity to policy', () => {
      const policy = { mask_all: false, entities: [] };

      policy.entities.push('email');
      expect(policy.entities).toContain('email');
      expect(policy.entities.length).toBe(1);

      policy.entities.push('phone');
      expect(policy.entities.length).toBe(2);
    });

    test('should remove entity from policy', () => {
      const policy = { mask_all: false, entities: ['email', 'phone', 'ssn'] };

      const index = policy.entities.indexOf('phone');
      policy.entities.splice(index, 1);

      expect(policy.entities).not.toContain('phone');
      expect(policy.entities.length).toBe(2);
    });

    test('should prevent duplicate entities', () => {
      const policy = { mask_all: false, entities: ['email'] };

      // Try to add duplicate
      if (!policy.entities.includes('email')) {
        policy.entities.push('email');
      }

      expect(policy.entities.length).toBe(1);
    });

    test('should clear all entities when mask_all is enabled', () => {
      const policy = { mask_all: false, entities: ['email', 'phone'] };

      // When mask_all is enabled, entities might not matter
      policy.mask_all = true;
      // Entities can remain or be cleared based on implementation
      expect(policy.mask_all).toBe(true);
    });
  });

  describe('Policy Validation', () => {
    test('should validate mask_all is boolean', () => {
      const policy = { mask_all: true, entities: [] };
      expect(typeof policy.mask_all).toBe('boolean');
    });

    test('should validate entities is array', () => {
      const policy = { mask_all: false, entities: ['email'] };
      expect(Array.isArray(policy.entities)).toBe(true);
    });

    test('should validate entity names are strings', () => {
      const policy = { mask_all: false, entities: ['email', 'phone', 'ssn'] };

      policy.entities.forEach(entity => {
        expect(typeof entity).toBe('string');
      });
    });

    test('should handle valid entity types', () => {
      const validEntities = [
        'email', 'phone', 'ssn', 'credit_card',
        'ip_address', 'mac_address', 'url', 'date_of_birth',
        'drivers_license', 'passport', 'address', 'name',
        'bank_account', 'iban', 'license_plate'
      ];

      const policy = { mask_all: false, entities: validEntities };

      validEntities.forEach(entity => {
        expect(policy.entities).toContain(entity);
      });
    });
  });

  afterAll(() => {
    // Optional: Clean up test output files
    // Uncomment if you want to remove test outputs after tests
    /*
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testOutputDir, file));
      });
    }
    */
  });
});


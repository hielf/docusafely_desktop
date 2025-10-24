// Jest teardown file for cleanup after all tests

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Running global teardown...');

  // Clean up test directories
  const testDirs = [
    path.join(__dirname, '../test-files'),
    path.join(__dirname, '../test-output'),
    path.join(__dirname, '../coverage')
  ];

  for (const dir of testDirs) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✓ Cleaned up: ${dir}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to clean up ${dir}:`, error.message);
    }
  }

  console.log('✅ Global teardown complete');
};

// Jest setup file for integration tests

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock process.getSystemVersion for custom-electron-titlebar compatibility
// This is an Electron-specific API that needs to be mocked in Jest tests
if (!process.getSystemVersion) {
  process.getSystemVersion = jest.fn(() => {
    // Return a mock version string that works for testing
    // macOS 10.x format by default
    return process.platform === 'darwin' ? '10.15.7' : '10.0';
  });
}

// Global test utilities
global.testUtils = {
  // Helper to create test directories
  createTestDir: (dirPath) => {
    const fs = require('fs');
    const path = require('path');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  // Helper to clean up test files
  cleanupTestFiles: (dirPath) => {
    const fs = require('fs');
    const path = require('path');
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`Cleanup warning for ${dirPath}:`, error.message);
    }
  },

  // Helper to wait for file to exist
  waitForFile: async (filePath, timeout = 5000) => {
    const fs = require('fs');
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (fs.existsSync(filePath)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }
};

// Console setup for better test output
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Override console methods to prefix with test info
console.log = (...args) => {
  const testName = expect.getState().currentTestName || 'Unknown Test';
  originalConsoleLog(`[${testName}]`, ...args);
};

console.warn = (...args) => {
  const testName = expect.getState().currentTestName || 'Unknown Test';
  originalConsoleWarn(`[${testName}] WARNING:`, ...args);
};

console.error = (...args) => {
  const testName = expect.getState().currentTestName || 'Unknown Test';
  originalConsoleError(`[${testName}] ERROR:`, ...args);
};

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

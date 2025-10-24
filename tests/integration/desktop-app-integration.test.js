const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Mock Electron for testing
jest.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: jest.fn((name) => {
      if (name === 'temp') return '/tmp';
      return '/tmp';
    }),
    whenReady: () => Promise.resolve(),
    on: jest.fn()
  },
  BrowserWindow: (() => {
    const BrowserWindow = function () {
      this.loadFile = jest.fn();
      this.webContents = { openDevTools: jest.fn() };
    };
    BrowserWindow.getAllWindows = () => [];
    return BrowserWindow;
  })(),
  ipcMain: {
    handle: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn()
  }
}));

describe('Desktop App Integration Tests', () => {
  let mainWindow;
  let processorPath;

  beforeAll(() => {
    // Determine processor path
    const isWindows = process.platform === 'win32';
    const backendBase = path.join(__dirname, '../../backend');
    processorPath = isWindows
      ? path.join(backendBase, 'dist', 'processor.exe')
      : path.join(backendBase, 'dist', 'processor');
  });

  describe('Main Process Integration', () => {
    test('should load main.js without errors', () => {
      expect(() => {
        require('../../src/main.js');
      }).not.toThrow();
    });

    test('should register IPC handlers', () => {
      const { ipcMain } = require('electron');

      // Reset mock to capture new calls
      ipcMain.handle.mockClear();

      // Reload main.js to register handlers
      jest.resetModules();
      require('../../src/main.js');

      // Check that handlers are registered
      const handlerCalls = ipcMain.handle.mock.calls;
      const handlerNames = handlerCalls.map(call => call[0]);

      expect(handlerNames).toContain('select-input-file');
      expect(handlerNames).toContain('select-output-file');
      expect(handlerNames).toContain('process-document');
      expect(handlerNames).toContain('generate-dry-run-report');
      expect(handlerNames).toContain('copy-file');
    });

    test('should handle file selection dialog', async () => {
      const { dialog } = require('electron');
      const { ipcMain } = require('electron');

      // Mock dialog response
      dialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/test/input.pdf']
      });

      // Find the select-input-file handler
      const handlerCalls = ipcMain.handle.mock.calls;
      const selectHandler = handlerCalls.find(call => call[0] === 'select-input-file');

      expect(selectHandler).toBeDefined();

      const handler = selectHandler[1];
      const result = await handler();

      expect(result).toBe('/test/input.pdf');
    });

    test('should handle save dialog', async () => {
      const { dialog } = require('electron');
      const { ipcMain } = require('electron');

      // Mock dialog response
      dialog.showSaveDialog.mockResolvedValue({
        canceled: false,
        filePath: '/test/output.pdf'
      });

      // Find the select-output-file handler
      const handlerCalls = ipcMain.handle.mock.calls;
      const saveHandler = handlerCalls.find(call => call[0] === 'select-output-file');

      expect(saveHandler).toBeDefined();

      const handler = saveHandler[1];
      const result = await handler();

      expect(result).toBe('/test/output.pdf');
    });
  });

  describe('Document Processing Integration', () => {
    test('should process document with valid input', async () => {
      const { ipcMain } = require('electron');

      // Find the process-document handler
      const handlerCalls = ipcMain.handle.mock.calls;
      const processHandler = handlerCalls.find(call => call[0] === 'process-document');

      expect(processHandler).toBeDefined();

      const handler = processHandler[1];

      // Mock a successful processor response
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      // Mock spawn to return successful result
      const mockSpawn = jest.fn(() => ({
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              // Simulate successful processor output
              setTimeout(() => {
                callback(Buffer.from(JSON.stringify({
                  status: 'success',
                  message: 'File processed successfully',
                  output: '/test/output.pdf',
                  characters_processed: 100
                })));
              }, 100);
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 200);
          }
        })
      }));

      jest.doMock('child_process', () => ({
        spawn: mockSpawn
      }));

      const result = await handler({}, {
        inputPath: '/test/input.pdf',
        outputPath: '/test/output.pdf',
        policy: { entities: ['PERSON', 'EMAIL'] }
      });

      expect(result.status).toBe('success');
      expect(result.message).toBe('File processed successfully');
    });

    test('should handle processor errors gracefully', async () => {
      const { ipcMain } = require('electron');

      // Find the process-document handler
      const handlerCalls = ipcMain.handle.mock.calls;
      const processHandler = handlerCalls.find(call => call[0] === 'process-document');

      const handler = processHandler[1];

      // Mock processor not found
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await handler({}, {
        inputPath: '/test/input.pdf',
        outputPath: '/test/output.pdf'
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('Failed to start processor');
    });

    test('should handle missing input file', async () => {
      const { ipcMain } = require('electron');

      const handlerCalls = ipcMain.handle.mock.calls;
      const processHandler = handlerCalls.find(call => call[0] === 'process-document');

      const handler = processHandler[1];

      // Mock processor exists but file doesn't
      jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
        return path.includes('processor') || path.includes('processor.exe');
      });

      const mockSpawn = jest.fn(() => ({
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              setTimeout(() => {
                callback(Buffer.from(JSON.stringify({
                  status: 'error',
                  message: 'Input file does not exist',
                  error: 'FileNotFoundError'
                })));
              }, 100);
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 200);
          }
        })
      }));

      jest.doMock('child_process', () => ({
        spawn: mockSpawn
      }));

      const result = await handler({}, {
        inputPath: '/nonexistent/input.pdf',
        outputPath: '/test/output.pdf'
      });

      expect(result.status).toBe('error');
      expect(result.message).toBe('Input file does not exist');
    });
  });

  describe('Dry Run Report Integration', () => {
    test('should generate dry run report', async () => {
      const { ipcMain } = require('electron');

      const handlerCalls = ipcMain.handle.mock.calls;
      const dryRunHandler = handlerCalls.find(call => call[0] === 'generate-dry-run-report');

      expect(dryRunHandler).toBeDefined();

      const handler = dryRunHandler[1];

      // Mock file exists
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'statSync').mockReturnValue({
        size: 1024
      });

      const result = await handler({}, {
        inputPath: '/test/input.pdf',
        policy: { entities: ['PERSON', 'EMAIL'] }
      });

      expect(result.status).toBe('success');
      expect(result.message).toBe('Preview ready');
      expect(result.file_info).toBeDefined();
      expect(result.file_info.name).toBe('input.pdf');
    });

    test('should handle missing file in dry run', async () => {
      const { ipcMain } = require('electron');

      const handlerCalls = ipcMain.handle.mock.calls;
      const dryRunHandler = handlerCalls.find(call => call[0] === 'generate-dry-run-report');

      const handler = dryRunHandler[1];

      // Mock file doesn't exist
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await handler({}, {
        inputPath: '/nonexistent/input.pdf',
        policy: {}
      });

      expect(result.status).toBe('error');
      expect(result.message).toBe('Input file not found');
    });
  });

  describe('File Operations Integration', () => {
    test('should copy files successfully', async () => {
      const { ipcMain } = require('electron');

      const handlerCalls = ipcMain.handle.mock.calls;
      const copyHandler = handlerCalls.find(call => call[0] === 'copy-file');

      expect(copyHandler).toBeDefined();

      const handler = copyHandler[1];

      // Mock successful file copy
      jest.spyOn(fs.promises, 'mkdir').mockResolvedValue();
      jest.spyOn(fs.promises, 'copyFile').mockResolvedValue();

      const result = await handler({}, {
        src: '/test/source.pdf',
        dest: '/test/dest.pdf',
        overwrite: false
      });

      expect(result.status).toBe('success');
      expect(result.dest).toBe('/test/dest.pdf');
    });

    test('should handle copy file errors', async () => {
      const { ipcMain } = require('electron');

      const handlerCalls = ipcMain.handle.mock.calls;
      const copyHandler = handlerCalls.find(call => call[0] === 'copy-file');

      const handler = copyHandler[1];

      // Mock file copy error
      jest.spyOn(fs.promises, 'mkdir').mockRejectedValue(new Error('Permission denied'));

      const result = await handler({}, {
        src: '/test/source.pdf',
        dest: '/test/dest.pdf',
        overwrite: false
      });

      expect(result.status).toBe('error');
      expect(result.message).toContain('Permission denied');
    });
  });

  afterEach(() => {
    // Clean up mocks
    jest.clearAllMocks();
  });
});

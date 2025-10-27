const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('select-input-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['txt', 'csv', 'pdf', 'doc', 'docx', 'xls', 'xlsx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-output-file', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'Text/CSV Files', extensions: ['txt', 'csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('process-document', async (event, { inputPath, outputPath, policy }) => {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const backendBase = app.isPackaged
      ? path.join(process.resourcesPath, 'backend')
      : path.join(__dirname, '..', 'backend');

    const compiledPath = isWindows
      ? path.join(backendBase, 'dist', 'processor.exe')
      : path.join(backendBase, 'dist', 'processor');
    const scriptPath = path.join(backendBase, 'processor.py');

    const trySpawnCompiled = () => {
      if (!fs.existsSync(compiledPath)) return null;
      try {
        // Pass policy via environment variable
        const env = Object.assign({}, process.env, {
          DOCMASK_ENTITY_POLICY: (() => {
            try {
              return JSON.stringify(policy || {});
            } catch (_e) {
              return '{}';
            }
          })()
        });
        return spawn(compiledPath, [inputPath, outputPath], { env });
      } catch (_e) {
        return null;
      }
    };

    const trySpawnPython = () => {
      const pythonCandidates = isWindows ? ['python', 'python3'] : ['python3', 'python'];
      for (const cmd of pythonCandidates) {
        try {
          return spawn(cmd, [scriptPath, inputPath, outputPath]);
        } catch (_e) {
          // try next candidate
        }
      }
      return null;
    };

    const attachHandlers = (proc) => {
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            // Log the debug log location if available
            if (result.log_file) {
              console.log(`[DocuSafely] Debug log: ${result.log_file}`);
            }
            resolve(result);
          } catch (error) {
            resolve({
              status: 'error',
              message: 'Failed to parse processor output',
              error: stdout,
              stderr: stderr
            });
          }
        } else {
          // Try to parse stderr to extract log file location
          let logFile = null;
          try {
            const logMatch = stderr.match(/Debug log saved to: (.+)$/m);
            if (logMatch) {
              logFile = logMatch[1].trim();
            }
          } catch (e) {
            // Ignore parsing errors
          }

          resolve({
            status: 'error',
            message: 'Processor failed',
            error: stderr || stdout,
            log_file: logFile
          });
        }
      });
      proc.on('error', (_error) => {
        // If the current proc failed to start, fall back to Python once
        if (proc.__attemptedFallback !== true) {
          const fb = trySpawnPython();
          if (fb) {
            fb.__attemptedFallback = true;
            attachHandlers(fb);
            return;
          }
        }
        resolve({
          status: 'error',
          message: 'Failed to start processor',
          error: `ENOENT or not executable. Looked for compiled at ${compiledPath} and script at ${scriptPath}`
        });
      });
    };

    // If no outputPath provided, generate a temporary output path
    if (!outputPath || outputPath.trim() === '') {
      try {
        const inputExt = path.extname(inputPath || '').toLowerCase();
        const ext = inputExt || '.txt';
        const baseName = path.basename(inputPath || 'output', inputExt || '');
        const tempDir = app.getPath('temp');
        const uniqueName = `${baseName}-processed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        outputPath = path.join(tempDir, uniqueName);
      } catch (_e) {
        // fallback
        outputPath = path.join(app.getPath('temp'), `processed-${Date.now()}.txt`);
      }
    }

    // Prefer compiled binary when available
    const compiled = trySpawnCompiled();
    if (compiled) {
      attachHandlers(compiled);
      return;
    }

    // Fallback to Python
    const pythonEnv = Object.assign({}, process.env, {
      DOCMASK_ENTITY_POLICY: (() => {
        try {
          return JSON.stringify(policy || {});
        } catch (_e) {
          return '{}';
        }
      })()
    });
    const pythonCandidates = process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
    let pythonProc = null;
    for (const cmd of pythonCandidates) {
      try {
        pythonProc = spawn(cmd, [scriptPath, inputPath, outputPath], { env: pythonEnv });
        break;
      } catch (_e) {
        // try next candidate
      }
    }
    if (pythonProc) {
      pythonProc.__attemptedFallback = true;
      attachHandlers(pythonProc);
      return;
    }

    resolve({
      status: 'error',
      message: 'Failed to start processor',
      error: `No usable processor found. Tried compiled at ${compiledPath} and Python at ${scriptPath}`
    });
  });
});

// Generate dry-run report
ipcMain.handle('generate-dry-run-report', async (event, { inputPath, policy }) => {
  return new Promise((resolve) => {
    try {
      // For now, provide a simple preview without actual processing
      // This avoids the complexity of setting up the full dry-run functionality

      // Check if the input file exists
      if (!fs.existsSync(inputPath)) {
        resolve({
          status: 'error',
          message: 'Input file not found',
          error: `File does not exist: ${inputPath}`
        });
        return;
      }

      // Get basic file information
      const stats = fs.statSync(inputPath);
      const fileSize = stats.size;
      const fileName = path.basename(inputPath);
      const fileExt = path.extname(inputPath).toLowerCase();

      // Provide a basic preview response
      const result = {
        status: 'success',
        message: 'Preview ready',
        file_info: {
          name: fileName,
          size: fileSize,
          extension: fileExt,
          size_mb: (fileSize / (1024 * 1024)).toFixed(2)
        },
        preview_note: 'This is a basic preview. The actual processing will detect and mask PII entities like names, addresses, emails, phone numbers, and other sensitive information.',
        entities_found: 'Will be detected during processing',
        policy_applied: policy && Object.keys(policy).length > 0 ? 'Custom policy will be applied' : 'Default policy will be applied'
      };

      resolve(result);
    } catch (error) {
      resolve({
        status: 'error',
        message: 'Preview failed',
        error: error.message
      });
    }
  });
});

// Copy a file to destination (optionally overwriting)
ipcMain.handle('copy-file', async (_event, { src, dest, overwrite }) => {
  try {
    if (!src || !dest) {
      return { status: 'error', message: 'src and dest are required' };
    }
    const destDir = path.dirname(dest);
    await fs.promises.mkdir(destDir, { recursive: true });
    try {
      if (!overwrite) {
        await fs.promises.copyFile(src, dest, fs.constants.COPYFILE_EXCL);
      } else {
        await fs.promises.copyFile(src, dest);
      }
    } catch (err) {
      return { status: 'error', message: String(err) };
    }
    return { status: 'success', dest };
  } catch (error) {
    return { status: 'error', message: String(error) };
  }
});

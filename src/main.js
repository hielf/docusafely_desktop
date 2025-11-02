const { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');

let mainWindow;

// Detect platform override for testing
function getPlatform() {
  const override = process.env.DOCUSAFELY_PLATFORM;
  if (override) {
    console.log(`[Platform Override] Using ${override} platform for testing`);
    return override;
  }
  return process.platform;
}

function createWindow() {
  const platform = getPlatform();
  const isMac = platform === 'darwin';
  const isWindows = platform === 'win32';
  const isLinux = platform === 'linux';

  // Base window configuration
  const windowConfig = {
    width: 600,
    height: 400,
    minWidth: 550,
    minHeight: 350,
    backgroundColor: isMac ? '#00000000' : (nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  };

  // Platform-specific configurations
  if (isMac) {
    // macOS: Frameless with vibrancy and hiddenInset title bar
    windowConfig.frame = false;
    windowConfig.titleBarStyle = 'hidden';
    windowConfig.vibrancy = 'sidebar'; // macOS vibrancy effect
    windowConfig.transparent = true;
  } else if (isWindows) {
    // Windows: Frameless with overlay title bar
    windowConfig.frame = false;
    windowConfig.titleBarStyle = 'hidden';
    windowConfig.titleBarOverlay = true;
  } else if (isLinux) {
    // Linux: Frameless window
    windowConfig.frame = false;
    windowConfig.titleBarStyle = 'hidden';
    windowConfig.backgroundColor = nativeTheme.shouldUseDarkColors ? '#2b2b2b' : '#ffffff';
  }

  mainWindow = new BrowserWindow(windowConfig);

  // Attach titlebar to window
  attachTitlebarToWindow(mainWindow);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Platform-specific initialization
  if (isMac) {
    setupMacOSFeatures();
  } else if (isWindows) {
    setupWindowsFeatures();
  } else if (isLinux) {
    setupLinuxFeatures();
  }

  // Listen for theme changes
  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Notify renderer process of theme change
      mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors);
    }
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function setupMacOSFeatures() {
  // macOS Dock badge support
  if (app.dock) {
    // Example: Set badge when processing
    // app.dock.setBadge('');

    // Create Dock menu
    const dockMenu = Menu.buildFromTemplate([
      { label: 'Process Document', click: () => mainWindow.webContents.send('dock-action', 'process') },
      { label: 'Preferences', click: () => mainWindow.webContents.send('dock-action', 'prefs') },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    app.dock.setMenu(dockMenu);
  }
}

function setupWindowsFeatures() {
  // Windows Taskbar progress bar example
  // mainWindow.setProgressBar(0.5); // 50% progress

  // Windows Jump List
  if (app.setJumpList) {
    app.setJumpList({
      categories: [
        {
          name: 'Tasks',
          items: [
            { type: 'task', title: 'Process Document', program: process.execPath, args: '--process' },
            { type: 'task', title: 'Open Settings', program: process.execPath, args: '--settings' }
          ]
        },
        {
          name: 'Recent Files',
          items: [] // Will be populated with actual recent files
        }
      ]
    });
  }
}

function setupLinuxFeatures() {
  // Linux system tray would go here
  // Note: Tray requires 'electron' Tray class
}

// Create native application menu
function createMenu() {
  const platform = getPlatform();
  const isMac = platform === 'darwin';
  const isWindows = platform === 'win32';

  const template = [];

  // macOS: File menu
  if (isMac) {
    template.push({
      label: app.getName(),
      submenu: [
        { role: 'about', label: `About ${app.getName()}` },
        { type: 'separator' },
        { role: 'services', label: 'Services' },
        { type: 'separator' },
        { role: 'hide', label: `Hide ${app.getName()}` },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: `Quit ${app.getName()}` }
      ]
    });
  }

  // File menu
  template.push({
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        accelerator: 'CmdOrCtrl+O',
        click: () => mainWindow.webContents.send('menu-action', 'open-file')
      },
      {
        label: 'Process Document',
        accelerator: 'CmdOrCtrl+P',
        click: () => mainWindow.webContents.send('menu-action', 'process-document')
      },
      { type: 'separator' },
      { role: 'quit', label: isMac ? 'Quit' : 'Exit' }
    ]
  });

  // Edit menu
  template.push({
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { role: 'selectAll' }
    ]
  });

  // View menu
  template.push({
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  });

  // Window menu (macOS)
  if (isMac) {
    template.push({
      label: 'Window',
      submenu: [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    });
  }

  // Help menu
  template.push({
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        click: () => mainWindow.webContents.send('menu-action', 'documentation')
      },
      {
        label: 'About',
        click: () => mainWindow.webContents.send('menu-action', 'about')
      }
    ]
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  // Setup titlebar
  setupTitlebar();

  createMenu();
  createWindow();
});

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

// IPC handlers for window management
ipcMain.on('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isMaximized() : false;
});

ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors;
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

// Get entity mapping data for a session
ipcMain.handle('get-entity-mapping-report', async (_event, { sessionId }) => {
  try {
    if (!sessionId) {
      return { status: 'error', message: 'sessionId is required' };
    }

    // Determine mapping storage directory
    const storageDir = process.env.DOCUSAFELY_MAPPING_STORAGE_DIR ||
      path.join(app.getPath('temp'), 'docusafely_mappings');

    // Read session file
    const sessionFile = path.join(storageDir, `session_${sessionId}.json`);

    if (!fs.existsSync(sessionFile)) {
      return { status: 'error', message: `Session ${sessionId} not found` };
    }

    // Read session data
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));

    // Read all mapping files for this session
    const mappingFiles = fs.readdirSync(storageDir)
      .filter(f => f.startsWith(`mapping_${sessionId}_`) && f.endsWith('.json'))
      .map(f => path.join(storageDir, f));

    // Load all mappings
    const mappings = [];
    for (const mappingFile of mappingFiles) {
      try {
        const mappingData = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
        mappings.push(mappingData);
      } catch (err) {
        console.error(`Error reading mapping file ${mappingFile}:`, err);
      }
    }

    // Group mappings by entity type
    const entitiesByType = {};
    for (const mapping of mappings) {
      const entityType = mapping.entity_type || 'unknown';
      if (!entitiesByType[entityType]) {
        entitiesByType[entityType] = [];
      }
      entitiesByType[entityType].push({
        original_text: mapping.original_text,
        masked_text: mapping.masked_text,
        confidence: mapping.confidence || 1.0,
        position: mapping.position || {},
        policy_applied: mapping.policy_applied || {}
      });
    }

    // Build report
    const report = {
      status: 'success',
      session_id: sessionId,
      document_path: sessionData.document_path,
      document_hash: sessionData.document_hash,
      policy: sessionData.policy,
      created_at: sessionData.created_at,
      last_accessed: sessionData.last_accessed,
      status_text: sessionData.status,
      total_entities: sessionData.entity_count || mappings.length,
      entities_by_type: entitiesByType,
      mappings: mappings
    };

    return report;
  } catch (error) {
    return { status: 'error', message: String(error), error: error.message };
  }
});

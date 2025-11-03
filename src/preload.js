const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');

let titlebar;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform detection
  getPlatform: () => Promise.resolve(process.platform),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  selectInputFile: () => ipcRenderer.invoke('select-input-file'),
  selectOutputFile: (options) => ipcRenderer.invoke('select-output-file', options),
  processDocument: (data) => ipcRenderer.invoke('process-document', data),
  generateDryRunReport: (data) => ipcRenderer.invoke('generate-dry-run-report', data),
  copyFile: (src, dest, overwrite = false) => ipcRenderer.invoke('copy-file', { src, dest, overwrite }),
  saveDroppedFile: (fileName, fileData) => ipcRenderer.invoke('save-dropped-file', { fileName, fileData }),
  getEntityMappingReport: (data) => ipcRenderer.invoke('get-entity-mapping-report', data),
  // Window management
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  // Event listeners
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  onDockAction: (callback) => ipcRenderer.on('dock-action', (event, action) => callback(action)),
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', (event, isDark) => callback(isDark)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Initialize the custom title bar once the DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
  // Get initial theme via IPC
  let isDark = false;
  try {
    isDark = await ipcRenderer.invoke('get-theme');
  } catch (e) {
    console.error('Failed to get theme:', e);
  }

  titlebar = new Titlebar({
    backgroundColor: TitlebarColor.fromHex(isDark ? '#1e1e1e' : '#f5f5f5'),
    shadow: true,
    containerOverflow: 'hidden'
  });

  // Set custom title with bold "DocuSafely"
  titlebar.updateTitle('DocuSafely - Local entity secure tool');
});

// Keep the custom title bar theme in sync with the system theme
ipcRenderer.on('theme-changed', (_event, isDark) => {
  if (titlebar) {
    titlebar.updateBackground(TitlebarColor.fromHex(isDark ? '#1e1e1e' : '#f5f5f5'));
  }
});

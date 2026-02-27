const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Get app version
  getAppVersion: () => {
    ipcRenderer.send('app-version');
    return new Promise((resolve) => {
      ipcRenderer.once('app-version', (event, version) => {
        resolve(version);
      });
    });
  },
  
  // Check if running in Electron
  isElectron: true,
  
  // Platform information
  platform: process.platform,
});

// Security: Remove Node.js globals from window object
delete window.require;
delete window.exports;
delete window.module;

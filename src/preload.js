/**
 * Preload script to securely expose Electron APIs to the renderer process
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isPackaged: true // Will be useful for UI tweaks
});

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../backend/utils/logger');

// Store server reference
let serverProcess = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    title: 'YTMP3 PRO',
    icon: path.join(__dirname, '../frontend/assets/icon.ico'), // Make sure to add an icon later
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0a0a0b',
    show: false // Show only when ready
  });

  // Remove default menu
  mainWindow.setMenuBarVisibility(false);

  // Load the Express server URL
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * Start the Express backend as a separate process
 * This ensures that if the UI crashes, the server might stay or vice versa,
 * and it's cleaner for migration.
 */
function startBackend() {
  const serverPath = path.join(__dirname, '../backend/server.js');
  const downloadPath = app.getPath('downloads');
  
  // In production, we use the packaged node
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: app.isPackaged ? 'production' : 'development',
      PORT: 3000,
      DOWNLOAD_DIR: downloadPath,
      IS_ELECTRON: 'true',
      RESOURCES_PATH: process.resourcesPath
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  startBackend();
  
  // Wait a bit for server to start before opening window
  // A better way is to ping the health endpoint
  setTimeout(createWindow, 1500);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

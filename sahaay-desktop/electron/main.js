import { app, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let backendProcess;

function startBackend() {
  let backendPath;
  if (app.isPackaged) {
    // Production Path: inside the installed app's resources
    backendPath = path.join(process.resourcesPath, 'bin', 'sahaay-engine.exe');
  } else {
    // Development Path: relative to source
    backendPath = path.join(__dirname, '..', '..', 'sahaay', 'sahaay-backend-new.exe');
  }
  console.log('Spawning Backend Sidecar:', backendPath);

  backendProcess = spawn(backendPath, [], {
    cwd: path.dirname(backendPath),
    stdio: 'pipe',
    shell: false
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend]: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    const message = data.toString();
    if (message.includes('connect to http://localhost')) {
      // This is a standard Go informational log, not an error
      console.log(`[Backend Info]: ${message}`);
    } else {
      console.error(`[Backend Error]: ${message}`);
    }
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    frame: true, 
    backgroundColor: '#0F1115',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
    },
  });

  // Load URL - robust check for dev vs prod
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('Killing Backend Sidecar...');
    backendProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

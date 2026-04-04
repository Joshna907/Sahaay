import { spawn } from 'child_process';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// 1. Start Vite (React Dev Server) - Robust Local Path
console.log('Starting React Dev Server...');
const vitePath = path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');

// Should use node directly to avoid shell issues
const vite = spawn(process.execPath, [vitePath], {
  stdio: 'inherit',
  shell: false
});

// 2. Wait for Port 5173 then start Electron
const port = 5173;
const checkPort = () => {
  const socket = new net.Socket();
  socket.setTimeout(1000);
  
  socket.on('connect', () => {
    socket.destroy();
    console.log('React is ready. Launching Electron...');
    startElectron();
  });

  socket.on('timeout', () => {
    socket.destroy();
    setTimeout(checkPort, 1000);
  });

  socket.on('error', (err) => {
    socket.destroy();
    setTimeout(checkPort, 1000);
  });

  socket.connect(port, 'localhost');
};

function startElectron() {
  // Direct path to Electron binary on Windows (bypassing npx/npm wrappers)
  const electronPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe');
  
  console.log(`Launching Electron from: ${electronPath}`);
  
  const electron = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    shell: false
  });

  electron.on('close', (code) => {
    console.log(`Electron exited with code ${code}`);
    vite.kill();
    process.exit(code);
  });
}

// Start checking
checkPort();

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let backendProcess = null;

// Backend path
const BACKEND_PATH = path.join(__dirname, '..', 'Bhuban video stream app', 'backend');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        titleBarStyle: 'hiddenInset',
        show: false
    });

    // Load the developer dashboard
    mainWindow.loadFile('index.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Check if backend is already running
        checkBackendStatus();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
        // Kill backend process if running
        if (backendProcess) {
            backendProcess.kill();
        }
    });
}

// Check backend status
function checkBackendStatus() {
    const req = require('http').get('http://localhost:5000/api/health', (res) => {
        if (res.statusCode === 200) {
            mainWindow.webContents.send('backend-status', { running: true, port: 5000 });
        } else {
            mainWindow.webContents.send('backend-status', { running: false });
        }
    }).on('error', () => {
        mainWindow.webContents.send('backend-status', { running: false });
    });
    
    req.setTimeout(3000);
}

// IPC handlers
ipcMain.handle('start-backend', async () => {
    if (backendProcess) {
        return { success: false, error: 'Backend is already running' };
    }

    return new Promise((resolve) => {
        // Check if node_modules exists
        const nodeModulesPath = path.join(BACKEND_PATH, 'node_modules');
        
        if (!fs.existsSync(nodeModulesPath)) {
            // Need to install dependencies first
            mainWindow.webContents.send('terminal-output', {
                type: 'info',
                text: 'Installing dependencies... This may take a few minutes.'
            });

            const npmInstall = spawn('npm', ['install'], {
                cwd: BACKEND_PATH,
                shell: true
            });

            npmInstall.stdout.on('data', (data) => {
                mainWindow.webContents.send('terminal-output', {
                    type: 'info',
                    text: data.toString().trim()
                });
            });

            npmInstall.stderr.on('data', (data) => {
                mainWindow.webContents.send('terminal-output', {
                    type: 'warning',
                    text: data.toString().trim()
                });
            });

            npmInstall.on('close', (code) => {
                if (code === 0) {
                    mainWindow.webContents.send('terminal-output', {
                        type: 'success',
                        text: 'Dependencies installed successfully!'
                    });
                    startBackendServer(resolve);
                } else {
                    resolve({ success: false, error: 'Failed to install dependencies' });
                }
            });
        } else {
            startBackendServer(resolve);
        }
    });
});

function startBackendServer(resolve) {
    mainWindow.webContents.send('terminal-output', {
        type: 'info',
        text: 'Starting backend server...'
    });

    backendProcess = spawn('npm', ['start'], {
        cwd: BACKEND_PATH,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }
    });

    let serverStarted = false;

    backendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        
        // Check for successful startup indicators
        if (output.includes('Server running') || output.includes('port 5000')) {
            serverStarted = true;
            mainWindow.webContents.send('backend-status', { running: true, port: 5000 });
            if (resolve) resolve({ success: true });
        }
        
        mainWindow.webContents.send('terminal-output', {
            type: 'info',
            text: output
        });
    });

    backendProcess.stderr.on('data', (data) => {
        mainWindow.webContents.send('terminal-output', {
            type: 'error',
            text: data.toString().trim()
        });
    });

    backendProcess.on('error', (error) => {
        mainWindow.webContents.send('terminal-output', {
            type: 'error',
            text: `Failed to start backend: ${error.message}`
        });
        if (resolve) resolve({ success: false, error: error.message });
    });

    backendProcess.on('close', (code) => {
        backendProcess = null;
        mainWindow.webContents.send('backend-status', { running: false });
        mainWindow.webContents.send('terminal-output', {
            type: 'warning',
            text: `Backend process exited with code ${code}`
        });
    });

    // Timeout if server doesn't start
    setTimeout(() => {
        if (!serverStarted && resolve) {
            resolve({ success: false, error: 'Server start timeout' });
        }
    }, 30000);
}

ipcMain.handle('stop-backend', async () => {
    if (!backendProcess) {
        return { success: false, error: 'Backend is not running' };
    }

    backendProcess.kill();
    backendProcess = null;
    
    mainWindow.webContents.send('backend-status', { running: false });
    
    return { success: true };
});

ipcMain.handle('check-backend', async () => {
    return new Promise((resolve) => {
        const req = require('http').get('http://localhost:5000/api/health', (res) => {
            resolve({ running: res.statusCode === 200, port: 5000 });
        }).on('error', () => {
            resolve({ running: false });
        });
        req.setTimeout(3000);
    });
});

ipcMain.handle('open-external-terminal', async () => {
    const command = `start cmd.exe /k "cd /d \\"${BACKEND_PATH}\\" && echo Bhuban Backend Directory && echo Run: npm start to start the server"`;
    exec(command, (error) => {
        if (error) {
            dialog.showErrorBox('Error', 'Failed to open terminal: ' + error.message);
        }
    });
    return { success: true };
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        require('electron').shell.openExternal(navigationUrl);
    });
});

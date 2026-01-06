const { app, BrowserWindow, clipboard, ipcMain, nativeImage, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const db = require('./db');
const settings = require('./settings');
const { exec } = require('child_process');

let mainWindow;
let tray = null;
let lastText = '';
let lastImage = ''; 
let currentConfig = settings.load();

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send('window-shown');
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('com.clipboardpro.app');
    createWindow();
    createTray();
    startClipboardWatcher();
    registerGlobalShortcut();
    
    app.setLoginItemSettings({
        openAtLogin: currentConfig.startAtLogin,
        path: process.execPath,
        args: ['--process-start-args', `"--hidden"`]
    });
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, 'tray.png');
  mainWindow = new BrowserWindow({
    width: 300,
    height: 700,
    icon: iconPath,
    frame: false, 
    show: false, 
    skipTaskbar: true,
    resizable: false,
    alwaysOnTop: true,
    transparent: true,
    vibrancy: 'fullscreen-ui', 
    backgroundMaterial: 'mica', 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      backgroundThrottling: false 
    }
  });

  if (app.isPackaged) {
      mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  } else {
      mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('blur', () => {
     mainWindow.hide(); 
  });
}

function createTray() {
    let iconPath;
    if (app.isPackaged) {
        // Absolute path in production resources
        iconPath = path.join(process.resourcesPath, 'app', 'src', 'main', 'red_tray.png');
    } else {
        iconPath = path.join(__dirname, 'red_tray.png');
    }

    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    tray.setToolTip('Clipboard Pro');
    
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('window-shown');
        }
    });

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Clipboard', click: () => {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('window-shown');
        }},
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ]);
    
    tray.setContextMenu(contextMenu);
}

function registerGlobalShortcut() {
    globalShortcut.unregisterAll();
    const ret = globalShortcut.register(currentConfig.shortcut || 'CommandOrControl+Shift+V', () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('window-shown');
        }
    });

    if (!ret) {
        console.log('Registration failed for shortcut');
    }
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

function startClipboardWatcher() {
  setInterval(async () => {
    try {
        const text = clipboard.readText();
        const image = clipboard.readImage();
    
        let changed = false;

        if (text && text !== lastText && text.trim().length > 0) {
          lastText = text;
          await db.addHistory('text', text, text.substring(0, 100));
          changed = true;
        }
    
        if (!image.isEmpty()) {
          const dataUrl = image.toDataURL();
          if (dataUrl !== lastImage) {
            lastImage = dataUrl;
            const filePath = db.saveImage(image.toPNG());
            await db.addHistory('image', filePath, dataUrl); 
            changed = true;
          }
        }

        if (changed) {
            await db.pruneHistory(currentConfig.maxItems || 100);
            await refreshUI();
        }

    } catch (e) {
        console.error("Clipboard polling error:", e);
    }
  }, 1000);
}

async function refreshUI() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const history = await db.getHistory();
    mainWindow.webContents.send('clipboard-updated', history);
  }
}

ipcMain.handle('get-history', (event, limit, offset) => db.getHistory(limit, offset));
ipcMain.handle('search-history', (event, query) => db.searchHistory(query));
ipcMain.handle('delete-item', async (event, id) => {
    await db.deleteItem(id);
    return db.getHistory();
});
ipcMain.handle('toggle-favorite', async (event, id) => {
    await db.toggleFavorite(id);
    return db.getHistory();
});
ipcMain.handle('clear-history', async () => {
    await db.clearHistory();
    return db.getHistory();
});

ipcMain.handle('get-settings', () => currentConfig);
ipcMain.handle('save-settings', (event, newSettings) => {
    settings.save(newSettings);
    currentConfig = newSettings;
    registerGlobalShortcut(); 
    return true;
});

ipcMain.handle('paste-item', (event, item) => {
    if (item.type === 'text') {
        clipboard.writeText(item.content);
        lastText = item.content; 
    } else if (item.type === 'image') {
        const image = nativeImage.createFromPath(item.content);
        clipboard.writeImage(image);
        lastImage = image.toDataURL();
    }

    mainWindow.minimize();
    mainWindow.hide();

    // With asar:false, paste.py is just a file next to main.js
    const pythonScript = path.join(__dirname, 'paste.py');
    
    setTimeout(() => {
        exec(`python "${pythonScript}"`, (error, stdout, stderr) => {
            if (error) {
                console.error("Python paste failed:", error);
            }
        });
    }, 100);
});

ipcMain.handle('window-close', () => mainWindow.hide());
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-resize', (event, width, height) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        const bounds = mainWindow.getBounds();
        if (bounds.width !== width) {
            mainWindow.setSize(width, bounds.height, true);
        }
    }
});
ipcMain.handle('app-quit', () => app.quit());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Path where habits are saved (inside user data folder)
const DATA_PATH = path.join(app.getPath('userData'), 'habits.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 720,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    title: 'Streakly – Habit Tracker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Optional: open DevTools during development
  // win.webContents.openDevTools();
}

// ===== Node.js File Storage (Main Process) =====

function readHabitsFromFile() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading habits:', err);
  }
  return [];
}

function writeHabitsToFile(habits) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(habits, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing habits:', err);
    return false;
  }
}

// IPC handlers – called from renderer via preload
ipcMain.handle('habits:load', () => {
  return readHabitsFromFile();
});

ipcMain.handle('habits:save', (event, habits) => {
  return writeHabitsToFile(habits);
});

// ===== App Lifecycle =====

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
  loadHabits: () => ipcRenderer.invoke('habits:load'),
  saveHabits: (habits) => ipcRenderer.invoke('habits:save', habits)
});

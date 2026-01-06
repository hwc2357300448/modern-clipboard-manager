const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getHistory: (limit, offset) => ipcRenderer.invoke('get-history', limit, offset),
  searchHistory: (query) => ipcRenderer.invoke('search-history', query),
  deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
  toggleFavorite: (id) => ipcRenderer.invoke('toggle-favorite', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  
  // This now triggers the auto-paste logic in Main
  pasteItem: (item) => ipcRenderer.invoke('paste-item', item), 
  
  copyItem: (item) => ipcRenderer.invoke('copy-item', item), 
  
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  resizeWindow: (width, height) => ipcRenderer.invoke('window-resize', width, height),

  closeWindow: () => ipcRenderer.invoke('window-close'),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  quitApp: () => ipcRenderer.invoke('app-quit'),
  
  onUpdate: (callback) => ipcRenderer.on('clipboard-updated', (event, data) => callback(data)),
  onShow: (callback) => ipcRenderer.on('window-shown', () => callback())
});
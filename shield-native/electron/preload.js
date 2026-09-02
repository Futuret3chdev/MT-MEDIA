const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('shieldNative', {
  platform: process.platform,
  scan: () => ipcRenderer.invoke('scan'),
  panic: () => ipcRenderer.invoke('panic'),
});

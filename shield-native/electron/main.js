const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

let win;
let tray;

function scanIfaces() {
  const out = [];
  const map = os.networkInterfaces();
  for (const [name, list] of Object.entries(map)) {
    const addrs = (list || []).filter((x) => x.family === 'IPv4' && !x.internal).map((x) => x.address);
    out.push({ name, addrs, mac: (list && list[0] && list[0].mac) || '' });
  }
  return out;
}

function panic() {
  const plat = process.platform;
  if (plat === 'darwin') {
    exec('launchctl unload -w /System/Library/LaunchDaemons/ssh.plist 2>/dev/null; defaults write /Library/Preferences/com.apple.RemoteManagement.plist RemoteManagementEnabled -bool false');
    return Promise.resolve('Asked macOS to disable Remote Management / SSH on this Mac. Check System Settings → Sharing.');
  }
  if (plat === 'win32') {
    exec('netsh advfirewall set allprofiles state on');
    return Promise.resolve('Windows firewall profiles on. Turn off File sharing in Settings → Network if it is still open.');
  }
  return Promise.resolve('Lock sharing in your OS settings. Shield will not attack other machines.');
}

function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 720,
    title: 'Shield',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '..', 'web', 'index.html'));
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '..', 'web', 'icon-32.png'));
  tray = new Tray(icon);
  tray.setToolTip('Shield');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Shield', click: () => { if (win) win.show(); else createWindow(); } },
    { label: 'Quit', click: () => app.quit() },
  ]));
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});
app.on('window-all-closed', (e) => {
  e.preventDefault();
  if (win) win.hide();
});

ipcMain.handle('scan', () => scanIfaces());
ipcMain.handle('panic', () => panic());
ipcMain.handle('platform', () => process.platform);

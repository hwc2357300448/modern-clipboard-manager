const { app } = require('electron');
const path = require('path');
const fs = require('fs-extra');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings = {
  maxItems: 100,
  startAtLogin: false,
  themeColor: '#3b82f6', // Default Blue-500
  shortcut: 'Ctrl+Shift+V'
};

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return { ...defaultSettings, ...fs.readJsonSync(settingsPath) };
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  try {
    fs.writeJsonSync(settingsPath, settings);
    
    // Apply System Changes
    app.setLoginItemSettings({
      openAtLogin: settings.startAtLogin,
      path: process.execPath,
      args: [
        '--process-start-args', `"--hidden"` 
      ]
    });
    
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

module.exports = {
  load: loadSettings,
  save: saveSettings
};

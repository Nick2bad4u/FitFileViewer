/* eslint-env node */
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');

const settingsPath = path.join(app.getPath('userData'), 'window-state.json');

function getWindowState() {
	try {
		return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
	} catch {
		return { width: 1200, height: 800 };
	}
}

function saveWindowState(win) {
	if (!win.isMinimized() && !win.isMaximized()) {
		const bounds = win.getBounds();
		fs.writeFileSync(settingsPath, JSON.stringify(bounds));
	}
}

function createWindow() {
	const state = getWindowState();
	const win = new BrowserWindow({
		width: state.width,
		height: state.height,
		x: typeof state.x === 'number' ? state.x : undefined,
		y: typeof state.y === 'number' ? state.y : undefined,
		icon: path.join(__dirname, 'icons/favicon.ico'), // Set proper app icon for Windows
		autoHideMenuBar: false, // Ensure menu is always visible, especially on Linux
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
		},
	});
	win.setMenuBarVisibility(true); // Ensure menu bar is always visible
	win.loadFile('index.html');
	win.on('close', () => saveWindowState(win));
	return win;
}

module.exports = {
	getWindowState,
	saveWindowState,
	settingsPath,
	createWindow,
};

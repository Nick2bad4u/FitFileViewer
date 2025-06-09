/* eslint-env node */
const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const { createWindow } = require('./windowStateUtils');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const { loadRecentFiles, addRecentFile } = require('./utils/recentFiles');
const { buildAppMenu } = require('./utils/buildAppMenu');

let loadedFitFilePath = null;

// --- Auto-Updater Setup ---
function setupAutoUpdater(mainWindow) {
	// Set feed URL if needed (autoUpdater will use GitHub by default if configured in package.json)
	autoUpdater.autoDownload = true;

	try {
		const log = require('electron-log');
		if (log) {
			autoUpdater.logger = log;
		} else {
			console.warn('Logger initialization failed. Falling back to console logging.');
			autoUpdater.logger = console;
		}
	} catch (err) {
		console.error('Error initializing logger:', err);
		autoUpdater.logger = console;
	}
	autoUpdater.logger.transports.file.level = 'info';

	// Debug: Log the update feed URL
	if (autoUpdater.feedURL !== undefined && autoUpdater.feedURL !== null) {
		autoUpdater.logger.info(`AutoUpdater feed URL: ${autoUpdater.feedURL}`);
		console.log(`AutoUpdater feed URL: ${autoUpdater.feedURL}`);
	} else {
		autoUpdater.logger.info('AutoUpdater using default feed (likely GitHub releases)');
		console.log('AutoUpdater using default feed (likely GitHub releases)');
	}

	autoUpdater.on('checking-for-update', () => {
		if (isWindowUsable(mainWindow)) mainWindow.webContents.send('update-checking');
	});
	autoUpdater.on('update-available', (info) => {
		if (isWindowUsable(mainWindow)) mainWindow.webContents.send('update-available', info);
	});
	autoUpdater.on('update-not-available', (info) => {
		if (isWindowUsable(mainWindow)) mainWindow.webContents.send('update-not-available', info);
	});
	autoUpdater.on('error', (err) => {
		const errorMessage = err == null ? 'unknown' : err.message || err.toString();
		autoUpdater.logger.error(`AutoUpdater Error: ${errorMessage}`);
		if (isWindowUsable(mainWindow)) mainWindow.webContents.send('update-error', errorMessage);
	});
	autoUpdater.on('download-progress', (progressObj) => {
		if (isWindowUsable(mainWindow)) mainWindow.webContents.send('update-download-progress', progressObj);
	});
	autoUpdater.on('update-downloaded', (info) => {
		if (isWindowUsable(mainWindow)) mainWindow.webContents.send('update-downloaded', info);
		const menu = Menu.getApplicationMenu();
		if (menu) {
			const restartItem = menu.getMenuItemById('restart-update');
			if (restartItem && restartItem.enabled !== undefined) {
				restartItem.enabled = true;
			}
		}
	});
}

// Register IPC handlers and create the main window when the app is ready
app.whenReady().then(() => {
	// Register file open dialog handler
	const mainWindow = createWindow();

	// --- Auto-Updater ---
	setupAutoUpdater(mainWindow);
	autoUpdater.checkForUpdatesAndNotify();

	// Helper to update menu with current theme from renderer
	async function updateMenuWithCurrentTheme(win) {
		let theme = 'dark';
		try {
			theme = (await win.webContents.executeJavaScript('localStorage.getItem("ffv-theme")')) || 'dark';
		} catch (err) {
			console.error('Failed to get theme from renderer:', err);
		}
		buildAppMenu(win, theme, loadedFitFilePath);
	}

	// Get theme from localStorage in renderer
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.webContents
			.executeJavaScript('localStorage.getItem("ffv-theme")')
			.then((theme) => {
				buildAppMenu(mainWindow, theme || 'dark', loadedFitFilePath);
				mainWindow.webContents.send('set-theme', theme || 'dark');
			})
			.catch(() => {
				buildAppMenu(mainWindow, 'dark', loadedFitFilePath);
				mainWindow.webContents.send('set-theme', 'dark');
			});
	});

	// Always use the current theme for initial menu
	updateMenuWithCurrentTheme(mainWindow);

	// Theme persistence: set theme on window creation
	mainWindow.webContents.on('did-finish-load', () => {
		mainWindow.webContents
			.executeJavaScript('localStorage.getItem("ffv-theme")')
			.then((theme) => {
				mainWindow.webContents.send('set-theme', theme || 'dark');
			})
			.catch(() => {
				mainWindow.webContents.send('set-theme', 'dark');
			});
	});

	ipcMain.handle('dialog:openFile', async () => {
		try {
			const { canceled, filePaths } = await dialog.showOpenDialog({
				filters: [{ name: 'FIT Files', extensions: ['fit'] }],
				properties: ['openFile'],
			});
			if (canceled || filePaths.length === 0) return null;
			addRecentFile(filePaths[0]);
			loadedFitFilePath = filePaths[0];
			// Fetch current theme from renderer before rebuilding menu
			const win = BrowserWindow.getFocusedWindow() || mainWindow;
			let theme = 'dark';
			try {
				theme = (await win.webContents.executeJavaScript('localStorage.getItem("ffv-theme")')) || 'dark';
			} catch (err) {
				console.error('Failed to get theme from renderer:', err);
			}
			buildAppMenu(win, theme, loadedFitFilePath);
			return filePaths[0];
		} catch (err) {
			console.error('Error opening file dialog:', err);
			return null;
		}
	});

	ipcMain.on('fit-file-loaded', (event, filePath) => {
		loadedFitFilePath = filePath;
		const win = BrowserWindow.fromWebContents(event.sender);
		// eslint-disable-next-line no-unused-vars
		let theme = 'dark';
		if (win) {
			win.webContents.executeJavaScript('localStorage.getItem("ffv-theme")').then((theme) => {
				buildAppMenu(win, theme || 'dark', loadedFitFilePath);
			});
		}
	});

	// IPC: Get recent files
	ipcMain.handle('recentFiles:get', async () => {
		return loadRecentFiles();
	});

	// IPC: Add a file to recent files (for manual add if needed)
	ipcMain.handle('recentFiles:add', async (event, filePath) => {
		addRecentFile(filePath);
		// Fetch current theme from renderer before rebuilding menu
		const win = BrowserWindow.getFocusedWindow() || mainWindow;
		let theme = 'dark';
		try {
			theme = (await win.webContents.executeJavaScript('localStorage.getItem("ffv-theme")')) || 'dark';
		} catch (err) {
			console.error('Failed to get theme from renderer:', err);
		}
		buildAppMenu(win, theme, loadedFitFilePath);
		return loadRecentFiles();
	});

	// Add IPC handler for reading files
	ipcMain.handle('file:read', async (event, filePath) => {
		return new Promise((resolve, reject) => {
			fs.readFile(filePath, (err, data) => {
				if (err) {
					console.error('Error reading file:', err);
					reject(err);
				} else {
					resolve(data.buffer);
				}
			});
		});
	});

	// Add IPC handler for parsing FIT files
	ipcMain.handle('fit:parse', async (event, arrayBuffer) => {
		const fitParser = require('./fitParser');
		const buffer = Buffer.from(arrayBuffer);
		return await fitParser.decodeFitFile(buffer);
	});

	// Add IPC handler for decoding FIT files (for decodeFitFile)
	ipcMain.handle('fit:decode', async (event, arrayBuffer) => {
		const fitParser = require('./fitParser');
		const buffer = Buffer.from(arrayBuffer);
		return await fitParser.decodeFitFile(buffer);
	});

	// Add IPC handler for getting the current theme
	ipcMain.handle('theme:get', async () => {
		const { Conf } = require('electron-conf');
		const conf = new Conf({ name: 'settings' });
		return conf.get('theme', 'dark');
	});

	ipcMain.handle('map-tab:get', async () => {
		const { Conf } = require('electron-conf');
		const conf = new Conf({ name: 'settings' });
		return conf.get('selectedMapTab', 'map');
	});

	// Add IPC handler for getting the app version
	ipcMain.handle('getAppVersion', async () => {
		return app.getVersion();
	});

	// Add IPC handler for getting the Electron version
	ipcMain.handle('getElectronVersion', async () => {
		return process.versions.electron;
	});

	// Add IPC handler for getting the Node.js version
	ipcMain.handle('getNodeVersion', async () => {
		return process.versions.node;
	});

	// Add IPC handler for getting the Chrome version
	ipcMain.handle('getChromeVersion', async () => {
		return process.versions.chrome;
	});

	// Add IPC handler for getting the platform and architecture
	ipcMain.handle('getPlatformInfo', async () => {
		return {
			platform: process.platform,
			arch: process.arch,
		};
	});

	// Add IPC handler for license info
	ipcMain.handle('getLicenseInfo', async () => {
		try {
			const packageJsonPath = path.join(app.getAppPath(), 'package.json');
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
			return packageJson.license || 'Unknown';
		} catch (err) {
			console.error('Failed to read license from package.json:', err);
			return 'Unknown';
		}
	});

	// Listen for theme change from renderer and update menu
	ipcMain.on('theme-changed', (event, theme) => {
		const win = BrowserWindow.fromWebContents(event.sender);
		if (win) buildAppMenu(win, theme || 'dark', loadedFitFilePath);
	});

	// Listen for menu-triggered update check from renderer
	ipcMain.on('menu-check-for-updates', () => {
		autoUpdater.checkForUpdates();
	});

	// Optionally, allow renderer to trigger update install
	ipcMain.on('install-update', () => {
		if (process.platform === 'linux') {
			const { dialog } = require('electron');
			dialog.showMessageBox({
				type: 'info',
				title: 'Manual Update Required',
				message: 'On Linux, please download and install the latest version manually from the website.'
			});
			return;
		}
		try {
			autoUpdater.quitAndInstall();
		} catch (err) {
			console.error('Error during quitAndInstall:', err);
		}
	});
	ipcMain.on('menu-restart-update', () => {
		if (process.platform === 'linux') {
			const { dialog } = require('electron');
			dialog.showMessageBox({
				type: 'info',
				title: 'Manual Update Required',
				message: 'On Linux, please download and install the latest version manually from the website.'
			});
			return;
		}
		try {
			autoUpdater.quitAndInstall();
		} catch (err) {
			console.error('Error during quitAndInstall:', err);
		}
	});

	// --- IPC handlers for File menu actions ---
	ipcMain.on('menu-save-as', async (event) => {
		const win = BrowserWindow.fromWebContents(event.sender);
		if (!loadedFitFilePath) return;
		const { canceled, filePath } = await dialog.showSaveDialog(win, {
			title: 'Save As',
			defaultPath: loadedFitFilePath,
			filters: [
				{ name: 'FIT Files', extensions: ['fit'] },
				{ name: 'All Files', extensions: ['*'] },
			],
		});
		if (!canceled && filePath) {
			try {
				fs.copyFileSync(loadedFitFilePath, filePath);
				win.webContents.send('show-notification', 'File saved successfully.', 'success');
			} catch (err) {
				win.webContents.send('show-notification', `Save failed: ${err}`, 'error');
			}
		}
	});

	ipcMain.on('menu-export', async (event) => {
		const win = BrowserWindow.fromWebContents(event.sender);
		if (!loadedFitFilePath) return;
		const { canceled, filePath } = await dialog.showSaveDialog(win, {
			title: 'Export As',
			defaultPath: loadedFitFilePath.replace(/\.fit$/i, '.csv'),
			filters: [
				{ name: 'CSV (Summary Table)', extensions: ['csv'] },
				{ name: 'GPX (Track)', extensions: ['gpx'] },
				{ name: 'All Files', extensions: ['*'] },
			],
		});
		if (!canceled && filePath) {
			win.webContents.send('export-file', filePath);
		}
	});

	ipcMain.on('menu-restart-update', () => {
		autoUpdater.quitAndInstall();
	});

	ipcMain.on('set-fullscreen', (event, flag) => {
		const win = BrowserWindow.getFocusedWindow();
		if (win) win.setFullScreen(!!flag);
	});

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) {
			const win = createWindow();
			updateMenuWithCurrentTheme(win);
		} else {
			const win = BrowserWindow.getFocusedWindow() || mainWindow;
			if (win) updateMenuWithCurrentTheme(win);
		}
	});
});

// Prevent navigation to untrusted URLs
app.on('web-contents-created', (event, contents) => {
	contents.on('will-navigate', (event, navigationUrl) => {
		const allowedOrigins = ['file://', 'about:blank'];
		if (!allowedOrigins.some((origin) => navigationUrl.startsWith(origin))) {
			event.preventDefault();
		}
	});

	// Prevent new windows from opening untrusted URLs
	contents.setWindowOpenHandler(({ url }) => {
		const allowedOrigins = ['file://', 'about:blank'];
		if (!allowedOrigins.some((origin) => url.startsWith(origin))) {
			return { action: 'deny' };
		}
		return { action: 'allow' };
	});
});

// Gracefully quit the app on all windows closed (except macOS)
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit();
});

function isWindowUsable(win) {
	return win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed();
}

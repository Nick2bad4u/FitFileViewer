/* eslint-env node */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	/**
	 * Opens a file dialog and returns the selected file path(s).
	 * @returns {Promise<string[]>}
	 */
	openFile: () => ipcRenderer.invoke('dialog:openFile'),

	/**
	 * Opens a file dialog and returns the selected file path(s).
	 * Alias for openFile for compatibility.
	 * @returns {Promise<string[]>}
	 */
	openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

	/**
	 * Reads a file from the given file path and returns its contents as an ArrayBuffer.
	 * @param {string} filePath
	 * @returns {Promise<ArrayBuffer>}
	 */
	readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

	/**
	 * Parses a FIT file from an ArrayBuffer and returns the decoded data.
	 * @param {ArrayBuffer} arrayBuffer
	 * @returns {Promise<any>}
	 */
	parseFitFile: (arrayBuffer) => ipcRenderer.invoke('fit:parse', arrayBuffer),

	/**
	 * Decodes a FIT file from an ArrayBuffer and returns the parsed data.
	 * @param {ArrayBuffer} arrayBuffer
	 * @returns {Promise<any>}
	 */
	decodeFitFile: (arrayBuffer) => ipcRenderer.invoke('fit:decode', arrayBuffer),

	/**
	 * Gets the list of recent files.
	 * @returns {Promise<string[]>}
	 */
	recentFiles: () => ipcRenderer.invoke('recentFiles:get'),

	/**
	 * Adds a file to the recent files list.
	 * @param {string} filePath
	 * @returns {Promise<string[]>}
	 */
	addRecentFile: (filePath) => ipcRenderer.invoke('recentFiles:add', filePath),

	/**
	 * Gets the current theme from the main process.
	 * @returns {Promise<string>}
	 */
	getTheme: () => ipcRenderer.invoke('theme:get'),

	/**
	 * Gets the app version from the main process.
	 * @returns {Promise<string>}
	 */
	getAppVersion: () => ipcRenderer.invoke('getAppVersion'),

	/**
	 * Gets the Electron version.
	 * @returns {Promise<string>}
	 */
	getElectronVersion: () => ipcRenderer.invoke('getElectronVersion'),

	/**
	 * Gets the Node.js version.
	 * @returns {Promise<string>}
	 */
	getNodeVersion: () => ipcRenderer.invoke('getNodeVersion'),

	/**
	 * Gets the Chrome version.
	 * @returns {Promise<string>}
	 */
	getChromeVersion: () => ipcRenderer.invoke('getChromeVersion'),

	/**
	 * Gets the license info from the main process.
	 * @returns {Promise<string>}
	 */
	getLicenseInfo: () => ipcRenderer.invoke('getLicenseInfo'),

	/**
	 * Gets the platform and architecture.
	 * @returns {Promise<{platform: string, arch: string}>}
	 */
	getPlatformInfo: () => ipcRenderer.invoke('getPlatformInfo'),

	/**
	 * Registers a handler for the 'menu-open-file' event.
	 * @param {Function} callback
	 */
	onMenuOpenFile: (callback) => {
		ipcRenderer.on('menu-open-file', callback);
	},

	/**
	 * Registers a handler for the 'open-recent-file' event.
	 * @param {Function} callback
	 */
	onOpenRecentFile: (callback) => {
		ipcRenderer.on('open-recent-file', (event, filePath) => callback(filePath));
	},

	/**
	 * Registers a handler for the 'set-theme' event.
	 * @param {Function} callback
	 */
	onSetTheme: (callback) => ipcRenderer.on('set-theme', (event, theme) => callback(theme)),

	/**
	 * Sends a 'theme-changed' event to the main process.
	 * @param {string} theme
	 */
	sendThemeChanged: (theme) => ipcRenderer.send('theme-changed', theme),

	/**
	 * Registers a handler for the 'open-summary-column-selector' event.
	 * @param {Function} callback
	 */
	onOpenSummaryColumnSelector: (callback) => {
		ipcRenderer.on('open-summary-column-selector', callback);
	},

	/**
	 * Registers a generic handler for any IPC event (for internal use).
	 */
	onIpc: (channel, callback) => {
		ipcRenderer.on(channel, callback);
	},

	/**
	 * Send an IPC message to the main process.
	 * @param {string} channel
	 * @param {...any} args
	 */
	send: (channel, ...args) => ipcRenderer.send(channel, ...args),

	// --- Auto-Updater: Expose update-related IPC ---

	/**
	 * Listen for update events from the main process (auto-updater).
	 * @param {string} eventName
	 * @param {Function} callback
	 */
	onUpdateEvent: (eventName, callback) => {
		ipcRenderer.on(eventName, (event, ...args) => callback(...args));
	},

	/**
	 * Trigger a check for updates (menu or manual).
	 */
	checkForUpdates: () => ipcRenderer.send('menu-check-for-updates'),

	/**
	 * Trigger install of a downloaded update.
	 */
	installUpdate: () => ipcRenderer.send('install-update'),

	/**
	 * Sets the full screen mode.
	 * @param {boolean} flag
	 */
	setFullScreen: (flag) => ipcRenderer.send('set-fullscreen', flag),

	/**
	 * Expose ipcRenderer.invoke for direct use.
	 * @param {...any} args
	 * @returns {Promise<any>}
	 */
	invoke: (...args) => ipcRenderer.invoke(...args),

	/**
	 * Manually inject/reset the menu from the renderer (DevTools or app code).
	 * @param {string|null} theme
	 * @param {string|null} fitFilePath
	 * @returns {Promise<boolean>}
	 */
	injectMenu: (theme = null, fitFilePath = null) => ipcRenderer.invoke('devtools-inject-menu', theme, fitFilePath),
});

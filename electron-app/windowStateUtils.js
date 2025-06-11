/* eslint-env node */
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');

// Constants for better maintainability
const CONSTANTS = {
	FILES: {
		WINDOW_STATE: 'window-state.json'
	},
	DEFAULTS: {
		WINDOW: {
			width: 1200,
			height: 800,
			minWidth: 800,
			minHeight: 600
		}
	},
	PATHS: {
		ICONS: {
			FAVICON: 'icons/favicon.ico'
		},
		HTML: {
			INDEX: 'index.html'
		},
		PRELOAD: 'preload.js'
	},
	WEB_PREFERENCES: {
		nodeIntegration: false,
		contextIsolation: true,
		sandbox: true
	}
};

// Enhanced path resolution with error handling
function getSettingsPath() {
	try {
		const userDataPath = app.getPath('userData');
		return path.join(userDataPath, CONSTANTS.FILES.WINDOW_STATE);
	} catch (error) {
		console.error('[windowStateUtils] Error getting settings path:', error);
		// Fallback to current directory in case of error
		return path.join(process.cwd(), CONSTANTS.FILES.WINDOW_STATE);
	}
}

const settingsPath = getSettingsPath();

// Enhanced validation functions
function validateWindowState(state) {
	if (!state || typeof state !== 'object') {
		return false;
	}
	
	// Validate required properties
	const requiredProps = ['width', 'height'];
	for (const prop of requiredProps) {
		if (typeof state[prop] !== 'number' || state[prop] <= 0) {
			return false;
		}
	}
	
	// Validate optional position properties
	if (state.x !== undefined && typeof state.x !== 'number') {
		return false;
	}
	if (state.y !== undefined && typeof state.y !== 'number') {
		return false;
	}
	
	return true;
}

function validateWindow(win) {
	return win && typeof win === 'object' && !win.isDestroyed();
}

function sanitizeWindowState(state) {
	if (!validateWindowState(state)) {
		return { ...CONSTANTS.DEFAULTS.WINDOW };
	}
	
	// Ensure minimum dimensions
	const sanitized = {
		width: Math.max(state.width, CONSTANTS.DEFAULTS.WINDOW.minWidth),
		height: Math.max(state.height, CONSTANTS.DEFAULTS.WINDOW.minHeight)
	};
	
	// Include position if valid
	if (typeof state.x === 'number') {
		sanitized.x = state.x;
	}
	if (typeof state.y === 'number') {
		sanitized.y = state.y;
	}
	
	return sanitized;
}

// Enhanced error handling and logging
function logWithContext(level, message, context = {}) {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] [windowStateUtils] ${message}`;
	
	if (context && Object.keys(context).length > 0) {
		console[level](logMessage, context);
	} else {
		console[level](logMessage);
	}
}

/**
 * Retrieves the saved window state from disk with enhanced error handling
 * @returns {Object} Window state object with width, height, and optional x, y coordinates
 */
function getWindowState() {
	try {
		if (!fs.existsSync(settingsPath)) {
			logWithContext('info', 'Window state file does not exist, using defaults');
			return { ...CONSTANTS.DEFAULTS.WINDOW };
		}
		
		const data = fs.readFileSync(settingsPath, 'utf8');
		if (!data.trim()) {
			logWithContext('warn', 'Window state file is empty, using defaults');
			return { ...CONSTANTS.DEFAULTS.WINDOW };
		}
		
		const state = JSON.parse(data);
		const sanitizedState = sanitizeWindowState(state);
		
		logWithContext('info', 'Window state loaded successfully', { state: sanitizedState });
		return sanitizedState;
	} catch (error) {
		logWithContext('error', 'Error reading window state, using defaults:', { 
			error: error.message,
			path: settingsPath 
		});
		return { ...CONSTANTS.DEFAULTS.WINDOW };
	}
}

/**
 * Saves the current window state to disk with enhanced validation and error handling
 * @param {BrowserWindow} win - The Electron BrowserWindow instance
 */
function saveWindowState(win) {
	if (!validateWindow(win)) {
		logWithContext('error', 'Invalid window object provided to saveWindowState');
		return;
	}
	
	try {
		// Don't save state if window is minimized or maximized
		if (win.isMinimized() || win.isMaximized()) {
			logWithContext('info', 'Skipping window state save - window is minimized or maximized');
			return;
		}
		
		const bounds = win.getBounds();
		const state = sanitizeWindowState(bounds);
		
		// Ensure directory exists
		const dir = path.dirname(settingsPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		
		fs.writeFileSync(settingsPath, JSON.stringify(state, null, 2));
		logWithContext('info', 'Window state saved successfully', { state });
	} catch (error) {
		logWithContext('error', 'Error saving window state:', { 
			error: error.message,
			path: settingsPath 
		});
	}
}

/**
 * Creates a new BrowserWindow with enhanced configuration and error handling
 * @returns {BrowserWindow} The created BrowserWindow instance
 */
function createWindow() {
	try {
		const state = getWindowState();
		
		// Enhanced window configuration
		const windowConfig = {
			width: state.width,
			height: state.height,
			minWidth: CONSTANTS.DEFAULTS.WINDOW.minWidth,
			minHeight: CONSTANTS.DEFAULTS.WINDOW.minHeight,
			x: typeof state.x === 'number' ? state.x : undefined,
			y: typeof state.y === 'number' ? state.y : undefined,
			icon: path.join(__dirname, CONSTANTS.PATHS.ICONS.FAVICON),
			autoHideMenuBar: false,
			show: false, // Don't show until ready
			webPreferences: {
				preload: path.join(__dirname, CONSTANTS.PATHS.PRELOAD),
				...CONSTANTS.WEB_PREFERENCES
			},
		};
		
		logWithContext('info', 'Creating window with configuration', { config: windowConfig });
		
		const win = new BrowserWindow(windowConfig);
		
		// Enhanced window setup
		win.setMenuBarVisibility(true);
		
		// Enhanced event handlers
		win.on('close', () => {
			try {
				saveWindowState(win);
			} catch (error) {
				logWithContext('error', 'Error in window close handler:', { error: error.message });
			}
		});
		
		win.on('closed', () => {
			logWithContext('info', 'Window closed successfully');
		});
		
		// Show window when ready
		win.once('ready-to-show', () => {
			win.show();
			logWithContext('info', 'Window displayed successfully');
		});
		
		// Load the main HTML file
		win.loadFile(CONSTANTS.PATHS.HTML.INDEX).then(() => {
			logWithContext('info', 'Main HTML file loaded successfully');
		}).catch((error) => {
			logWithContext('error', 'Error loading main HTML file:', { error: error.message });
		});
		
		return win;
	} catch (error) {
		logWithContext('error', 'Error creating window:', { error: error.message });
		throw error;
	}
}

/**
 * Development and debugging helpers
 */
const devHelpers = {
	/**
	 * Get current window state configuration
	 */
	getConfig: () => ({
		constants: CONSTANTS,
		settingsPath,
		currentState: getWindowState()
	}),
	
	/**
	 * Reset window state to defaults
	 */
	resetState: () => {
		try {
			if (fs.existsSync(settingsPath)) {
				fs.unlinkSync(settingsPath);
				logWithContext('info', 'Window state reset to defaults');
				return true;
			}
			return false;
		} catch (error) {
			logWithContext('error', 'Error resetting window state:', { error: error.message });
			return false;
		}
	},
	
	/**
	 * Validate current settings file
	 */
	validateSettings: () => {
		try {
			const state = getWindowState();
			return {
				isValid: validateWindowState(state),
				state,
				path: settingsPath,
				exists: fs.existsSync(settingsPath)
			};
		} catch (error) {
			return {
				isValid: false,
				error: error.message,
				path: settingsPath,
				exists: false
			};
		}
	}
};

// Module exports with enhanced structure
module.exports = {
	// Core functions
	getWindowState,
	saveWindowState,
	createWindow,
	
	// Utility functions
	validateWindow,
	validateWindowState,
	sanitizeWindowState,
	
	// Constants and configuration
	settingsPath,
	CONSTANTS,
	
	// Development helpers (only in development)
	...(process.env.NODE_ENV === 'development' && { devHelpers }),
	
	// Version information
	version: '1.0.0'
};

// Log successful initialization
logWithContext('info', 'WindowStateUtils module initialized successfully');

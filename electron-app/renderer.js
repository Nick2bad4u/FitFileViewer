/**
 * @fileoverview Main renderer process entry point for FIT File Viewer
 * Handles application initialization, module loading, and event setup
 * @version 21.1.0
 */

// In electron-app/renderer.js

// ==========================================
// Type Definitions (JSDoc)
// ==========================================

/**
 * @typedef {Object} RendererDependencies
 * @property {HTMLElement} openFileBtn - Open file button element
 * @property {{value: boolean}} isOpeningFileRef - Reference to track file opening state
 * @property {Function} setLoading - Function to show/hide loading state
 * @property {Function} showNotification - Function to display notifications
 * @property {Function} handleOpenFile - Function to handle file opening
 * @property {Function} showUpdateNotification - Function to show update notifications
 * @property {Function} showAboutModal - Function to display about modal
 * @property {Function} applyTheme - Function to apply theme changes
 * @property {Function} listenForThemeChange - Function to listen for theme changes
 */

// ==========================================
// Utility Imports & Fallbacks
// ==========================================

// How to Use PerformanceMonitor.getMetrics()
// 1. Through Development Utilities (Recommended)
// Since you're in development mode, the performance monitor is exposed through the global development object:

// Get all performance metrics
// window.__renderer_dev.getPerformanceMetrics()

// Or access the PerformanceMonitor directly
// window.__renderer_dev.PerformanceMonitor.getMetrics()

// You can also access individual methods
// window.__renderer_dev.PerformanceMonitor.start('my_operation')
// window.__renderer_dev.PerformanceMonitor.end('my_operation')

// 2. Available Development Commands
// Try these in your browser console:

// See all available development utilities
// console.log(window.__renderer_dev)

//Get current performance metrics
// window.__renderer_dev.getPerformanceMetrics()

//Get application state
// window.__renderer_dev.appState

//Get app information
// window.__renderer_dev.APP_INFO

//Validate DOM elements
// window.__renderer_dev.validateDOM()

//Reinitialize the application (if needed)
// window.__renderer_dev.reinitialize()

//3. Real-time Performance Monitoring
//You can also monitor performance in real-time:

//Start timing a custom operation
// window.__renderer_dev.PerformanceMonitor.start('file_processing')

//... do some work ...

//End timing and get the duration
// const duration = window.__renderer_dev.PerformanceMonitor.end('file_processing')
// console.log(`Operation took ${duration}ms`)

//4. Check What Metrics Are Already Available
//This should show you metrics like:

//See what performance metrics have been collected so far
// const metrics = window.__renderer_dev.getPerformanceMetrics()
// console.table(metrics)

// app_initialization - How long the app took to initialize
// theme_setup - Theme system setup time
// listeners_setup - Event listeners setup time
// async_components - Async components initialization time

// Try this first command to see your current metrics:

// window.__renderer_dev.getPerformanceMetrics();

// ==========================================

// Legacy utility fallbacks for backwards compatibility
const rendererUtils = window.rendererUtils || {};
const setLoading = rendererUtils.setLoading || function(isLoading) {
	console.warn('[Renderer] setLoading fallback called:', isLoading);
};

const themeUtils = window.theme || {};
const applyTheme = themeUtils.applyTheme || function(theme) {
	console.warn('[Renderer] applyTheme fallback called:', theme);
};

const listenForThemeChange = themeUtils.listenForThemeChange || (() => {
	console.warn('[Renderer] listenForThemeChange fallback called');
});

// ==========================================
// Modern ES6 Module Imports
// ==========================================

import { showNotification } from './utils/showNotification.js';
import { handleOpenFile } from './utils/handleOpenFile.js';
import { setupTheme } from './utils/setupTheme.js';
import { showUpdateNotification } from './utils/showUpdateNotification.js';
import { setupListeners } from './utils/listeners.js';
import { showAboutModal } from './utils/aboutModal.js';
import { createExportGPXButton } from './utils/mapActionButtons.js';

// ==========================================
// Environment Detection
// ==========================================

/**
 * Detects if the application is running in development mode
 * Since process is not available in renderer, we use alternative methods
 * @returns {boolean} True if in development mode
 */
function isDevelopmentMode() {
	// Check for development indicators
	return (
		// Check if localhost or dev domains
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1' ||
		window.location.hostname.includes('dev') ||
		// Check for dev tools being open
		window.__DEVELOPMENT__ === true ||
		// Check for debug flag in URL
		window.location.search.includes('debug=true') ||
		// Check for development build indicators
		document.documentElement.hasAttribute('data-dev-mode') ||
		// Check if running from file:// protocol (dev mode indicator)
		window.location.protocol === 'file:' ||
		// Check if electron dev tools are available
		window.electronAPI && typeof window.electronAPI.__devMode !== 'undefined' ||
		// Check console availability and development-specific globals
		(typeof console !== 'undefined' && window.location.href.includes('electron'))
	);
}

/**
 * Gets the current environment name
 * @returns {string} Environment name
 */
function getEnvironment() {
	return isDevelopmentMode() ? 'development' : 'production';
}

// ==========================================
// Application State
// ==========================================

/**
 * Application state management
 * @type {{isInitialized: boolean, isOpeningFile: boolean, startTime: number}}
 */
const appState = {
	isInitialized: false,
	isOpeningFile: false,
	startTime: performance.now()
};

/**
 * Reference object for tracking file opening state
 * Used by various components to prevent concurrent file operations
 * @type {{value: boolean}}
 */
const isOpeningFileRef = { value: false };

// ==========================================
// Error Handling
// ==========================================

/**
 * Global error handler for unhandled promise rejections
 * @param {PromiseRejectionEvent} event - The unhandled rejection event
 */
function handleUnhandledRejection(event) {
	console.error('[Renderer] Unhandled promise rejection:', event.reason);
	showNotification(`Application error: ${event.reason?.message || 'Unknown error'}`, 'error', 5000);
	
	// Prevent default browser behavior
	event.preventDefault();
}

/**
 * Global error handler for uncaught exceptions
 * @param {ErrorEvent} event - The error event
 */
function handleUncaughtError(event) {
	console.error('[Renderer] Uncaught error:', event.error);
	showNotification(`Critical error: ${event.error?.message || 'Unknown error'}`, 'error', 7000);
}

// ==========================================
// DOM Ready & Initialization
// ==========================================

/**
 * Validates that required DOM elements exist
 * @returns {boolean} True if all required elements are present
 */
function validateDOMElements() {
	const requiredElements = [
		{ id: 'openFileBtn', name: 'Open File button' },
		{ id: 'notification', name: 'Notification container' },
		{ id: 'loadingOverlay', name: 'Loading overlay' }
	];

	const missingElements = requiredElements.filter(({ id }) => !document.getElementById(id));
	
	if (missingElements.length > 0) {
		const missing = missingElements.map(({ name }) => name).join(', ');
		console.error('[Renderer] Missing required DOM elements:', missing);
		
		// Try to show notification even if notification element might be missing
		try {
			showNotification(`Critical: Missing UI elements: ${missing}`, 'error', 10000);
		} catch (error) {
			console.error('[Renderer] Could not show notification:', error);
		}
		return false;
	}
	
	return true;
}

/**
 * Initializes the application after DOM is ready
 * @returns {Promise<void>}
 */
async function initializeApplication() {
	PerformanceMonitor.start('app_initialization');
	
	try {
		console.log('[Renderer] Starting application initialization...');
		
		// Validate DOM elements first
		if (!validateDOMElements()) {
			throw new Error('Required DOM elements are missing');
		}

		// Get required DOM elements
		const openFileBtn = document.getElementById('openFileBtn');
		
		// Setup global error handlers
		window.addEventListener('unhandledrejection', handleUnhandledRejection);
		window.addEventListener('error', handleUncaughtError);

		// Create dependencies object for setup functions
		const dependencies = {
			openFileBtn,
			isOpeningFileRef,
			setLoading,
			showNotification,
			handleOpenFile,
			showUpdateNotification,
			showAboutModal,
			applyTheme,
			listenForThemeChange,
		};

		// Initialize core components
		await initializeComponents(dependencies);
		
		// Mark application as initialized
		appState.isInitialized = true;
		
		const initTime = PerformanceMonitor.end('app_initialization');
		console.log(`[Renderer] Application initialized successfully in ${initTime.toFixed(2)}ms`);
		
		// Show success notification for development
		if (isDevelopmentMode()) {
			showNotification(`App initialized in ${initTime.toFixed(0)}ms`, 'success', 3000);
		}
		
	} catch (error) {
		PerformanceMonitor.end('app_initialization');
		console.error('[Renderer] Failed to initialize application:', error);
		showNotification(`Initialization failed: ${error.message}`, 'error', 10000);
		throw error;
	}
}

/**
 * Initializes all application components in proper order
 * @param {RendererDependencies} dependencies - Application dependencies
 * @returns {Promise<void>}
 */
async function initializeComponents(dependencies) {
	try {
		// 1. Setup theme system first (affects all UI)
		PerformanceMonitor.start('theme_setup');
		console.log('[Renderer] Setting up theme system...');
		setupTheme(dependencies.applyTheme, dependencies.listenForThemeChange);
		PerformanceMonitor.end('theme_setup');
		
		// 2. Setup event listeners
		PerformanceMonitor.start('listeners_setup');
		console.log('[Renderer] Setting up event listeners...');
		setupListeners(dependencies);
		PerformanceMonitor.end('listeners_setup');
		
		// 3. Initialize any async components
		PerformanceMonitor.start('async_components');
		console.log('[Renderer] Initializing async components...');
		await initializeAsyncComponents();
		PerformanceMonitor.end('async_components');
		
		console.log('[Renderer] All components initialized successfully');
		
	} catch (error) {
		console.error('[Renderer] Component initialization failed:', error);
		throw error;
	}
}

/**
 * Initializes components that require async operations
 * @returns {Promise<void>}
 */
async function initializeAsyncComponents() {
	try {
		// Initialize recent files if available
		if (window.electronAPI?.recentFiles) {
			try {
				await window.electronAPI.recentFiles();
				console.log('[Renderer] Recent files API available');
			} catch (error) {
				console.warn('[Renderer] Recent files initialization failed:', error);
			}
		}
		
		// Check for updates if in production
		if (window.electronAPI?.checkForUpdates && !isDevelopmentMode()) {
			try {
				setTimeout(() => {
					window.electronAPI.checkForUpdates();
				}, 5000); // Delay to avoid blocking startup
			} catch (error) {
				console.warn('[Renderer] Update check failed:', error);
			}
		}
		
	} catch (error) {
		console.warn('[Renderer] Some async components failed to initialize:', error);
		// Don't throw - these are non-critical
	}
}

// ==========================================
// Performance Monitoring
// ==========================================

/**
 * Performance monitoring utilities
 * @namespace PerformanceMonitor
 */
const PerformanceMonitor = {
	/**
	 * Tracks performance metrics for the application
	 * @type {Map<string, number>}
	 */
	metrics: new Map(),
	
	/**
	 * Starts timing an operation
	 * @param {string} operation - Name of the operation to time
	 */
	start(operation) {
		this.metrics.set(`${operation}_start`, performance.now());
	},
	
	/**
	 * Ends timing an operation and logs the result
	 * @param {string} operation - Name of the operation that finished
	 * @returns {number} Duration in milliseconds
	 */
	end(operation) {
		const startTime = this.metrics.get(`${operation}_start`);
		if (!startTime) {
			console.warn(`[Performance] No start time found for operation: ${operation}`);
			return 0;
		}
		
		const duration = performance.now() - startTime;
		this.metrics.set(operation, duration);
		
		if (isDevelopmentMode()) {
			console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
		}
		
		return duration;
	},
	
	/**
	 * Gets all recorded metrics
	 * @returns {Object} Object containing all metrics
	 */
	getMetrics() {
		const result = {};
		for (const [key, value] of this.metrics) {
			if (!key.endsWith('_start')) {
				result[key] = value;
			}
		}
		return result;
	}
};

// ==========================================
// Application Information
// ==========================================

// ==========================================
// Application Information
// ==========================================

/**
 * Application metadata and version information
 * @constant {Object}
 */
const APP_INFO = {
	name: 'FIT File Viewer',
	version: '21.1.0',
	description: 'Advanced FIT file analysis and visualization tool',
	author: 'FIT File Viewer Team',
	repository: 'https://github.com/user/FitFileViewer',
	license: 'MIT',
	
	/**
	 * Gets runtime information about the application
	 * @returns {Object} Runtime information
	 */
	getRuntimeInfo() {
		return {
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			language: navigator.language,
			cookieEnabled: navigator.cookieEnabled,
			onLine: navigator.onLine,
			hardwareConcurrency: navigator.hardwareConcurrency,
			memoryUsage: performance.memory ? {
				usedJSHeapSize: performance.memory.usedJSHeapSize,
				totalJSHeapSize: performance.memory.totalJSHeapSize,
				jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
			} : null
		};
	}
};

// ==========================================
// Global API Exposure
// ==========================================

/**
 * Expose utilities to global scope for legacy compatibility
 * @global
 */
if (typeof window !== 'undefined') {
	// Expose map utilities globally for chart and map components
	window.createExportGPXButton = createExportGPXButton;
	
	// Expose application information
	window.APP_INFO = APP_INFO;
	
	// Expose core utilities for debugging and legacy support
	if (isDevelopmentMode()) {
		window.__renderer_debug = {
			showNotification,
			handleOpenFile,
			setupTheme,
			showUpdateNotification,
			showAboutModal,
			PerformanceMonitor
		};
	}
}

// Log application startup information
console.group('[Renderer] Application Startup');
console.log('App:', APP_INFO.name, 'v' + APP_INFO.version);
console.log('Environment:', getEnvironment());
console.log('Runtime Info:', APP_INFO.getRuntimeInfo());
console.groupEnd();

// ==========================================
// Application Lifecycle
// ==========================================

/**
 * Cleanup function called before page unload
 */
function cleanup() {
	try {
		console.log('[Renderer] Performing cleanup...');
		
		// Remove global event listeners
		window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		window.removeEventListener('error', handleUncaughtError);
		
		// Reset application state
		appState.isInitialized = false;
		appState.isOpeningFile = false;
		isOpeningFileRef.value = false;
		
		console.log('[Renderer] Cleanup completed');
	} catch (error) {
		console.error('[Renderer] Cleanup failed:', error);
	}
}

// ==========================================
// Event Listeners & Startup
// ==========================================

// Setup page lifecycle events
window.addEventListener('beforeunload', cleanup);

// Start application when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
	// DOM already loaded
	setTimeout(initializeApplication, 0);
}

// ==========================================
// Development Utilities
// ==========================================

if (isDevelopmentMode()) {
	/**
	 * Development utilities exposed to global scope
	 * @global
	 */
	window.__renderer_dev = {
		appState,
		isOpeningFileRef,
		PerformanceMonitor,
		APP_INFO,
		reinitialize: initializeApplication,
		cleanup,
		validateDOM: validateDOMElements,
		getPerformanceMetrics: () => PerformanceMonitor.getMetrics()
	};
	
	console.log('[Renderer] Development utilities available at window.__renderer_dev');
	console.log('[Renderer] Performance metrics:', PerformanceMonitor.getMetrics());
}

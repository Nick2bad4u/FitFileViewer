// Theme utility functions for theme switching and persistence

/**
 * Available theme modes
 */
export const THEME_MODES = {
	LIGHT: 'light',
	DARK: 'dark',
	AUTO: 'auto'
};

/**
 * Theme transition class for smooth transitions
 */
const THEME_TRANSITION_CLASS = 'theme-transitioning';

/**
 * Apply the given theme to the document body and persist it.
 * @param {string} theme - 'dark', 'light', or 'auto'
 * @param {boolean} withTransition - Whether to animate the theme change
 */
export function applyTheme(theme, withTransition = true) {
	// Add transition class for smooth theme changes
	if (withTransition) {
		document.body.classList.add(THEME_TRANSITION_CLASS);
	}

	// Remove existing theme classes
	document.body.classList.remove('theme-dark', 'theme-light');

	// Handle auto theme
	if (theme === THEME_MODES.AUTO) {
		const systemTheme = getSystemTheme();
		document.body.classList.add(`theme-${systemTheme}`);
	} else {
		document.body.classList.add(`theme-${theme}`);
	}

	// Persist theme preference
	try {
		localStorage.setItem('ffv-theme', theme);
		
		// Notify other components of theme change
		dispatchThemeChangeEvent(theme);
		
		// Update meta theme-color for mobile browsers
		updateMetaThemeColor(theme);
		
	} catch (error) {
		console.error('Failed to persist theme to localStorage:', error);
	}

	// Remove transition class after animation completes
	if (withTransition) {
		setTimeout(() => {
			document.body.classList.remove(THEME_TRANSITION_CLASS);
		}, 300);
	}
}

/**
 * Get the system's preferred color scheme
 * @returns {string} 'dark' or 'light'
 */
export function getSystemTheme() {
	if (typeof window !== 'undefined' && window.matchMedia) {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return 'dark'; // fallback
}

/**
 * Get the effective theme (resolves 'auto' to actual theme)
 * @param {string} theme - The theme preference
 * @returns {string} 'dark' or 'light'
 */
export function getEffectiveTheme(theme = null) {
	const currentTheme = theme || loadTheme();
	return currentTheme === THEME_MODES.AUTO ? getSystemTheme() : currentTheme;
}

/**
 * Load the persisted theme from localStorage, defaulting to 'dark'.
 * @returns {string}
 */
export function loadTheme() {
	try {
		return localStorage.getItem('ffv-theme') || 'dark';
	} catch (error) {
		console.error('Error loading theme from localStorage:', error);
		return 'dark';
	}
}

/**
 * Toggle between light and dark themes
 * @param {boolean} withTransition - Whether to animate the theme change
 */
export function toggleTheme(withTransition = true) {
	const currentTheme = loadTheme();
	const effectiveTheme = getEffectiveTheme(currentTheme);
	const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
	applyTheme(newTheme, withTransition);
}

/**
 * Listen for theme change events from the Electron main process and apply the theme.
 * @param {(theme: string) => void} onThemeChange
 */
export function listenForThemeChange(onThemeChange) {
	if (window.electronAPI && typeof window.electronAPI.onSetTheme === 'function' && typeof window.electronAPI.sendThemeChanged === 'function') {
		// The callback receives a 'theme' parameter, which is expected to be a string ('dark' or 'light').
		window.electronAPI.onSetTheme((theme) => {
			onThemeChange(theme);
			if (typeof window.electronAPI.sendThemeChanged === 'function') {
				window.electronAPI.sendThemeChanged(theme);
			} else {
				console.warn('sendThemeChanged method is not available on electronAPI.');
			}
		});
	} else {
		console.warn('Electron API is not available. Theme change listener is not active.');
	}
}

/**
 * Listen for system theme changes and update if using auto theme
 */
export function listenForSystemThemeChange() {
	if (typeof window !== 'undefined' && window.matchMedia) {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		
		const handleSystemThemeChange = () => {
			const currentTheme = loadTheme();
			if (currentTheme === THEME_MODES.AUTO) {
				applyTheme(THEME_MODES.AUTO, true);
			}
		};

		// Use the newer addEventListener if available, fallback to addListener
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', handleSystemThemeChange);
		} else {
			mediaQuery.addListener(handleSystemThemeChange);
		}

		// Return cleanup function
		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener('change', handleSystemThemeChange);
			} else {
				mediaQuery.removeListener(handleSystemThemeChange);
			}
		};
	}
}

/**
 * Dispatch a custom theme change event
 * @param {string} theme - The new theme
 */
function dispatchThemeChangeEvent(theme) {
	const event = new CustomEvent('themechange', {
		detail: { theme, effectiveTheme: getEffectiveTheme(theme) }
	});
	document.dispatchEvent(event);
}

/**
 * Update the meta theme-color tag for mobile browsers
 * @param {string} theme - The theme to update for
 */
function updateMetaThemeColor(theme) {
	const effectiveTheme = getEffectiveTheme(theme);
	let themeColor = effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff';
	
	let metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (!metaThemeColor) {
		metaThemeColor = document.createElement('meta');
		metaThemeColor.name = 'theme-color';
		document.head.appendChild(metaThemeColor);
	}
	metaThemeColor.content = themeColor;
}

/**
 * Initialize theme system
 */
export function initializeTheme() {
	// Load and apply saved theme
	const savedTheme = loadTheme();
	applyTheme(savedTheme, false);
	
	// Set up system theme change listener
	const cleanup = listenForSystemThemeChange();
	
	// Add CSS for smooth transitions
	injectThemeTransitionCSS();
	
	return cleanup;
}

/**
 * Inject CSS for smooth theme transitions
 */
function injectThemeTransitionCSS() {
	if (document.getElementById('theme-transition-styles')) return;

	const style = document.createElement('style');
	style.id = 'theme-transition-styles';
	style.textContent = `
		.theme-transitioning *,
		.theme-transitioning *::before,
		.theme-transitioning *::after {
			transition: background-color 0.3s ease-in-out, 
						color 0.3s ease-in-out, 
						border-color 0.3s ease-in-out,
						box-shadow 0.3s ease-in-out !important;
		}
		
		/* Disable transitions for certain elements to avoid conflicts */
		.theme-transitioning .leaflet-map-pane,
		.theme-transitioning canvas,
		.theme-transitioning video,
		.theme-transitioning iframe {
			transition: none !important;
		}
	`;
	document.head.appendChild(style);
}

/**
 * Get theme preference for external libraries
 * @returns {Object} Theme configuration object
 */
export function getThemeConfig() {
	const effectiveTheme = getEffectiveTheme();
	
	return {
		theme: effectiveTheme,
		isDark: effectiveTheme === 'dark',
		isLight: effectiveTheme === 'light',
		colors: {
			primary: effectiveTheme === 'dark' ? '#3b82f6' : '#2563eb',
			background: effectiveTheme === 'dark' ? '#1a1a1a' : '#ffffff',
			surface: effectiveTheme === 'dark' ? '#2d2d2d' : '#f8f9fa',
			text: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
			textSecondary: effectiveTheme === 'dark' ? '#a0a0a0' : '#6b7280',
			border: effectiveTheme === 'dark' ? '#404040' : '#e5e7eb'
		}
	};
}

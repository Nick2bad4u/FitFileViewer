/**
 * @fileoverview Chart theme utilities for FitFileViewer
 * @description Provides theme detection and styling utilities specifically for chart rendering
 * 
 * @author FitFileViewer Development Team
 * @version 1.0.0
 * @since 2.0.0
 */

import { getEffectiveTheme } from './theme.js';

/**
 * Detects the current theme robustly using multiple fallback methods
 * @returns {string} Current theme ('dark' or 'light')
 */
export function detectCurrentTheme() {
	// Method 1: Check body classes (primary method used by the app)
	if (document.body.classList.contains('theme-dark')) {
		return 'dark';
	}
	if (document.body.classList.contains('theme-light')) {
		return 'light';
	}
	
	// Method 2: Use the theme utility if available
	try {
		const effectiveTheme = getEffectiveTheme();
		if (effectiveTheme) {
			return effectiveTheme;
		}
	} catch (error) {
		console.warn('[ChartThemeUtils] getEffectiveTheme failed:', error);
	}
	
	// Method 3: Check localStorage
	try {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
			return savedTheme;
		}
	} catch (error) {
		console.warn('[ChartThemeUtils] localStorage access failed:', error);
	}
	
	// Method 4: System preference fallback
	try {
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}
	} catch (error) {
		console.warn('[ChartThemeUtils] matchMedia access failed:', error);
	}
	
	// Final fallback
	return 'light';
}

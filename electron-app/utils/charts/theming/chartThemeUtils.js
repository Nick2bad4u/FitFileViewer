/**
 * @fileoverview Chart theme utilities for FitFileViewer
 * @description Provides theme detection and styling utilities specifically for chart rendering
 *
 * @author FitFileViewer Development Team
 * @version 1.0.0
 * @since 2.0.0
 */

import { getEffectiveTheme } from "../../theming/core/theme.js";

/**
 * Detects the current theme robustly using multiple fallback methods
 * @returns {string} Current theme ('dark' or 'light')
 */
export function detectCurrentTheme() {
    // Method 1: Check body classes (primary method used by the app)
    if (document.body.classList.contains("theme-dark")) {
        console.log("[ChartThemeUtils] Detected theme via body class: dark");
        return "dark";
    }
    if (document.body.classList.contains("theme-light")) {
        console.log("[ChartThemeUtils] Detected theme via body class: light");
        return "light";
    }

    // Method 2: Use the theme utility if available
    try {
        const effectiveTheme = getEffectiveTheme();
        if (effectiveTheme) {
            console.log("[ChartThemeUtils] Detected theme via getEffectiveTheme:", effectiveTheme);
            return effectiveTheme;
        }
    } catch (error) {
        console.warn("[ChartThemeUtils] getEffectiveTheme failed:", error);
    }

    // Method 3: Check localStorage (using correct key "ffv-theme")
    try {
        const savedTheme = localStorage.getItem("ffv-theme");
        if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
            console.log("[ChartThemeUtils] Detected theme via localStorage:", savedTheme);
            return savedTheme;
        }
        // Handle "auto" theme by resolving to system preference
        if (savedTheme === "auto") {
            if (globalThis.matchMedia && globalThis.matchMedia("(prefers-color-scheme: dark)").matches) {
                console.log("[ChartThemeUtils] Auto theme resolved to: dark");
                return "dark";
            }
            console.log("[ChartThemeUtils] Auto theme resolved to: light");
            return "light";
        }
    } catch (error) {
        console.warn("[ChartThemeUtils] localStorage access failed:", error);
    }

    // Method 4: System preference fallback
    try {
        if (globalThis.matchMedia && globalThis.matchMedia("(prefers-color-scheme: dark)").matches) {
            console.log("[ChartThemeUtils] System preference fallback: dark");
            return "dark";
        }
    } catch (error) {
        console.warn("[ChartThemeUtils] matchMedia access failed:", error);
    }

    // Final fallback
    console.log("[ChartThemeUtils] Using final fallback: light");
    return "light";
}

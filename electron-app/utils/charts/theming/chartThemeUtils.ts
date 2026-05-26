import { getEffectiveTheme } from "../../theming/core/theme.js";
import { isDevelopmentEnvironment } from "../../runtime/processEnvironment.js";

/**
 * Concrete theme values that chart rendering can consume.
 */
export type ChartTheme = "dark" | "light";

interface ChartDebugGlobal {
    __FFV_debugCharts?: boolean;
}

function shouldLogDebugMessages(): boolean {
    const debugGlobal = globalThis as typeof globalThis & ChartDebugGlobal;

    return isDevelopmentEnvironment() && debugGlobal.__FFV_debugCharts === true;
}

function logThemeDetection(message: string, detectedTheme?: ChartTheme): void {
    if (!shouldLogDebugMessages()) {
        return;
    }

    if (detectedTheme) {
        console.log(message, detectedTheme);
        return;
    }

    console.log(message);
}

function isChartTheme(value: null | string): value is ChartTheme {
    return value === "dark" || value === "light";
}

function getSystemPreferredTheme(): ChartTheme {
    return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

/**
 * Detects the current chart theme using app classes, theme state, storage, and
 * system preference fallbacks.
 */
export function detectCurrentTheme(): ChartTheme {
    if (document.body.classList.contains("theme-dark")) {
        logThemeDetection(
            "[ChartThemeUtils] Detected theme via body class: dark"
        );
        return "dark";
    }

    if (document.body.classList.contains("theme-light")) {
        logThemeDetection(
            "[ChartThemeUtils] Detected theme via body class: light"
        );
        return "light";
    }

    try {
        const effectiveTheme = getEffectiveTheme();
        if (isChartTheme(effectiveTheme)) {
            logThemeDetection(
                "[ChartThemeUtils] Detected theme via getEffectiveTheme:",
                effectiveTheme
            );
            return effectiveTheme;
        }
    } catch (error) {
        console.warn("[ChartThemeUtils] getEffectiveTheme failed:", error);
    }

    try {
        const savedTheme = localStorage.getItem("ffv-theme");
        if (isChartTheme(savedTheme)) {
            logThemeDetection(
                "[ChartThemeUtils] Detected theme via localStorage:",
                savedTheme
            );
            return savedTheme;
        }

        if (savedTheme === "auto") {
            const systemTheme = getSystemPreferredTheme();
            logThemeDetection(
                `[ChartThemeUtils] Auto theme resolved to: ${systemTheme}`
            );
            return systemTheme;
        }
    } catch (error) {
        console.warn("[ChartThemeUtils] localStorage access failed:", error);
    }

    try {
        if (getSystemPreferredTheme() === "dark") {
            logThemeDetection(
                "[ChartThemeUtils] System preference fallback: dark"
            );
            return "dark";
        }
    } catch (error) {
        console.warn("[ChartThemeUtils] matchMedia access failed:", error);
    }

    logThemeDetection("[ChartThemeUtils] Using final fallback: light");
    return "light";
}

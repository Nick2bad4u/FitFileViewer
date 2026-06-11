import { getEffectiveTheme } from "../../theming/core/theme.js";
import { isChartDebugLoggingEnabled } from "../core/chartDebugState.js";
import {
    type ChartTheme,
    getChartThemeRuntime,
} from "./chartThemeRuntime.js";

/**
 * Concrete theme values that chart rendering can consume.
 */
export type { ChartTheme } from "./chartThemeRuntime.js";

function shouldLogDebugMessages(): boolean {
    return isChartDebugLoggingEnabled();
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

/**
 * Detects the current chart theme using app classes, theme state, storage, and
 * system preference fallbacks.
 */
export function detectCurrentTheme(): ChartTheme {
    const runtime = getChartThemeRuntime();

    if (runtime.hasBodyThemeClass("theme-dark")) {
        logThemeDetection(
            "[ChartThemeUtils] Detected theme via body class: dark"
        );
        return "dark";
    }

    if (runtime.hasBodyThemeClass("theme-light")) {
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
        const savedTheme = runtime.getSavedTheme();
        if (isChartTheme(savedTheme)) {
            logThemeDetection(
                "[ChartThemeUtils] Detected theme via localStorage:",
                savedTheme
            );
            return savedTheme;
        }

        if (savedTheme === "auto") {
            const systemTheme = runtime.getSystemPreferredTheme();
            logThemeDetection(
                `[ChartThemeUtils] Auto theme resolved to: ${systemTheme}`
            );
            return systemTheme;
        }
    } catch (error) {
        console.warn("[ChartThemeUtils] localStorage access failed:", error);
    }

    try {
        if (runtime.getSystemPreferredTheme() === "dark") {
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

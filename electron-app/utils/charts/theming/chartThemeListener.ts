import { chartStateManager as importedChartStateManager } from "../core/chartStateManager.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import type { FitDecodeResult } from "../../../shared/fit";

interface ChartUpdateAdapter {
    updateAll(reason: string): void;
}

interface ThemeChangeDetail {
    theme?: string;
}

interface LegacyChartWindow extends Window {
    ChartUpdater?: unknown;
    chartUpdater?: unknown;
    globalData?: FitDecodeResult | null;
}

type ThemeChangeHandler = ((event: Event) => void) & {
    timeout?: ReturnType<typeof setTimeout>;
};

let chartThemeListener: EventListener | undefined;

function getGlobalWindow(): LegacyChartWindow | undefined {
    return typeof window === "undefined" ? undefined : window;
}

function hasUpdateAll(value: unknown): value is ChartUpdateAdapter {
    return (
        isObjectRecord(value) &&
        "updateAll" in value &&
        typeof value["updateAll"] === "function"
    );
}

function getThemeFromEvent(event: Event): string | undefined {
    if (!(event instanceof CustomEvent)) {
        return undefined;
    }

    const detail = event.detail as ThemeChangeDetail | undefined;

    return isObjectRecord(detail) && typeof detail["theme"] === "string"
        ? detail["theme"]
        : undefined;
}

function updateChartsForTheme(
    reason: string,
    unavailableMessage: string,
    theme?: string
): void {
    const stateManager = importedChartStateManager;
    const globalWindow = getGlobalWindow();

    if (stateManager) {
        stateManager.handleThemeChange(theme);
        return;
    }

    if (hasUpdateAll(globalWindow?.ChartUpdater)) {
        globalWindow.ChartUpdater.updateAll(reason);
        return;
    }

    if (hasUpdateAll(globalWindow?.chartUpdater)) {
        globalWindow.chartUpdater.updateAll(reason);
        return;
    }

    console.warn(unavailableMessage);
}

function hasChartData(): boolean {
    return getGlobalWindow()?.globalData !== undefined;
}

/**
 * Force update all chart theme elements.
 */
export function forceUpdateChartTheme(
    chartsContainer: HTMLElement | null,
    settingsContainer: HTMLElement | null
): void {
    console.log("[ChartThemeListener] Force updating chart theme");

    if (chartsContainer && hasChartData()) {
        updateChartsForTheme(
            "Force theme update",
            "[ChartThemeListener] No chart update mechanism available for force update"
        );
    }

    if (settingsContainer) {
        updateSettingsPanelTheme(settingsContainer);
    }
}

/**
 * Remove the registered theme change listener.
 */
export function removeChartThemeListener(): void {
    if (!chartThemeListener) {
        return;
    }

    document.body.removeEventListener("themechange", chartThemeListener);
    chartThemeListener = undefined;
    console.log("[ChartThemeListener] Theme listener removed");
}

/**
 * Set up theme change listener for charts and settings UI.
 */
export function setupChartThemeListener(
    chartsContainer: HTMLElement | null,
    settingsContainer: HTMLElement | null
): void {
    if (chartThemeListener) {
        document.body.removeEventListener("themechange", chartThemeListener);
    }

    chartThemeListener = onChartThemeChangeFactory(
        chartsContainer,
        settingsContainer
    );
    document.body.addEventListener("themechange", chartThemeListener);

    console.log(
        "[ChartThemeListener] Theme listener set up for charts and settings"
    );
}

function onChartThemeChangeFactory(
    chartsContainer: HTMLElement | null,
    settingsContainer: HTMLElement | null
): ThemeChangeHandler {
    const handler: ThemeChangeHandler = (event) => {
        const theme = getThemeFromEvent(event);
        console.log("[ChartThemeListener] Theme changed to:", theme);

        if (handler.timeout) {
            clearTimeout(handler.timeout);
        }

        handler.timeout = setTimeout(() => {
            if (chartsContainer && hasChartData()) {
                console.log(
                    "[ChartThemeListener] Re-rendering charts for theme change"
                );

                updateChartsForTheme(
                    "Theme change",
                    "[ChartThemeListener] No chart update mechanism available",
                    theme
                );
            }

            if (settingsContainer) {
                updateSettingsPanelTheme(settingsContainer);
            }
        }, 150);
    };

    return handler;
}

function updateSettingsPanelTheme(settingsContainer: HTMLElement): void {
    try {
        const sliders = settingsContainer.querySelectorAll<HTMLInputElement>(
            'input[type="range"]'
        );

        for (const slider of sliders) {
            const current = Number(slider.value || 0);
            const max = Number(slider.max || 100);
            const min = Number(slider.min || 0);
            const percentage =
                max === min ? 0 : ((current - min) / (max - min)) * 100;

            slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-border) ${percentage}%, var(--color-border) 100%)`;
        }

        const toggles =
            settingsContainer.querySelectorAll<HTMLElement>(".toggle-switch");

        for (const toggle of toggles) {
            const thumb = toggle.querySelector<HTMLElement>(".toggle-thumb");
            toggle.style.background =
                thumb?.style.left === "26px"
                    ? "var(--color-success)"
                    : "var(--color-border)";
        }

        const statusTexts = settingsContainer.querySelectorAll<HTMLElement>(
            ".toggle-switch + span"
        );

        for (const statusText of statusTexts) {
            statusText.style.color =
                statusText.textContent === "On"
                    ? "var(--color-success)"
                    : "var(--color-fg)";
        }

        console.log("[ChartThemeListener] Settings panel theme updated");
    } catch (error) {
        console.error(
            "[ChartThemeListener] Error updating settings panel theme:",
            error
        );
    }
}

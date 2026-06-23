import { getRegisteredChartStateManager } from "../core/chartStateManagerRegistry.js";
import { updateCharts } from "../core/chartUpdater.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { hasActiveFitChartData } from "../../state/domain/fitChartDataState.js";
import {
    getChartThemeListenerRuntime,
    type ChartThemeListenerRuntime,
    type ChartThemeListenerTimerHandle,
} from "./chartThemeListenerRuntime.js";

interface ThemeChangeDetail {
    theme?: string;
}

type ThemeChangeHandler = ((event: Event) => void) & {
    timeout?: ChartThemeListenerTimerHandle;
};

let chartThemeListener: ThemeChangeHandler | undefined;
let chartThemeListenerController: AbortController | undefined;

function getThemeFromEvent(
    event: Event,
    runtime: ChartThemeListenerRuntime
): string | undefined {
    if (!runtime.isCustomEvent(event)) {
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
    const stateManager = getRegisteredChartStateManager();

    if (typeof stateManager?.handleThemeChange === "function") {
        stateManager.handleThemeChange(theme);
        return;
    }

    void updateCharts(reason).catch((error: unknown) => {
        console.warn(unavailableMessage, error);
    });
}

function hasChartData(): boolean {
    return hasActiveFitChartData();
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

    disposeChartThemeListener(getChartThemeListenerRuntime());
    console.log("[ChartThemeListener] Theme listener removed");
}

/**
 * Set up theme change listener for charts and settings UI.
 */
export function setupChartThemeListener(
    chartsContainer: HTMLElement | null,
    settingsContainer: HTMLElement | null
): void {
    const runtime = getChartThemeListenerRuntime();
    if (chartThemeListener) {
        disposeChartThemeListener(runtime);
    }

    const listenerController = runtime.createAbortController();
    chartThemeListener = onChartThemeChangeFactory(
        chartsContainer,
        settingsContainer,
        runtime
    );
    chartThemeListenerController = listenerController;
    runtime.addThemeChangeListener(chartThemeListener, {
        signal: listenerController.signal,
    });

    console.log(
        "[ChartThemeListener] Theme listener set up for charts and settings"
    );
}

function disposeChartThemeListener(runtime: ChartThemeListenerRuntime): void {
    if (chartThemeListener?.timeout !== undefined) {
        runtime.clearTimeout(chartThemeListener.timeout);
    }

    chartThemeListenerController?.abort();
    chartThemeListener = undefined;
    chartThemeListenerController = undefined;
}

function onChartThemeChangeFactory(
    chartsContainer: HTMLElement | null,
    settingsContainer: HTMLElement | null,
    runtime: ChartThemeListenerRuntime
): ThemeChangeHandler {
    const handler: ThemeChangeHandler = (event) => {
        const theme = getThemeFromEvent(event, runtime);
        console.log("[ChartThemeListener] Theme changed to:", theme);

        if (handler.timeout) {
            runtime.clearTimeout(handler.timeout);
        }

        handler.timeout = runtime.setTimeout(() => {
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

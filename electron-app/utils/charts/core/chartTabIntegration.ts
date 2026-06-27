import {
    hasActiveFitChartData,
    hasFitChartRecordMessages,
} from "../../state/domain/fitChartDataState.js";
import { subscribeToActiveFitRawDataChange } from "../../state/domain/activeFitRawDataState.js";
import { subscribeToAppOpeningFile } from "../../state/domain/appDomainState.js";
import { getRendererActiveTab } from "../../state/domain/rendererActiveTabState.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { tabStateManager } from "../../ui/tabs/tabStateManager.js";
import { ensureChartStateManagerRegistered } from "./chartStateManagerBootstrap.js";
import type { RegisteredChartStateManager } from "./chartStateManagerRegistry.js";
import {
    getChartTabIntegrationRuntime,
    type ChartTabIntegrationRuntime,
} from "./chartTabIntegrationRuntime.js";

type DisableableTabButton = HTMLElement & {
    disabled?: boolean;
};

type ChartTabIntegrationStatus = {
    readonly chartState: unknown;
    readonly chartTabActive: boolean;
    readonly hasData: boolean;
    readonly isInitialized: boolean;
    readonly tabState: ReturnType<typeof tabStateManager.getActiveTabInfo>;
};

/**
 * Coordinates chart rendering state with the application tab system.
 */
export class ChartTabIntegration {
    isInitialized = false;

    private readonly runtime: ChartTabIntegrationRuntime;

    constructor(runtime = getChartTabIntegrationRuntime()) {
        this.runtime = runtime;
    }

    /**
     * Check whether loaded data and the active tab require chart rendering.
     */
    checkAndRenderCharts(): void {
        if (!hasActiveFitChartData()) {
            console.log(
                "[ChartTabIntegration] No data available for chart rendering"
            );
            return;
        }

        if (this.isChartTabActive()) {
            console.log(
                "[ChartTabIntegration] Chart tab is active, requesting render"
            );
            getChartStateManagerForIntegration().debouncedRender(
                "Integration check after file load"
            );
        } else {
            console.log(
                "[ChartTabIntegration] Chart tab not active, skipping render"
            );
        }
    }

    /**
     * Clean up integration state.
     */
    destroy(): void {
        this.isInitialized = false;
        console.log("[ChartTabIntegration] Destroyed");
    }

    /**
     * Disable the chart tab button when no FIT data is loaded.
     */
    disableChartTab(): void {
        const chartTabButton = this.getChartTabButton();
        if (!chartTabButton) {
            return;
        }

        chartTabButton.disabled = true;
        chartTabButton.classList.add("disabled");
        chartTabButton.style.opacity = "0.5";
    }

    /**
     * Enable the chart tab button when FIT data is loaded.
     */
    enableChartTab(): void {
        const chartTabButton = this.getChartTabButton();
        if (!chartTabButton) {
            return;
        }

        chartTabButton.disabled = false;
        chartTabButton.classList.remove("disabled");
        chartTabButton.style.opacity = "1";
    }

    /**
     * Get the chart tab button element.
     */
    getChartTabButton(): DisableableTabButton | null {
        return asDisableableTabButton(this.runtime.queryChartTabButton());
    }

    /**
     * Get integration status information.
     */
    getStatus(): ChartTabIntegrationStatus {
        const chartStateManager = getChartStateManagerForIntegration();

        return {
            chartState:
                typeof chartStateManager.getChartInfo === "function"
                    ? chartStateManager.getChartInfo()
                    : {},
            chartTabActive: this.isChartTabActive(),
            hasData: hasActiveFitChartData(),
            isInitialized: this.isInitialized,
            tabState: tabStateManager.getActiveTabInfo(),
        };
    }

    /**
     * Handle new FIT data being loaded or cleared.
     *
     * @param newData - The new raw FIT data payload.
     */
    handleDataChange(newData: unknown): void {
        console.log(
            "[ChartTabIntegration] Data changed, updating availability"
        );

        if (hasFitChartRecordMessages(newData)) {
            this.enableChartTab();

            if (this.isChartTabActive()) {
                getChartStateManagerForIntegration().debouncedRender(
                    "New data loaded via integration"
                );
            }
        } else {
            this.disableChartTab();
            getChartStateManagerForIntegration().clearChartState?.();
        }
    }

    /**
     * Initialize the chart tab integration.
     */
    initialize(): void {
        if (this.isInitialized) {
            console.warn("[ChartTabIntegration] Already initialized");
            return;
        }

        this.setupIntegration();
        this.isInitialized = true;

        console.log("[ChartTabIntegration] Initialized successfully");
    }

    /**
     * Check if the chart tab is currently active.
     */
    isChartTabActive(): boolean {
        const activeTab = getRendererActiveTab();
        return activeTab === "chartjs" || activeTab === "chart";
    }

    /**
     * Force chart refresh for external callers.
     *
     * @param reason - Reason for the refresh.
     */
    refreshCharts(reason = "Manual refresh"): boolean {
        if (!hasActiveFitChartData()) {
            void showNotification(
                "No data available for chart rendering",
                "warning"
            );
            return false;
        }

        const chartStateManager = getChartStateManagerForIntegration();
        if (typeof chartStateManager.forceRender === "function") {
            chartStateManager.forceRender(reason);
        } else {
            chartStateManager.debouncedRender(reason);
        }
        return true;
    }

    /**
     * Set up integration between chart and tab systems.
     */
    setupIntegration(): void {
        subscribeToActiveFitRawDataChange((newData, oldData) => {
            if (newData !== oldData) {
                this.handleDataChange(newData);
            }
        });

        subscribeToAppOpeningFile((isOpening) => {
            if (isOpening !== true) {
                this.checkAndRenderCharts();
            }
        });
    }

    /**
     * Switch to the chart tab when FIT data is available.
     */
    switchToChartTab(): boolean {
        if (!hasActiveFitChartData()) {
            void showNotification("Please load a FIT file first", "info");
            return false;
        }

        return (
            tabStateManager.switchToTab("chartjs") ||
            tabStateManager.switchToTab("chart")
        );
    }
}

function getChartStateManagerForIntegration(): RegisteredChartStateManager {
    return ensureChartStateManagerRegistered();
}

function asDisableableTabButton(
    element: HTMLElement | null
): DisableableTabButton | null {
    return element;
}

/**
 * Singleton chart tab integration used by renderer startup.
 */
export const chartTabIntegration = new ChartTabIntegration();

export default chartTabIntegration;

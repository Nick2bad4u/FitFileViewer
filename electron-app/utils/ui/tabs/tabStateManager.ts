/**
 * Manages tab switching, state synchronization, and content rendering
 */

import { getElementByIdFlexible } from "../dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { showNotification } from "../notifications/showNotification.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import {
    getRendererActiveTabFromState,
    isRendererTabName,
    normalizeRendererActiveTab,
    setRendererActiveTabInState,
    subscribeToRendererActiveTabInState,
} from "../../state/domain/rendererActiveTabState.js";
import { resolveTabNameFromButtonId } from "./tabIdUtils.js";
import { tabRenderingManager } from "./tabRenderingManager.js";
import {
    getConfiguredTab,
    TAB_CONFIG as TAB_CONFIG_DEFINITIONS,
    type TabDef,
} from "./tabStateManagerConfig.js";
import type { RendererElectronApiScope } from "../../runtime/electronApiRuntime.js";
import { setTabReadiness } from "./tabReadinessState.js";
import {
    handleAltFitTab as handleAltFitTabImpl,
    handleBrowserTab as handleBrowserTabImpl,
    handleChartTab as handleChartTabImpl,
    handleDataTab as handleDataTabImpl,
    handleMapTab as handleMapTabImpl,
    handleSummaryTab as handleSummaryTabImpl,
    handleZwiftTab as handleZwiftTabImpl,
} from "./tabStateManagerHandlers.js";
import {
    getDoc,
    getStateMgr,
    isTabElement,
    isTabHTMLElement,
} from "./tabStateManagerSupport.js";

const TAB_CONFIG = TAB_CONFIG_DEFINITIONS;

type ActivityRecord = {
    timestamp?: unknown;
};

type ActivityData = {
    recordMesgs?: ActivityRecord[];
};

/** Snapshot of the current active tab and its resolved DOM elements. */
export type ActiveTabInfo = {
    config: TabDef | undefined;
    contentElement: HTMLElement | null;
    element: HTMLElement | null;
    name: string;
    previous: null | string;
};

type DisableableElement = HTMLElement & {
    disabled?: boolean;
};

function asActivityData(value: unknown): ActivityData | null | undefined {
    if (value === null || value === undefined) {
        return value;
    }

    return typeof value === "object" ? value : undefined;
}

function getActiveActivityData(): ActivityData | null | undefined {
    const activityData = getActiveFitActivityData();
    const sourceData = asActivityData(activityData.rawData);
    if (!sourceData) {
        return sourceData;
    }

    return Array.isArray(sourceData.recordMesgs)
        ? {
              ...sourceData,
              recordMesgs: activityData.recordMesgs,
          }
        : sourceData;
}

function getTabConfig(tabName: string): TabDef | undefined {
    return getConfiguredTab(tabName);
}

function isDisableableElement(
    element: HTMLElement
): element is DisableableElement {
    return "disabled" in element;
}

function formatTimestampForHash(value: unknown): string {
    if (value === null || value === undefined) {
        return "0";
    }

    if (value instanceof Date) {
        return String(value.valueOf());
    }

    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "bigint") {
        return String(value);
    }

    return "0";
}

function getRecordTimestamp(record: ActivityRecord | undefined): string {
    return formatTimestampForHash(record?.timestamp);
}

function invokeUnsubscribe(unsubscribe: () => void): void {
    try {
        unsubscribe();
    } catch {
        /* Ignore errors */
    }
}

/**
 * Tab State Manager - handles tab switching and content management
 */
export class TabStateManager {
    isInitialized = false;

    previousTab: null | string = null;

    private _electronApiScope: RendererElectronApiScope | undefined;
    private _setupHandlersFn: (() => void) | null = null;
    private readonly _buttonClickHandler: EventListener;
    private readonly _unsubscribes: Array<() => void> = [];

    constructor() {
        // Stable click handler reference to prevent accumulating listeners
        this._buttonClickHandler = (event) => {
            try {
                const target = isTabElement(event.currentTarget)
                    ? event.currentTarget
                    : null;
                console.log(
                    `[TabStateManager] Click detected on button: ${target?.id || ""}`,
                    event
                );
            } catch {
                /* Ignore errors */
            }
            this.handleTabButtonClick(event);
        };

        this.initializeSubscriptions();
        this.setupTabButtonHandlers();

        console.log("[TabStateManager] Initialized");
    }

    /**
     * Cleanup resources (placeholder for future unsubscribe logic)
     */
    cleanup(): void {
        this._electronApiScope = undefined;
        // Unsubscribe state listeners
        try {
            for (const unsubscribe of this._unsubscribes.splice(0)) {
                invokeUnsubscribe(unsubscribe);
            }
        } catch {
            /* Ignore errors */
        }
        // Remove document DOMContentLoaded handler if previously added
        try {
            if (this._setupHandlersFn) {
                getDoc().removeEventListener(
                    "DOMContentLoaded",
                    this._setupHandlersFn
                );
                this._setupHandlersFn = null;
            }
        } catch {
            /* Ignore errors */
        }
        // Detach click handlers from current tab buttons
        try {
            const tabButtons = getDoc().querySelectorAll(".tab-button");
            for (const button of tabButtons) {
                try {
                    button.removeEventListener(
                        "click",
                        this._buttonClickHandler
                    );
                } catch {
                    /* Ignore errors */
                }
            }
        } catch {
            /* Ignore errors */
        }
        // Mark uninitialized so tests can re-init if they re-import or call setup explicitly
        this.isInitialized = false;
        console.log("[TabStateManager] cleanup invoked");
    }

    /**
     * Extract tab name from button ID
     *
     * @param buttonId - Button element ID.
     *
     * @returns Tab name or null.
     */
    extractTabName(buttonId: string): null | string {
        return resolveTabNameFromButtonId(buttonId, TAB_CONFIG);
    }

    /**
     * Get current active tab information
     *
     * @returns Active tab information.
     */
    getActiveTabInfo(): ActiveTabInfo {
        const activeTab = getRendererActiveTabFromState(getStateMgr().getState);
        const config = getTabConfig(activeTab);

        return {
            config,
            contentElement: config
                ? getElementByIdFlexible(getDoc(), config.contentId)
                : null,
            element: config
                ? getElementByIdFlexible(getDoc(), config.id)
                : null,
            name: activeTab,
            previous: this.previousTab,
        };
    }

    /**
     * Handle Alt Fit tab activation.
     */
    handleAltFitTab(): void {
        return handleAltFitTabImpl();
    }

    /**
     * Handle browser tab activation.
     */
    handleBrowserTab(): Promise<void> {
        return handleBrowserTabImpl(this._electronApiScope);
    }

    /**
     * Handle chart tab activation.
     *
     * @param rawFitData - Current activity data.
     */
    handleChartTab(rawFitData: ActivityData | null | undefined): Promise<void> {
        return handleChartTabImpl(rawFitData);
    }

    /**
     * Handle data tab activation.
     *
     * @param rawFitData - Current activity data.
     */
    handleDataTab(rawFitData: ActivityData | null | undefined): Promise<void> {
        return handleDataTabImpl(rawFitData);
    }

    /**
     * Handle map tab activation.
     *
     * @param rawFitData - Current activity data.
     */
    handleMapTab(rawFitData: ActivityData | null | undefined): Promise<void> {
        return handleMapTabImpl(rawFitData);
    }

    /**
     * Handle summary tab activation.
     *
     * @param rawFitData - Current activity data.
     */
    handleSummaryTab(
        rawFitData: ActivityData | null | undefined
    ): Promise<void> {
        handleSummaryTabImpl(rawFitData);
        return Promise.resolve();
    }

    /**
     * Handle Zwift tab activation.
     */
    handleZwiftTab(): Promise<void> {
        handleZwiftTabImpl();
        return Promise.resolve();
    }

    /**
     * Handle tab button click events
     *
     * @param event - Click event.
     */
    handleTabButtonClick = (event: Event): void => {
        const button = isTabHTMLElement(event.currentTarget)
                ? event.currentTarget
                : null,
            tabId = button?.id || "";

        // Check if button is disabled
        if (
            !button ||
            (isDisableableElement(button) && button.disabled === true) ||
            button.hasAttribute("disabled") ||
            button.classList.contains("tab-disabled")
        ) {
            console.log(
                `[TabStateManager] Ignoring click on disabled button: ${tabId}`
            );
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // Extract tab name from button ID
        const tabName = this.extractTabName(tabId);
        if (!tabName) {
            console.warn(
                `[TabStateManager] Could not extract tab name from ID: ${tabId}`
            );
            return;
        }

        // Prevent switching if already active
        if (button.classList.contains("active")) {
            return;
        }

        // Check if tab requires data
        const tabConfig = getTabConfig(tabName);
        if (tabConfig?.requiresData) {
            const rawFitData = getActiveActivityData();
            if (!rawFitData || !rawFitData.recordMesgs) {
                void showNotification("Please load a FIT file first", "info");
                return;
            }
        }

        // Update state - this will trigger the subscription handler
        setRendererActiveTabInState(getStateMgr().setState, tabName, {
            source: "TabStateManager.buttonClick",
        });
    };

    /**
     * Handle tab change through state management
     *
     * @param newTab - New active tab name.
     * @param oldTab - Previous active tab name.
     */
    handleTabChange(newTab: string, oldTab: null | string): void {
        console.log(
            `[TabStateManager] Tab change: ${oldTab ?? "none"} -> ${newTab}`
        );

        this.previousTab = oldTab;

        // Notify tab rendering manager of the switch to cancel old operations
        tabRenderingManager.notifyTabSwitch(oldTab, newTab);

        // Update tab button states
        this.updateTabButtonStates(newTab);

        // Update content visibility
        this.updateContentVisibility(newTab);

        // Handle tab-specific logic
        void this.handleTabSpecificLogic(newTab);
    }

    /**
     * Handle tab-specific initialization and rendering logic
     *
     * @param tabName - Name of the active tab.
     */
    async handleTabSpecificLogic(tabName: string): Promise<void> {
        const tabConfig = getTabConfig(tabName);
        if (!tabConfig) {
            return;
        }

        const rawFitData = getActiveActivityData();
        if (tabConfig.requiresData && !rawFitData?.recordMesgs) {
            setTabReadiness(
                tabName,
                "blocked",
                "TabStateManager.handleTabSpecificLogic",
                "FIT data is required before this tab can load."
            );
            return;
        }

        try {
            setTabReadiness(
                tabName,
                "loading",
                "TabStateManager.handleTabSpecificLogic"
            );

            switch (tabName) {
                case "altfit": {
                    this.handleAltFitTab();
                    break;
                }
                case "browser": {
                    await this.handleBrowserTab();
                    break;
                }
                case "chart":
                // falls through to chartjs case
                case "chartjs": {
                    await this.handleChartTab(rawFitData);
                    break;
                }

                case "data": {
                    await this.handleDataTab(rawFitData);
                    break;
                }

                case "map": {
                    await this.handleMapTab(rawFitData);
                    break;
                }

                case "summary": {
                    await this.handleSummaryTab(rawFitData);
                    break;
                }

                case "zwift": {
                    await this.handleZwiftTab();
                    break;
                }

                default: {
                    console.log(
                        `[TabStateManager] No specific handler for tab: ${tabName}`
                    );
                }
            }

            setTabReadiness(
                tabName,
                "ready",
                "TabStateManager.handleTabSpecificLogic"
            );
        } catch (error) {
            setTabReadiness(
                tabName,
                "error",
                "TabStateManager.handleTabSpecificLogic",
                error
            );
            console.error(
                `[TabStateManager] Error handling tab ${tabName}:`,
                error
            );
            void showNotification(
                `Error loading ${tabConfig.label} tab`,
                "error"
            );
        }
    }

    /**
     * Generate a simple hash for data comparison.
     *
     * @param data - Activity data to summarize.
     *
     * @returns Stable summary hash.
     */
    hashData(data: ActivityData | null | undefined): string {
        if (!data) {
            return "";
        }

        const recordMesgs = data.recordMesgs || [];
        const size = recordMesgs.length || 0;
        const firstRecord = recordMesgs[0];
        const lastRecord = recordMesgs.at(-1);

        return `${size}-${getRecordTimestamp(firstRecord)}-${getRecordTimestamp(
            lastRecord
        )}`;
    }

    setElectronApiScope(
        electronApiScope: RendererElectronApiScope | undefined
    ): void {
        this._electronApiScope = electronApiScope;
    }

    /**
     * Initialize state subscriptions for reactive tab management
     */
    initializeSubscriptions(): void {
        // Subscribe to active tab changes
        const unsubActive = subscribeToRendererActiveTabInState(
            getStateMgr().subscribe,
            (newTab: unknown, oldTab: unknown) => {
                const nextTab = normalizeRendererActiveTab(newTab);
                const previousTab = isRendererTabName(oldTab) ? oldTab : null;
                if (nextTab !== previousTab) {
                    this.handleTabChange(nextTab, previousTab);
                }
            }
        );
        if (typeof unsubActive === "function")
            this._unsubscribes.push(() => {
                try {
                    unsubActive();
                } catch {
                    /* Ignore errors */
                }
            });

        // Subscribe to data changes to enable/disable tabs
        const unsubData = getStateMgr().subscribe(
            "fitFile.rawData",
            (newData: unknown) => {
                this.updateTabAvailability(asActivityData(newData));
            }
        );
        if (typeof unsubData === "function")
            this._unsubscribes.push(() => {
                try {
                    unsubData();
                } catch {
                    /* Ignore errors */
                }
            });

        this.isInitialized = true;
    }

    /**
     * Set up click handlers for all tab buttons
     */
    setupTabButtonHandlers(): void {
        // Wait for DOM to be ready
        const setupHandlers = () => {
            const tabButtons = getDoc().querySelectorAll(".tab-button");

            for (const button of tabButtons) {
                // Add stable listener with automatic cleanup tracking
                try {
                    addEventListenerWithCleanup(
                        button,
                        "click",
                        this._buttonClickHandler
                    );
                } catch {
                    /* Ignore errors */
                }
            }

            console.log(
                `[TabStateManager] Set up handlers for ${tabButtons.length} tab buttons`
            );
        };

        const doc = getDoc();
        if (doc.readyState === "loading") {
            // Store reference so we can remove it during cleanup
            this._setupHandlersFn = setupHandlers;
            try {
                addEventListenerWithCleanup(
                    doc,
                    "DOMContentLoaded",
                    this._setupHandlersFn
                );
            } catch {
                /* Ignore errors */
            }
        } else {
            setupHandlers();
        }
    }

    /**
     * Manually switch to a specific tab
     *
     * @param tabName - Name of tab to switch to.
     */
    switchToTab(tabName: string): boolean {
        if (!getTabConfig(tabName)) {
            console.warn(`[TabStateManager] Unknown tab: ${tabName}`);
            return false;
        }

        setRendererActiveTabInState(getStateMgr().setState, tabName, {
            source: "TabStateManager.switchToTab",
        });
        return true;
    }

    /**
     * Update content area visibility
     *
     * @param activeTab - Currently active tab name.
     */
    updateContentVisibility(activeTab: string): void {
        const tabConfig = getTabConfig(activeTab);
        if (!tabConfig) {
            console.warn(`[TabStateManager] Unknown tab: ${activeTab}`);
            return;
        }

        // Hide all content areas
        for (const config of Object.values(TAB_CONFIG)) {
            const contentElement = getElementByIdFlexible(
                getDoc(),
                config.contentId
            );
            if (contentElement) {
                contentElement.style.display = "none";
            }
        }

        // Show active content area
        const activeContent = getElementByIdFlexible(
            getDoc(),
            tabConfig.contentId
        );
        if (activeContent) {
            activeContent.style.display = "block";
        }
    }
    /**
     * Update tab availability based on data availability
     *
     * @param rawFitData - Current activity data.
     */
    updateTabAvailability(rawFitData: ActivityData | null | undefined): void {
        const hasData = Boolean(rawFitData && rawFitData.recordMesgs);

        for (const [, config] of Object.entries(TAB_CONFIG)) {
            if (!config.requiresData) {
                continue;
            }
            const el = getElementByIdFlexible(getDoc(), config.id);
            if (el) {
                // Avoid cross-realm instanceof by duck-typing
                const button = el as DisableableElement;
                if (typeof button.classList?.toggle === "function") {
                    if (isDisableableElement(button)) {
                        button.disabled = !hasData;
                    }
                    try {
                        button.classList.toggle("disabled", !hasData);
                    } catch {
                        /* Ignore errors */
                    }
                }
            }
        }
    }
    /**
     * Update tab button visual states
     *
     * @param activeTab - Currently active tab name.
     */
    updateTabButtonStates(activeTab: string): void {
        const tabButtons = getDoc().querySelectorAll(".tab-button");

        for (const button of tabButtons) {
            try {
                const tabName = this.extractTabName(button.id),
                    isActive = tabName === activeTab;

                // Defensive: ensure classList exists
                if (
                    button &&
                    button.classList &&
                    typeof button.classList.toggle === "function"
                ) {
                    button.classList.toggle("active", isActive);
                }
                // Always set aria-selected for both active and inactive to maintain consistency
                if (button && typeof button.setAttribute === "function") {
                    button.setAttribute(
                        "aria-selected",
                        isActive ? "true" : "false"
                    );
                }
            } catch {
                // Ignore individual button failures to keep others updated
            }
        }
    }
}

/** Singleton tab state manager instance. */
export const tabStateManager = new TabStateManager();

/** Tab configuration metadata keyed by tab name. */
export { TAB_CONFIG };

export default tabStateManager;

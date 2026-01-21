/**
 * @fileoverview Browser tab feature gate.
 *
 * The folder-based "Browser" tab is experimental and should be hidden/disabled by default.
 * This module:
 * - Reads the persisted main-process setting via the preload API
 * - Shows/hides the Browser tab button + content
 * - Reacts to main-process menu toggles (fit-browser-enabled-changed)
 */

import { getState, setState } from "../../state/core/stateManager.js";

const BROWSER_TAB_BUTTON_ID = "tab-browser";
const BROWSER_TAB_CONTENT_ID = "content-browser";

/**
 * Initialize Browser tab feature gating.
 *
 * Safe to call multiple times.
 */
export function initFitBrowserFeatureGate() {
    const api = getElectronAPI();
    if (!api || typeof api.isFitBrowserEnabled !== "function") {
        // Non-Electron / tests / iframe contexts.
        return;
    }

    const applyFromMainSetting = async () => {
        try {
            const enabled = await api.isFitBrowserEnabled();
            applyBrowserTabVisibility(enabled === true);
        } catch {
            // Fail closed: hide if we cannot determine.
            applyBrowserTabVisibility(false);
        }
    };

    // Initial load.
    applyFromMainSetting().catch(() => {
        /* ignore */
    });

    // React to main-process toggles.
    if (typeof api.onIpc === "function") {
        api.onIpc("fit-browser-enabled-changed", (eventOrEnabled, enabledMaybe) => {
            const enabled = typeof eventOrEnabled === "boolean" ? eventOrEnabled : enabledMaybe;
            applyBrowserTabVisibility(enabled === true);
        });
    }
}

/**
 * @param {boolean} enabled
 */
function applyBrowserTabVisibility(enabled) {
    const tabBtn = document.getElementById(BROWSER_TAB_BUTTON_ID);
    const tabContent = document.getElementById(BROWSER_TAB_CONTENT_ID);

    if (tabBtn) {
        tabBtn.style.display = enabled ? "" : "none";
    }
    if (tabContent) {
        tabContent.style.display = enabled ? "" : "none";
    }

    // If we just disabled the Browser tab while it's active, switch away.
    if (!enabled) {
        const activeTab = getState("ui.activeTab");
        if (activeTab === "browser") {
            setState("ui.activeTab", "map", { source: "initFitBrowserFeatureGate.disable" });
        }
    }
}

/**
 * @returns {Record<string, unknown> | null}
 */
function getElectronAPI() {
    const api = globalThis.electronAPI;
    if (!api || typeof api !== "object") {
        return null;
    }
    return /** @type {Record<string, unknown>} */ (api);
}

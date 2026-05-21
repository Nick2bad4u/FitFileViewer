import { getState, setState } from "../../state/core/stateManager.js";
const BROWSER_TAB_BUTTON_ID = "tab_browser";
const BROWSER_TAB_CONTENT_ID = "content_browser";
/**
 * Initialize Browser tab feature gating.
 *
 * Safe to call multiple times.
 */
export function initFitBrowserFeatureGate() {
    const api = getElectronAPI();
    if (!api) {
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
    applyFromMainSetting().catch(() => {
        // Ignore startup races from preload teardown in tests.
    });
    api.onIpc?.(
        "fit-browser-enabled-changed",
        (eventOrEnabled, enabledMaybe) => {
            const enabled =
                typeof eventOrEnabled === "boolean"
                    ? eventOrEnabled
                    : enabledMaybe;
            applyBrowserTabVisibility(enabled === true);
        }
    );
}
function applyBrowserTabVisibility(enabled) {
    const tabButton = document.getElementById(BROWSER_TAB_BUTTON_ID);
    const tabContent = document.getElementById(BROWSER_TAB_CONTENT_ID);
    if (tabButton) {
        tabButton.style.display = enabled ? "" : "none";
    }
    if (tabContent) {
        tabContent.style.display = enabled ? "" : "none";
    }
    if (!enabled && getState("ui.activeTab") === "browser") {
        setState("ui.activeTab", "map", {
            source: "initFitBrowserFeatureGate.disable",
        });
    }
}
function getElectronAPI() {
    const api = globalThis.electronAPI;
    if (
        api === null ||
        typeof api !== "object" ||
        typeof api.isFitBrowserEnabled !== "function"
    ) {
        return null;
    }
    return api;
}

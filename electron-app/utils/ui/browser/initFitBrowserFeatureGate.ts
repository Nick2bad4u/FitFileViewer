import { getState, setState } from "../../state/core/stateManager.js";

const BROWSER_TAB_BUTTON_ID = "tab_browser";
const BROWSER_TAB_CONTENT_ID = "content_browser";

type FitBrowserFeatureGateApi = {
    readonly isFitBrowserEnabled: () => Promise<boolean>;
    readonly onIpc?: (
        channel: "fit-browser-enabled-changed",
        callback: (eventOrEnabled: unknown, enabledMaybe?: unknown) => void
    ) => unknown;
};

type GlobalWithElectronApi = typeof globalThis & {
    readonly electronAPI?: unknown;
};

/**
 * Initialize Browser tab feature gating.
 *
 * Safe to call multiple times.
 */
export function initFitBrowserFeatureGate(): void {
    const api = getElectronAPI();

    if (!api) {
        return;
    }

    const applyFromMainSetting = async (): Promise<void> => {
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

function applyBrowserTabVisibility(enabled: boolean): void {
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

function getElectronAPI(): FitBrowserFeatureGateApi | null {
    const api = (globalThis as GlobalWithElectronApi).electronAPI;

    if (
        api === null ||
        typeof api !== "object" ||
        typeof (api as Partial<FitBrowserFeatureGateApi>)
            .isFitBrowserEnabled !== "function"
    ) {
        return null;
    }

    return api as FitBrowserFeatureGateApi;
}

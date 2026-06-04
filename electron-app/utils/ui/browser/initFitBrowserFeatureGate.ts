import { getState, setState } from "../../state/core/stateManager.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";

const BROWSER_TAB_BUTTON_ID = "tab_browser";
const BROWSER_TAB_CONTENT_ID = "content_browser";

type FitBrowserFeatureGateApi = Required<
    Pick<ElectronAPI, "isFitBrowserEnabled">
> &
    Partial<Pick<ElectronAPI, "onFitBrowserEnabledChanged">>;

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
            applyBrowserTabVisibility(enabled);
        } catch {
            // Fail closed: hide if we cannot determine.
            applyBrowserTabVisibility(false);
        }
    };

    applyFromMainSetting().catch(() => {
        // Ignore startup races from preload teardown in tests.
    });

    api.onFitBrowserEnabledChanged?.((enabled) => {
        applyBrowserTabVisibility(enabled);
    });
}

function applyBrowserTabVisibility(enabled: boolean): void {
    const tabButton = document.querySelector(`#${BROWSER_TAB_BUTTON_ID}`);
    const tabContent = document.querySelector(`#${BROWSER_TAB_CONTENT_ID}`);

    if (tabButton instanceof HTMLElement) {
        tabButton.style.display = enabled ? "" : "none";
    }

    if (tabContent instanceof HTMLElement) {
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

import { replaceRendererActiveTab } from "../../state/domain/rendererActiveTabState.js";
import { getRendererElectronApi } from "../../runtime/electronApiRuntime.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import { getFitBrowserFeatureGateRuntime } from "./initFitBrowserFeatureGateRuntime.js";

type FitBrowserFeatureGateApi = Required<
    Pick<ElectronAPI, "isFitBrowserEnabled">
> &
    Partial<Pick<ElectronAPI, "onFitBrowserEnabledChanged">>;

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
    const runtime = getFitBrowserFeatureGateRuntime();
    const { content, tabButton } = runtime.getBrowserTabElements();

    runtime.setElementVisible(tabButton, enabled);
    runtime.setElementVisible(content, enabled);

    if (!enabled) {
        replaceRendererActiveTab("browser", "map", {
            source: "initFitBrowserFeatureGate.disable",
        });
    }
}

function getElectronAPI(): FitBrowserFeatureGateApi | null {
    return getRendererElectronApi(isFitBrowserFeatureGateApi);
}

function isFitBrowserFeatureGateApi(
    api: unknown
): api is FitBrowserFeatureGateApi {
    if (api === null || typeof api !== "object") {
        return false;
    }

    const featureGateApi = api as Partial<FitBrowserFeatureGateApi>;

    return (
        typeof featureGateApi.isFitBrowserEnabled === "function" &&
        (featureGateApi.onFitBrowserEnabledChanged === undefined ||
            typeof featureGateApi.onFitBrowserEnabledChanged === "function")
    );
}

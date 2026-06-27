import type {
    ElectronDevtoolsMenuApi,
    ElectronMenuEventApi,
    ElectronPreloadEventApi,
} from "../shared/preloadApi.js";

import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../utils/runtime/electronApiRuntime.js";

export interface MainUiElectronApi {
    injectMenu?: ElectronDevtoolsMenuApi["injectMenu"];
    notifyFitFileLoaded?: ElectronPreloadEventApi["notifyFitFileLoaded"];
    onOpenSummaryColumnSelector?: ElectronMenuEventApi["onOpenSummaryColumnSelector"];
    onSetTheme?: ElectronMenuEventApi["onSetTheme"];
    onUnloadFitFile?: ElectronMenuEventApi["onUnloadFitFile"];
    sendThemeChanged?: ElectronMenuEventApi["sendThemeChanged"];
}

type MainUiElectronApiCandidate = {
    readonly [K in keyof MainUiElectronApi]?: unknown;
};

function hasOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}

function isMainUiElectronApi(value: unknown): value is MainUiElectronApi {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as MainUiElectronApiCandidate;
    return (
        hasOptionalFunction(api.injectMenu) &&
        hasOptionalFunction(api.notifyFitFileLoaded) &&
        hasOptionalFunction(api.onOpenSummaryColumnSelector) &&
        hasOptionalFunction(api.onSetTheme) &&
        hasOptionalFunction(api.onUnloadFitFile) &&
        hasOptionalFunction(api.sendThemeChanged)
    );
}

export function getMainUiElectronApi(
    scope?: RendererElectronApiScope
): MainUiElectronApi | null {
    return getRendererElectronApi(isMainUiElectronApi, scope);
}

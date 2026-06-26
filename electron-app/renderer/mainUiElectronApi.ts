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

function hasOptionalFunction(
    record: Readonly<Record<string, unknown>>,
    key: keyof MainUiElectronApi
): boolean {
    const value = record[key];
    return value === undefined || typeof value === "function";
}

function isMainUiElectronApi(value: unknown): value is MainUiElectronApi {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as Readonly<Record<string, unknown>>;
    return [
        "injectMenu",
        "notifyFitFileLoaded",
        "onOpenSummaryColumnSelector",
        "onSetTheme",
        "onUnloadFitFile",
        "sendThemeChanged",
    ].every((key) => hasOptionalFunction(api, key as keyof MainUiElectronApi));
}

export function getMainUiElectronApi(
    scope?: RendererElectronApiScope
): MainUiElectronApi | null {
    return getRendererElectronApi(isMainUiElectronApi, scope);
}

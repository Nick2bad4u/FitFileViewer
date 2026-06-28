import type {
    ElectronDevtoolsMenuApi,
    ElectronMenuEventApi,
    ElectronPreloadEventApi,
} from "../shared/preloadApi.js";

import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../utils/runtime/electronApiRuntime.js";

export interface MainUiMenuInjectionElectronApi {
    injectMenu?: ElectronDevtoolsMenuApi["injectMenu"];
}

export interface MainUiSummarySelectorElectronApi {
    onOpenSummaryColumnSelector?: ElectronMenuEventApi["onOpenSummaryColumnSelector"];
}

export interface MainUiThemeSyncElectronApi {
    onSetTheme?: ElectronMenuEventApi["onSetTheme"];
    sendThemeChanged?: ElectronMenuEventApi["sendThemeChanged"];
}

export interface MainUiUnloadElectronApi {
    notifyFitFileLoaded?: ElectronPreloadEventApi["notifyFitFileLoaded"];
    onUnloadFitFile?: ElectronMenuEventApi["onUnloadFitFile"];
}

function hasOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}

function isMainUiElectronApiCandidate(
    value: unknown
): value is Readonly<Record<string, unknown>> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    return true;
}

function isMainUiMenuInjectionElectronApi(
    value: unknown
): value is MainUiMenuInjectionElectronApi {
    if (!isMainUiElectronApiCandidate(value)) {
        return false;
    }

    return hasOptionalFunction(value["injectMenu"]);
}

function isMainUiSummarySelectorElectronApi(
    value: unknown
): value is MainUiSummarySelectorElectronApi {
    if (!isMainUiElectronApiCandidate(value)) {
        return false;
    }

    return hasOptionalFunction(value["onOpenSummaryColumnSelector"]);
}

function isMainUiThemeSyncElectronApi(
    value: unknown
): value is MainUiThemeSyncElectronApi {
    if (!isMainUiElectronApiCandidate(value)) {
        return false;
    }

    return (
        hasOptionalFunction(value["onSetTheme"]) &&
        hasOptionalFunction(value["sendThemeChanged"])
    );
}

function isMainUiUnloadElectronApi(
    value: unknown
): value is MainUiUnloadElectronApi {
    if (!isMainUiElectronApiCandidate(value)) {
        return false;
    }

    return (
        hasOptionalFunction(value["notifyFitFileLoaded"]) &&
        hasOptionalFunction(value["onUnloadFitFile"])
    );
}

export function getMainUiMenuInjectionElectronApi(
    scope?: RendererElectronApiScope
): MainUiMenuInjectionElectronApi | null {
    return getRendererElectronApi(isMainUiMenuInjectionElectronApi, scope);
}

export function getMainUiSummarySelectorElectronApi(
    scope?: RendererElectronApiScope
): MainUiSummarySelectorElectronApi | null {
    return getRendererElectronApi(isMainUiSummarySelectorElectronApi, scope);
}

export function getMainUiThemeSyncElectronApi(
    scope?: RendererElectronApiScope
): MainUiThemeSyncElectronApi | null {
    return getRendererElectronApi(isMainUiThemeSyncElectronApi, scope);
}

export function getMainUiUnloadElectronApi(
    scope?: RendererElectronApiScope
): MainUiUnloadElectronApi | null {
    return getRendererElectronApi(isMainUiUnloadElectronApi, scope);
}

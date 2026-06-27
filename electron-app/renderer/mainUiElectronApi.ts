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

type MainUiMenuInjectionElectronApiCandidate =
    MainUiApiCandidate<MainUiMenuInjectionElectronApi>;

type MainUiSummarySelectorElectronApiCandidate =
    MainUiApiCandidate<MainUiSummarySelectorElectronApi>;

type MainUiThemeSyncElectronApiCandidate =
    MainUiApiCandidate<MainUiThemeSyncElectronApi>;

type MainUiUnloadElectronApiCandidate =
    MainUiApiCandidate<MainUiUnloadElectronApi>;

type MainUiApiCandidate<TApi> = {
    readonly [K in keyof TApi]?: unknown;
};

function hasOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}

function isObjectApiCandidate(value: unknown): value is object {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return true;
}

function isMainUiMenuInjectionElectronApi(
    value: unknown
): value is MainUiMenuInjectionElectronApi {
    if (!isObjectApiCandidate(value)) {
        return false;
    }

    const api = value as MainUiMenuInjectionElectronApiCandidate;
    return hasOptionalFunction(api.injectMenu);
}

function isMainUiSummarySelectorElectronApi(
    value: unknown
): value is MainUiSummarySelectorElectronApi {
    if (!isObjectApiCandidate(value)) {
        return false;
    }

    const api = value as MainUiSummarySelectorElectronApiCandidate;
    return hasOptionalFunction(api.onOpenSummaryColumnSelector);
}

function isMainUiThemeSyncElectronApi(
    value: unknown
): value is MainUiThemeSyncElectronApi {
    if (!isObjectApiCandidate(value)) {
        return false;
    }

    const api = value as MainUiThemeSyncElectronApiCandidate;
    return (
        hasOptionalFunction(api.onSetTheme) &&
        hasOptionalFunction(api.sendThemeChanged)
    );
}

function isMainUiUnloadElectronApi(
    value: unknown
): value is MainUiUnloadElectronApi {
    if (!isObjectApiCandidate(value)) {
        return false;
    }

    const api = value as MainUiUnloadElectronApiCandidate;
    return (
        hasOptionalFunction(api.notifyFitFileLoaded) &&
        hasOptionalFunction(api.onUnloadFitFile)
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

import type { ElectronAPI } from "../shared/preloadApi.js";

import { getRendererElectronApi } from "../utils/runtime/electronApiRuntime.js";

export type MainUiElectronApi = Partial<
    Pick<
        ElectronAPI,
        | "injectMenu"
        | "notifyFitFileLoaded"
        | "onOpenSummaryColumnSelector"
        | "onSetTheme"
        | "onUnloadFitFile"
        | "sendThemeChanged"
    >
>;

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

export function getMainUiElectronApi(): MainUiElectronApi | null {
    return getRendererElectronApi(isMainUiElectronApi);
}

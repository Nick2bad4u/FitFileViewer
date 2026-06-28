import {
    getMainUiMenuInjectionElectronApi,
    getMainUiSummarySelectorElectronApi,
    getMainUiThemeSyncElectronApi,
    getMainUiUnloadElectronApi,
    type MainUiMenuInjectionElectronApi,
    type MainUiSummarySelectorElectronApi,
    type MainUiThemeSyncElectronApi,
    type MainUiUnloadElectronApi,
} from "./mainUiElectronApi.js";
import type { MainUiRuntimeEnvironment } from "./mainUiRuntimeEnvironment.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

export interface MainUiElectronApiBindings {
    readonly electronApiScope: RendererElectronApiScope;
    readonly getMenuInjectionElectronAPI: () => MainUiMenuInjectionElectronApi | null;
    readonly getSummarySelectorElectronAPI: () => MainUiSummarySelectorElectronApi | null;
    readonly getThemeSyncElectronAPI: () => MainUiThemeSyncElectronApi | null;
    readonly getUnloadElectronAPI: () => MainUiUnloadElectronApi | null;
}

export function createMainUiElectronApiBindings(
    runtimeEnvironment: Pick<MainUiRuntimeEnvironment, "electronApiScope">
): MainUiElectronApiBindings {
    const { electronApiScope } = runtimeEnvironment;

    return {
        electronApiScope,
        getMenuInjectionElectronAPI: () =>
            getMainUiMenuInjectionElectronApi(electronApiScope),
        getSummarySelectorElectronAPI: () =>
            getMainUiSummarySelectorElectronApi(electronApiScope),
        getThemeSyncElectronAPI: () =>
            getMainUiThemeSyncElectronApi(electronApiScope),
        getUnloadElectronAPI: () =>
            getMainUiUnloadElectronApi(electronApiScope),
    };
}

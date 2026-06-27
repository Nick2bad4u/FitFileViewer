import type {
    ElectronApiDiagnosticsApi,
    ElectronAppInfoApi,
    ElectronClipboardApi,
    ElectronDevtoolsMenuApi,
    ElectronDialogApi,
    ElectronFileApi,
    ElectronFitBrowserApi,
    ElectronGyazoExternalApi,
    ElectronMainStateApi,
    ElectronMenuEventApi,
    ElectronPreloadEventApi,
    ElectronShellExternalApi,
    ElectronThemeApi,
} from "./preloadApiDomains";

/** Renderer-facing API exposed by the Electron preload script. */
export interface ElectronAPI
    extends
        ElectronApiDiagnosticsApi,
        ElectronAppInfoApi,
        ElectronClipboardApi,
        ElectronDevtoolsMenuApi,
        ElectronDialogApi,
        ElectronFileApi,
        ElectronFitBrowserApi,
        ElectronGyazoExternalApi,
        ElectronMainStateApi,
        ElectronMenuEventApi,
        ElectronPreloadEventApi,
        ElectronShellExternalApi,
        ElectronThemeApi {}

export type {
    ElectronApiDiagnosticsApi,
    ElectronAppInfoApi,
    ElectronClipboardApi,
    ElectronDevtoolsMenuApi,
    ElectronDialogApi,
    ElectronFileApi,
    ElectronFitBrowserApi,
    ElectronGyazoExternalApi,
    ElectronMainStateApi,
    ElectronMenuEventApi,
    ElectronPreloadEventApi,
    ElectronShellExternalApi,
    ElectronThemeApi,
} from "./preloadApiDomains";

import type { FitDecodeResult, FitMessages } from "./fit";
import type {
    ChannelInfo,
    ClipboardRequestPayload,
    ClipboardResponsePayload,
    DevtoolsInjectMenuFitFilePath,
    DevtoolsInjectMenuResponse,
    DevtoolsInjectMenuTheme,
    DialogOpenFileResponse,
    DialogOpenFolderResponse,
    DialogOpenOverlayFilesResponse,
    FitBrowserEnabledResponse,
    FitBrowserGetFolderResponse,
    FitBrowserListFolderRequest,
    FitBrowserListFolderResponse,
    FitBrowserSetEnabledRequest,
    FitBrowserSetFolderRequest,
    FitBrowserSetFolderResponse,
    FileSystemRequestPayload,
    FileSystemResponsePayload,
    GyazoServerStartRequest,
    GyazoServerStartResponse,
    GyazoServerStopResponse,
    InfoPlatformResponse,
    InfoStringResponse,
    IpcResponsePayload,
    MainStateErrorsRequest,
    MainStateErrorsResponse,
    MainStateGetRequest,
    MainStateGetResponse,
    MainStateListener,
    MainStateListenRequest,
    MainStateListenResponse,
    MainStateMetricsResponse,
    MainStateOperationRequest,
    MainStateOperationResponse,
    MainStateOperationsResponse,
    MainStatePath,
    MainStateSetOptions,
    MainStateSetResponse,
    MainStateSetValue,
    MainStateUnlistenRequest,
    MainStateUnlistenResponse,
    RecentFileRequestPayload,
    RecentFilesListResponse,
    ShellOpenExternalRequest,
    ShellOpenExternalResponse,
    ThemePreferenceResponse,
    UpdateEventName,
} from "./ipc";

export interface ElectronApiDiagnosticsApi {
    getChannelInfo: () => ChannelInfo;
    validateAPI: () => boolean;
}

export interface ElectronAppInfoApi {
    getAppVersion: () => Promise<InfoStringResponse>;
    getChromeVersion: () => Promise<InfoStringResponse>;
    getElectronVersion: () => Promise<InfoStringResponse>;
    getLicenseInfo: () => Promise<InfoStringResponse>;
    getNodeVersion: () => Promise<InfoStringResponse>;
    getPlatformInfo: () => Promise<InfoPlatformResponse>;
}

export interface ElectronClipboardApi {
    writeClipboardPngDataUrl: (
        pngDataUrl: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;
    writeClipboardText: (
        text: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;
}

export interface ElectronDevtoolsMenuApi {
    injectMenu: (
        theme?: DevtoolsInjectMenuTheme,
        fitFilePath?: DevtoolsInjectMenuFitFilePath
    ) => Promise<DevtoolsInjectMenuResponse>;
}

export interface ElectronDialogApi {
    /**
     * Opens the native single-file FIT dialog; returns selected path or null
     * when cancelled.
     */
    openFile: () => Promise<DialogOpenFileResponse>;
    /** Alias for openFile; returns selected path or null when cancelled. */
    openFileDialog: () => Promise<DialogOpenFileResponse>;
    /**
     * Opens a folder picker dialog; returns selected folder path or null when
     * cancelled.
     */
    openFolderDialog: () => Promise<DialogOpenFolderResponse>;
    /**
     * Opens the native multi-select overlay dialog; returns selected paths
     * (possibly empty).
     */
    openOverlayDialog: () => Promise<DialogOpenOverlayFilesResponse>;
}

export interface ElectronFileApi {
    addRecentFile: (
        filePath: RecentFileRequestPayload
    ) => Promise<RecentFilesListResponse>;
    decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    readFile: (
        filePath: FileSystemRequestPayload
    ) => Promise<FileSystemResponsePayload>;
    recentFiles: () => Promise<RecentFilesListResponse>;
}

export interface ElectronFitBrowserApi {
    /** Get the persisted FIT browser folder (main process setting). */
    getFitBrowserFolder: () => Promise<FitBrowserGetFolderResponse>;
    isFitBrowserEnabled: () => Promise<FitBrowserEnabledResponse>;
    /** List entries under the persisted FIT browser folder. */
    listFitBrowserFolder: (
        relPath?: FitBrowserListFolderRequest
    ) => Promise<FitBrowserListFolderResponse>;
    onFitBrowserEnabledChanged: (
        callback: (enabled: boolean) => void
    ) => () => void;
    setFitBrowserEnabled: (
        enabled: FitBrowserSetEnabledRequest
    ) => Promise<FitBrowserEnabledResponse>;
    setFitBrowserFolder: (
        folderPath: FitBrowserSetFolderRequest
    ) => Promise<FitBrowserSetFolderResponse>;
}

export interface ElectronGyazoExternalApi {
    onGyazoOAuthCallback: (
        callback: (data: IpcResponsePayload) => void
    ) => () => void;
    startGyazoServer: (
        port: GyazoServerStartRequest
    ) => Promise<GyazoServerStartResponse>;
    stopGyazoServer: () => Promise<GyazoServerStopResponse>;
}

export interface ElectronShellExternalApi {
    openExternal: (
        url: ShellOpenExternalRequest
    ) => Promise<ShellOpenExternalResponse>;
}

export interface ElectronMainStateApi {
    getErrors: (
        limit?: MainStateErrorsRequest
    ) => Promise<MainStateErrorsResponse>;
    getMainState: (path?: MainStateGetRequest) => Promise<MainStateGetResponse>;
    getMetrics: () => Promise<MainStateMetricsResponse>;
    getOperation: (
        operationId: MainStateOperationRequest
    ) => Promise<MainStateOperationResponse | null>;
    getOperations: () => Promise<MainStateOperationsResponse>;
    listenToMainState: (
        path: MainStateListenRequest,
        callback: MainStateListener
    ) => Promise<MainStateListenResponse>;
    setMainState: (
        path: MainStatePath,
        value: MainStateSetValue,
        options?: MainStateSetOptions
    ) => Promise<MainStateSetResponse>;
    subscribeToMainState: (
        path: MainStatePath,
        callback: MainStateListener
    ) => Promise<() => Promise<boolean>>;
    unlistenFromMainState: (
        path: MainStateUnlistenRequest,
        callback: MainStateListener
    ) => Promise<MainStateUnlistenResponse>;
}

export interface ElectronMenuEventApi {
    checkForUpdates: () => void;
    installUpdate: () => void;
    onDecoderOptionsChanged: (
        callback: (options: IpcResponsePayload) => void
    ) => () => void;
    onExportFile: (
        callback: (filePath: IpcResponsePayload) => void
    ) => () => void;
    onMenuAbout: (callback: () => void) => () => void;
    onMenuCheckForUpdates: (callback: () => void) => () => void;
    onMenuExport: (callback: () => void) => () => void;
    onMenuKeyboardShortcuts: (callback: () => void) => () => void;
    onMenuOpenFile: (callback: () => void) => () => void;
    onMenuOpenOverlay: (callback: () => void) => () => void;
    onMenuPrint: (callback: () => void) => () => void;
    onMenuRestartUpdate: (callback: () => void) => () => void;
    onMenuSaveAs: (callback: () => void) => () => void;
    onOpenAccentColorPicker: (callback: () => void) => () => void;
    onOpenRecentFile: (callback: (filePath: string) => void) => () => void;
    onOpenSummaryColumnSelector: (callback: () => void) => () => void;
    onSetFontSize: (callback: (size: IpcResponsePayload) => void) => () => void;
    onSetHighContrast: (
        callback: (mode: IpcResponsePayload) => void
    ) => () => void;
    onSetTheme: (callback: (theme: string) => void) => () => void;
    onShowNotification: (
        callback: (...args: IpcResponsePayload[]) => void
    ) => () => void;
    onUnloadFitFile: (callback: () => void) => () => void;
    requestExport: () => void;
    requestSaveAs: () => void;
    sendThemeChanged: (theme: string) => void;
    setFullScreen: (flag: boolean) => void;
}

export interface ElectronPreloadEventApi {
    /** Fired when a file is opened and parsed in main process. */
    onFileOpened?: (
        callback: (fileData: FitMessages, filePath: string) => void
    ) => void;
    /** Notify main process of the currently loaded file (or null when cleared). */
    notifyFitFileLoaded: (filePath: null | string) => void;
    onUpdateEvent: (
        eventName: UpdateEventName,
        callback: (...args: IpcResponsePayload[]) => void
    ) => (() => void) | undefined;
}

export interface ElectronThemeApi {
    getTheme: () => Promise<ThemePreferenceResponse>;
}

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
    RecentFilesApprovalResponse,
    RecentFilesListResponse,
    ShellOpenExternalRequest,
    ShellOpenExternalResponse,
    ThemePreferenceResponse,
    UpdateEventName,
} from "./ipc";

/** Renderer-facing API exposed by the Electron preload script. */
export interface ElectronAPI {
    /**
     * Legacy compatibility method. Renderer-originated recent-file approval is
     * denied; trusted menu actions grant read access in the main process.
     */
    approveRecentFile: (
        filePath: RecentFileRequestPayload
    ) => Promise<RecentFilesApprovalResponse>;
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
    readFile: (
        filePath: FileSystemRequestPayload
    ) => Promise<FileSystemResponsePayload>;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    /** Get the persisted FIT browser folder (main process setting). */
    getFitBrowserFolder: () => Promise<FitBrowserGetFolderResponse>;
    /** List entries under the persisted FIT browser folder. */
    listFitBrowserFolder: (
        relPath?: FitBrowserListFolderRequest
    ) => Promise<FitBrowserListFolderResponse>;
    isFitBrowserEnabled: () => Promise<FitBrowserEnabledResponse>;
    setFitBrowserEnabled: (
        enabled: FitBrowserSetEnabledRequest
    ) => Promise<FitBrowserEnabledResponse>;
    setFitBrowserFolder: (
        folderPath: FitBrowserSetFolderRequest
    ) => Promise<FitBrowserSetFolderResponse>;
    recentFiles: () => Promise<RecentFilesListResponse>;
    addRecentFile: (
        filePath: RecentFileRequestPayload
    ) => Promise<RecentFilesListResponse>;

    getTheme: () => Promise<ThemePreferenceResponse>;
    sendThemeChanged: (theme: string) => void;

    getAppVersion: () => Promise<InfoStringResponse>;
    getElectronVersion: () => Promise<InfoStringResponse>;
    getNodeVersion: () => Promise<InfoStringResponse>;
    getChromeVersion: () => Promise<InfoStringResponse>;
    getLicenseInfo: () => Promise<InfoStringResponse>;
    getPlatformInfo: () => Promise<InfoPlatformResponse>;

    openExternal: (
        url: ShellOpenExternalRequest
    ) => Promise<ShellOpenExternalResponse>;

    writeClipboardText: (
        text: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;
    writeClipboardPngDataUrl: (
        pngDataUrl: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;

    startGyazoServer: (
        port: GyazoServerStartRequest
    ) => Promise<GyazoServerStartResponse>;
    stopGyazoServer: () => Promise<GyazoServerStopResponse>;

    onDecoderOptionsChanged: (
        callback: (options: IpcResponsePayload) => void
    ) => () => void;
    onExportFile: (
        callback: (filePath: IpcResponsePayload) => void
    ) => () => void;
    onFitBrowserEnabledChanged: (
        callback: (enabled: boolean) => void
    ) => () => void;
    onGyazoOAuthCallback: (
        callback: (data: IpcResponsePayload) => void
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
    onSetFontSize: (callback: (size: IpcResponsePayload) => void) => () => void;
    onSetHighContrast: (
        callback: (mode: IpcResponsePayload) => void
    ) => () => void;
    onSetTheme: (callback: (theme: string) => void) => () => void;
    onShowNotification: (
        callback: (...args: IpcResponsePayload[]) => void
    ) => () => void;
    onOpenSummaryColumnSelector: (callback: () => void) => () => void;
    onUnloadFitFile: (callback: () => void) => () => void;
    onUpdateEvent: (
        eventName: UpdateEventName,
        callback: (...args: IpcResponsePayload[]) => void
    ) => (() => void) | undefined;
    /** Fired when a file is opened and parsed in main process. */
    onFileOpened?: (
        callback: (fileData: FitMessages, filePath: string) => void
    ) => void;

    checkForUpdates: () => void;
    installUpdate: () => void;
    requestExport: () => void;
    requestSaveAs: () => void;
    setFullScreen: (flag: boolean) => void;

    getMainState: (path?: MainStateGetRequest) => Promise<MainStateGetResponse>;
    setMainState: (
        path: MainStatePath,
        value: MainStateSetValue,
        options?: MainStateSetOptions
    ) => Promise<MainStateSetResponse>;
    listenToMainState: (
        path: MainStateListenRequest,
        callback: MainStateListener
    ) => Promise<MainStateListenResponse>;
    unlistenFromMainState: (
        path: MainStateUnlistenRequest,
        callback: MainStateListener
    ) => Promise<MainStateUnlistenResponse>;
    subscribeToMainState: (
        path: MainStatePath,
        callback: MainStateListener
    ) => Promise<() => Promise<boolean>>;
    getOperation: (
        operationId: MainStateOperationRequest
    ) => Promise<MainStateOperationResponse | null>;
    getOperations: () => Promise<MainStateOperationsResponse>;
    getErrors: (
        limit?: MainStateErrorsRequest
    ) => Promise<MainStateErrorsResponse>;
    getMetrics: () => Promise<MainStateMetricsResponse>;

    /** Notify main process of the currently loaded file (or null when cleared). */
    notifyFitFileLoaded: (filePath: null | string) => void;
    injectMenu: (
        theme?: DevtoolsInjectMenuTheme,
        fitFilePath?: DevtoolsInjectMenuFitFilePath
    ) => Promise<DevtoolsInjectMenuResponse>;
    getChannelInfo: () => ChannelInfo;
    validateAPI: () => boolean;
}

export type ElectronApiDiagnosticsApi = Pick<
    ElectronAPI,
    "getChannelInfo" | "validateAPI"
>;

export type ElectronAppInfoApi = Pick<
    ElectronAPI,
    | "getAppVersion"
    | "getChromeVersion"
    | "getElectronVersion"
    | "getLicenseInfo"
    | "getNodeVersion"
    | "getPlatformInfo"
>;

export type ElectronClipboardApi = Pick<
    ElectronAPI,
    "writeClipboardPngDataUrl" | "writeClipboardText"
>;

export type ElectronDevtoolsMenuApi = Pick<ElectronAPI, "injectMenu">;

export type ElectronDialogApi = Pick<
    ElectronAPI,
    "openFile" | "openFileDialog" | "openFolderDialog" | "openOverlayDialog"
>;

export type ElectronGyazoExternalApi = Pick<
    ElectronAPI,
    "onGyazoOAuthCallback" | "startGyazoServer" | "stopGyazoServer"
>;

export type ElectronShellExternalApi = Pick<ElectronAPI, "openExternal">;

export type ElectronFileApi = Pick<
    ElectronAPI,
    | "addRecentFile"
    | "approveRecentFile"
    | "decodeFitFile"
    | "parseFitFile"
    | "readFile"
    | "recentFiles"
>;

export type ElectronFitBrowserApi = Pick<
    ElectronAPI,
    | "getFitBrowserFolder"
    | "isFitBrowserEnabled"
    | "listFitBrowserFolder"
    | "onFitBrowserEnabledChanged"
    | "setFitBrowserEnabled"
    | "setFitBrowserFolder"
>;

export type ElectronPreloadEventApi = Pick<
    ElectronAPI,
    "notifyFitFileLoaded" | "onFileOpened" | "onUpdateEvent"
>;

export type ElectronMainStateApi = Pick<
    ElectronAPI,
    | "getErrors"
    | "getMainState"
    | "getMetrics"
    | "getOperation"
    | "getOperations"
    | "listenToMainState"
    | "setMainState"
    | "subscribeToMainState"
    | "unlistenFromMainState"
>;

export type ElectronMenuEventApi = Pick<
    ElectronAPI,
    | "checkForUpdates"
    | "installUpdate"
    | "onDecoderOptionsChanged"
    | "onExportFile"
    | "onMenuAbout"
    | "onMenuCheckForUpdates"
    | "onMenuExport"
    | "onMenuKeyboardShortcuts"
    | "onMenuOpenFile"
    | "onMenuOpenOverlay"
    | "onMenuPrint"
    | "onMenuRestartUpdate"
    | "onMenuSaveAs"
    | "onOpenAccentColorPicker"
    | "onOpenRecentFile"
    | "onOpenSummaryColumnSelector"
    | "onSetFontSize"
    | "onSetHighContrast"
    | "onSetTheme"
    | "onShowNotification"
    | "onUnloadFitFile"
    | "requestExport"
    | "requestSaveAs"
    | "sendThemeChanged"
    | "setFullScreen"
>;

export type ElectronThemeApi = Pick<ElectronAPI, "getTheme">;

/** Internal flags attached during migration and development diagnostics. */
export type ElectronAPIWithDevFlags = ElectronAPI & {
    _summaryColListenerAdded?: boolean;
    __devMode?: boolean;
};

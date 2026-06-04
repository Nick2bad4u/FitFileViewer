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
    GenericInvokeChannel,
    GenericSendChannel,
    GyazoServerStartRequest,
    GyazoServerStartResponse,
    GyazoServerStopResponse,
    InfoPlatformResponse,
    InfoStringResponse,
    IpcEventCallback,
    IpcRequestPayload,
    IpcResponsePayload,
    InvokeRequestArgs,
    InvokeResponsePayloadForChannel,
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
    RendererIpcEventChannel,
    ShellOpenExternalRequest,
    ShellOpenExternalResponse,
    ThemePreferenceResponse,
    UpdateEventName,
} from "./ipc";

/** Renderer-facing API exposed by the Electron preload script. */
export interface ElectronAPI {
    /** Approve a persisted recent file path for subsequent readFile() calls. */
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

    onFitBrowserEnabledChanged: (
        callback: (enabled: boolean) => void
    ) => () => void;
    onGyazoOAuthCallback: (
        callback: (data: IpcResponsePayload) => void
    ) => () => void;
    onMenuOpenFile: (callback: () => void) => () => void;
    onMenuOpenOverlay: (callback: () => void) => () => void;
    onOpenRecentFile: (callback: (filePath: string) => void) => () => void;
    onSetTheme: (callback: (theme: string) => void) => () => void;
    onOpenSummaryColumnSelector: (callback: () => void) => () => void;
    onUnloadFitFile: (callback: () => void) => () => void;
    onUpdateEvent: (
        eventName: UpdateEventName,
        callback: (...args: IpcResponsePayload[]) => void
    ) => () => void;
    /** Fired when a file is opened and parsed in main process. */
    onFileOpened?: (
        callback: (fileData: FitMessages, filePath: string) => void
    ) => void;

    checkForUpdates: () => void;
    installUpdate: () => void;
    setFullScreen: (flag: boolean) => void;

    onIpc: (
        channel: RendererIpcEventChannel,
        callback: IpcEventCallback
    ) => (() => void) | undefined;
    send: (channel: GenericSendChannel, ...args: IpcRequestPayload[]) => void;
    invoke: <Channel extends GenericInvokeChannel>(
        channel: Channel,
        ...args: InvokeRequestArgs<Channel>
    ) => Promise<InvokeResponsePayloadForChannel<Channel>>;

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

/** Internal flags attached during migration and development diagnostics. */
export type ElectronAPIWithDevFlags = ElectronAPI & {
    _summaryColListenerAdded?: boolean;
    __devMode?: boolean;
};

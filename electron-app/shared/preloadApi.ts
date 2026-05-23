import type { FitDecodeResult, FitMessages } from "./fit";
import type {
    ChannelInfo,
    ClipboardRequestPayload,
    ClipboardResponsePayload,
    FitBrowserListFolderResult,
    FileSystemRequestPayload,
    FileSystemResponsePayload,
    GenericInvokeChannel,
    GenericSendChannel,
    GyazoServerStartResult,
    GyazoServerStopResult,
    IpcEventCallback,
    IpcRequestPayload,
    IpcResponsePayload,
    IpcSerializable,
    MainStateListener,
    PlatformInfo,
    RecentFileRequestPayload,
    RecentFilesApprovalResponse,
    RecentFilesListResponse,
    RendererIpcEventChannel,
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
    openFile: () => Promise<null | string>;
    /** Alias for openFile; returns selected path or null when cancelled. */
    openFileDialog: () => Promise<null | string>;
    /**
     * Opens a folder picker dialog; returns selected folder path or null when
     * cancelled.
     */
    openFolderDialog: () => Promise<null | string>;
    /**
     * Opens the native multi-select overlay dialog; returns selected paths
     * (possibly empty).
     */
    openOverlayDialog: () => Promise<string[]>;
    readFile: (
        filePath: FileSystemRequestPayload
    ) => Promise<FileSystemResponsePayload>;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    /** Get the persisted FIT browser folder (main process setting). */
    getFitBrowserFolder: () => Promise<null | string>;
    /** List entries under the persisted FIT browser folder. */
    listFitBrowserFolder: (
        relPath?: string
    ) => Promise<FitBrowserListFolderResult>;
    isFitBrowserEnabled: () => Promise<boolean>;
    setFitBrowserEnabled: (enabled: boolean) => Promise<boolean>;
    setFitBrowserFolder: (folderPath: string) => Promise<boolean>;
    recentFiles: () => Promise<RecentFilesListResponse>;
    addRecentFile: (
        filePath: RecentFileRequestPayload
    ) => Promise<RecentFilesListResponse>;

    getTheme: () => Promise<string>;
    sendThemeChanged: (theme: string) => void;

    getAppVersion: () => Promise<string>;
    getElectronVersion: () => Promise<string>;
    getNodeVersion: () => Promise<string>;
    getChromeVersion: () => Promise<string>;
    getLicenseInfo: () => Promise<string>;
    getPlatformInfo: () => Promise<PlatformInfo>;

    openExternal: (url: string) => Promise<boolean>;

    writeClipboardText: (
        text: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;
    writeClipboardPngDataUrl: (
        pngDataUrl: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;

    startGyazoServer: (port: number) => Promise<GyazoServerStartResult>;
    stopGyazoServer: () => Promise<GyazoServerStopResult>;

    onMenuOpenFile: (callback: () => void) => () => void;
    onMenuOpenOverlay: (callback: () => void) => () => void;
    onOpenRecentFile: (callback: (filePath: string) => void) => () => void;
    onSetTheme: (callback: (theme: string) => void) => () => void;
    onOpenSummaryColumnSelector: (callback: () => void) => () => void;
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
    invoke: (
        channel: GenericInvokeChannel,
        ...args: IpcRequestPayload[]
    ) => Promise<IpcResponsePayload>;

    getMainState: (path?: string) => Promise<IpcSerializable>;
    setMainState: (
        path: string,
        value: IpcSerializable,
        options?: IpcSerializable
    ) => Promise<boolean>;
    listenToMainState: (
        path: string,
        callback: MainStateListener
    ) => Promise<boolean>;
    unlistenFromMainState: (
        path: string,
        callback: MainStateListener
    ) => Promise<boolean>;
    subscribeToMainState: (
        path: string,
        callback: MainStateListener
    ) => Promise<() => Promise<boolean>>;
    getOperation: (operationId: string) => Promise<IpcSerializable | null>;
    getOperations: () => Promise<IpcSerializable>;
    getErrors: (limit?: number) => Promise<IpcSerializable>;
    getMetrics: () => Promise<IpcSerializable>;

    /** Notify main process of the currently loaded file (or null when cleared). */
    notifyFitFileLoaded: (filePath: null | string) => void;
    injectMenu: (
        theme?: null | string,
        fitFilePath?: null | string
    ) => Promise<boolean>;
    getChannelInfo: () => ChannelInfo;
    validateAPI: () => boolean;
}

/** Internal flags attached during migration and development diagnostics. */
export type ElectronAPIWithDevFlags = ElectronAPI & {
    _summaryColListenerAdded?: boolean;
    __devMode?: boolean;
};

import type { FitDecodeResult } from "../shared/fit";
import type {
    ChannelInfo,
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
    RendererIpcEventChannel,
    UpdateEventName,
} from "../shared/ipc";

/** Renderer-facing API exposed by preload through Electron contextBridge. */
export type ElectronAPI = {
    addRecentFile: (filePath: string) => Promise<string[]>;
    approveRecentFile: (filePath: string) => Promise<boolean>;
    checkForUpdates: () => void;
    decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    getAppVersion: () => Promise<string>;
    getChannelInfo: () => ChannelInfo;
    getChromeVersion: () => Promise<string>;
    getElectronVersion: () => Promise<string>;
    getErrors: (limit?: number) => Promise<IpcSerializable>;
    getFitBrowserFolder: () => Promise<null | string>;
    getLicenseInfo: () => Promise<string>;
    getMainState: (path?: string) => Promise<IpcSerializable>;
    getMetrics: () => Promise<IpcSerializable>;
    getNodeVersion: () => Promise<string>;
    getOperation: (operationId: string) => Promise<IpcSerializable | null>;
    getOperations: () => Promise<IpcSerializable>;
    getPlatformInfo: () => Promise<PlatformInfo>;
    getTheme: () => Promise<string>;
    injectMenu: (
        theme?: null | string,
        fitFilePath?: null | string
    ) => Promise<boolean>;
    installUpdate: () => void;
    invoke: (
        channel: GenericInvokeChannel,
        ...args: IpcRequestPayload[]
    ) => Promise<IpcResponsePayload>;
    isFitBrowserEnabled: () => Promise<boolean>;
    listFitBrowserFolder: (relPath?: string) => Promise<IpcSerializable>;
    listenToMainState: (
        path: string,
        callback: MainStateListener
    ) => Promise<boolean>;
    notifyFitFileLoaded: (filePath: null | string) => void;
    onIpc: (
        channel: RendererIpcEventChannel,
        callback: IpcEventCallback
    ) => (() => void) | undefined;
    onMenuOpenFile: (callback: () => void) => () => void;
    onMenuOpenOverlay: (callback: () => void) => () => void;
    onOpenRecentFile: (callback: (filePath: string) => void) => () => void;
    onOpenSummaryColumnSelector: (callback: () => void) => () => void;
    onSetTheme: (callback: (theme: string) => void) => () => void;
    onUpdateEvent: (
        eventName: UpdateEventName,
        callback: (...args: IpcResponsePayload[]) => void
    ) => () => void;
    openExternal: (url: string) => Promise<boolean>;
    openFile: () => Promise<null | string>;
    openFileDialog: () => Promise<null | string>;
    openFolderDialog: () => Promise<null | string>;
    openOverlayDialog: () => Promise<string[]>;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult>;
    readFile: (filePath: string) => Promise<ArrayBuffer>;
    recentFiles: () => Promise<string[]>;
    send: (channel: GenericSendChannel, ...args: IpcRequestPayload[]) => void;
    sendThemeChanged: (theme: string) => void;
    setFitBrowserEnabled: (enabled: boolean) => Promise<boolean>;
    setFitBrowserFolder: (folderPath: string) => Promise<boolean>;
    setFullScreen: (flag: boolean) => void;
    setMainState: (
        path: string,
        value: IpcSerializable,
        options?: IpcSerializable
    ) => Promise<boolean>;
    startGyazoServer: (port: number) => Promise<GyazoServerStartResult>;
    stopGyazoServer: () => Promise<GyazoServerStopResult>;
    subscribeToMainState: (
        path: string,
        callback: MainStateListener
    ) => Promise<() => Promise<boolean>>;
    unlistenFromMainState: (
        path: string,
        callback: MainStateListener
    ) => Promise<boolean>;
    validateAPI: () => boolean;
    writeClipboardPngDataUrl: (pngDataUrl: string) => Promise<boolean>;
    writeClipboardText: (text: string) => Promise<boolean>;
};

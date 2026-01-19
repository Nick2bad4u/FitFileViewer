export type GyazoServerStartResult = {
    success: boolean;
    port: number;
    message?: string;
};
export type GyazoServerStopResult = {
    success: boolean;
    message?: string;
};
export type ChannelInfo = {
    channels: Record<string, string>;
    events: Record<string, string>;
    totalChannels: number;
    totalEvents: number;
};
export type PlatformInfo = {
    platform: string;
    arch: string;
};
export type ElectronAPI = {
    approveRecentFile: (filePath: string) => Promise<boolean>;
    openFile: () => Promise<string | null>;
    openFileDialog: () => Promise<string | null>;
    openFolderDialog: () => Promise<string | null>;
    openOverlayDialog: () => Promise<string[]>;
    readFile: (filePath: string) => Promise<ArrayBuffer>;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<any>;
    decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<any>;
    getFitBrowserFolder: () => Promise<string | null>;
    listFitBrowserFolder: (relPath?: string) => Promise<any>;
    recentFiles: () => Promise<string[]>;
    addRecentFile: (filePath: string) => Promise<string[]>;
    getTheme: () => Promise<string>;
    sendThemeChanged: (theme: string) => void;
    getAppVersion: () => Promise<string>;
    getElectronVersion: () => Promise<string>;
    getNodeVersion: () => Promise<string>;
    getChromeVersion: () => Promise<string>;
    getLicenseInfo: () => Promise<string>;
    getPlatformInfo: () => Promise<PlatformInfo>;
    openExternal: (url: string) => Promise<boolean>;
    startGyazoServer: (port: number) => Promise<GyazoServerStartResult>;
    stopGyazoServer: () => Promise<GyazoServerStopResult>;
    onMenuOpenFile: (callback: () => void) => () => void;
    onMenuOpenOverlay: (callback: () => void) => () => void;
    onOpenRecentFile: (callback: (filePath: string) => void) => () => void;
    onSetTheme: (callback: (theme: string) => void) => () => void;
    onOpenSummaryColumnSelector: (callback: () => void) => () => void;
    onUpdateEvent: (eventName: string, callback: (...args: any[]) => void) => () => void;
    checkForUpdates: () => void;
    installUpdate: () => void;
    setFullScreen: (flag: boolean) => void;
    onIpc: (channel: string, callback: (event: object, ...args: any[]) => void) => (() => void) | undefined;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    notifyFitFileLoaded: (filePath: string | null) => void;
    injectMenu: (theme?: string | null, fitFilePath?: string | null) => Promise<boolean>;
    /** Main-process state: get a value or the entire state when path is omitted. */
    getMainState: (path?: string) => Promise<any>;
    /** Main-process state: set a value at a specific path. */
    setMainState: (path: string, value: any, options?: any) => Promise<boolean>;
    /** Main-process state: register a listener for changes at a path. */
    listenToMainState: (path: string, callback: (change: any) => void) => Promise<boolean>;
    /** Main-process state: remove a previously registered listener. */
    unlistenFromMainState: (path: string, callback: (change: any) => void) => Promise<boolean>;
    /** Convenience: listenToMainState + returns unsubscribe function. */
    subscribeToMainState: (path: string, callback: (change: any) => void) => Promise<() => Promise<boolean>>;
    /** Main-process operations: get one operation by id. */
    getOperation: (operationId: string) => Promise<any>;
    /** Main-process operations: get all operations. */
    getOperations: () => Promise<any>;
    /** Main-process errors: get recent errors. */
    getErrors: (limit?: number) => Promise<any>;
    /** Main-process metrics: get performance metrics. */
    getMetrics: () => Promise<any>;
    getChannelInfo: () => ChannelInfo;
    validateAPI: () => boolean;
};

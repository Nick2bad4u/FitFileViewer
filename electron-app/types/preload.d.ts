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
    openOverlayDialog: () => Promise<string[]>;
    readFile: (filePath: string) => Promise<ArrayBuffer>;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<any>;
    decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<any>;
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
    onMenuOpenFile: (callback: Function) => void;
    onMenuOpenOverlay: (callback: Function) => void;
    onOpenRecentFile: (callback: (filePath: string) => void) => void;
    onSetTheme: (callback: (theme: string) => void) => void;
    onOpenSummaryColumnSelector: (callback: Function) => void;
    onUpdateEvent: (eventName: string, callback: Function) => void;
    checkForUpdates: () => void;
    installUpdate: () => void;
    setFullScreen: (flag: boolean) => void;
    onIpc: (channel: string, callback: Function) => void;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    notifyFitFileLoaded: (filePath: string | null) => void;
    injectMenu: (theme?: string | null, fitFilePath?: string | null) => Promise<boolean>;
    getChannelInfo: () => ChannelInfo;
    validateAPI: () => boolean;
};
//# sourceMappingURL=preload.d.ts.map

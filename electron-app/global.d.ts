/* eslint-disable */
/*
 Global ambient type augmentation for values injected via the Electron preload script.
 This provides TypeScript awareness for `window.electronAPI` and related helpers so that
 renderer JavaScript (checked with `checkJs`) does not emit "Property 'electronAPI' does not exist" errors.

 Keep the interface intentionally simple at this stage; we refine return/argument types incrementally.
*/

interface GyazoServerStartResult { success: boolean; port: number; message?: string }
interface GyazoServerStopResult { success: boolean; message?: string }
interface PlatformInfo { platform: string; arch: string }
interface ChannelInfo { channels: Record<string,string>; events: Record<string,string>; totalChannels: number; totalEvents: number }

interface ElectronAPI {
    // File operations
    openFile(): Promise<string[]>
    openFileDialog(): Promise<string[]>
    readFile(filePath: string): Promise<ArrayBuffer>
    parseFitFile(arrayBuffer: ArrayBuffer): Promise<any>
    decodeFitFile(arrayBuffer: ArrayBuffer): Promise<any>
    recentFiles(): Promise<string[]>
    addRecentFile(filePath: string): Promise<string[]>

    // Theme
    getTheme(): Promise<string>
    sendThemeChanged(theme: string): void

    // Versions / metadata
    getAppVersion(): Promise<string>
    getElectronVersion(): Promise<string>
    getNodeVersion(): Promise<string>
    getChromeVersion(): Promise<string>
    getLicenseInfo(): Promise<string>
    getPlatformInfo(): Promise<PlatformInfo>

    // External
    openExternal(url: string): Promise<boolean>

    // Gyazo server
    startGyazoServer(port: number): Promise<GyazoServerStartResult>
    stopGyazoServer(): Promise<GyazoServerStopResult>

    // Events (registration functions return void)
    onMenuOpenFile(callback: Function): void
    onOpenRecentFile(callback: (filePath: string) => void): void
    onSetTheme(callback: (theme: string) => void): void
    onOpenSummaryColumnSelector(callback: Function): void
    onUpdateEvent(eventName: string, callback: Function): void
    /** Fired when a file is opened and parsed in main process */
    onFileOpened?(callback: (fileData: any, filePath: string) => void): void

    // Updater
    checkForUpdates(): void
    installUpdate(): void
    setFullScreen(flag: boolean): void

    // Generic IPC
    onIpc(channel: string, callback: Function): void
    send(channel: string, ...args: any[]): void
    invoke(channel: string, ...args: any[]): Promise<any>

    // Dev / debug
    injectMenu(theme?: string | null, fitFilePath?: string | null): Promise<boolean>
    getChannelInfo(): ChannelInfo
    validateAPI(): boolean
}

declare global {
    interface Window {
        /* Core preload API (optionally extended with internal dev flags) */
        electronAPI: ElectronAPI & { _summaryColListenerAdded?: boolean; __devMode?: boolean }

        // --- Data / state objects ---
        globalData?: any
        AppState?: any
        __appState?: any
        chartStateManager?: any
        tabStateManager?: any
        chartControlsState?: any
        rendererUtils?: any
        loadedFitFiles?: any[]

        // --- Zone / chart related data ---
        heartRateZones?: ZoneInfo[]
        powerZones?: ZoneInfo[]
        _chartjsInstances?: any[]
        ChartUpdater?: any
        chartUpdater?: any
        Chart?: any

        // --- UI helpers & rendering functions (legacy; slated for removal) ---
        showFitData?: (data: any, fileName?: string) => void
        renderChartJS?: (...args: any[]) => void
        renderMap?: (...args: any[]) => void
        renderSummary?: (...args: any[]) => void
        createTables?: (...args: any[]) => void

        // --- Notification & modals ---
        showNotification?: (message: string, type?: string, duration?: number, options?: any) => Promise<void>
        showKeyboardShortcutsModal?: () => void
        closeKeyboardShortcutsModal?: () => void
        aboutModalDevHelpers?: any

        // --- Zone color / controls utilities ---
        updateInlineZoneColorSelectors?: (root?: HTMLElement) => void
        clearZoneColorData?: (field: string, zoneCount: number) => void
        resetAllSettings?: () => void
        updateMapTheme?: () => void
        _mapThemeListener?: any

        // --- Tab button / UI state debugging helpers ---
        setTabButtonsEnabled?: (enabled: boolean) => void
        areTabButtonsEnabled?: () => boolean
        debugTabButtons?: (...args: any[]) => void
        forceEnableTabButtons?: () => void
        testTabButtonClicks?: () => void
        debugTabState?: (...args: any[]) => void
        forceFixTabButtons?: () => void

        // --- Drag & drop / misc ---
        dragDropHandler?: any
        injectMenu?: (theme?: string|null, fitFilePath?: string|null) => void
        devCleanup?: () => void
        enableDragAndDrop?: boolean

        // --- Internal flags / timeouts ---
        __DEVELOPMENT__?: boolean
        __state_debug?: boolean
        __persistenceTimeout?: any

        // --- External libs exposed globally ---
        screenfull?: any

        // --- Map / markers ---
        mapMarkerCount?: number
    /** Leaflet global (present when Leaflet library loaded) */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L?: any
    }

    /**
     * Minimal ambient declaration for Leaflet global until modules are migrated.
     * Provide both a global variable (for direct `L`) and properties on Window/Node globals
     * so assignments like `global.L = ...` in Vitest setup and `window.L` in the renderer
     * type-check without TS2339 errors.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var L: any; // direct global variable access

    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global { // for test / Node environments
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            L?: any
        }
    }
}

/** Basic shape for a zone (heart rate or power) after processing */
export interface ZoneInfo {
    zone?: number
    /** Label for display, e.g. "Zone 1" */
    label?: string
    /** Total seconds in zone */
    time?: number
    /** Percentage (0-100) */
    percent?: number
    /** Optional count/value metrics */
    value?: number
    /** Color string applied to the zone */
    color?: string
}

export {};

/** Flexible callback type for legacy renderer extension points. */
export type UnknownRendererFunction = (...args: unknown[]) => unknown;
/** Optional global properties installed by the renderer entry point. */
export type WindowExtensions = {
    /**
     * - Development mode flag
     */
    __DEVELOPMENT__?: boolean;
    /**
     * - Export GPX button creator
     */
    createExportGPXButton?: () => HTMLButtonElement;
    /**
     * - Application information
     */
    APP_INFO?: Record<string, unknown>;
    /**
     * - Renderer debug utilities
     */
    __renderer_debug?: Record<string, unknown>;
    /**
     * - Renderer development utilities
     */
    __renderer_dev?: Record<string, unknown>;
    /**
     * - Sensor debug utilities
     */
    __sensorDebug?: Record<string, unknown>;
    /**
     * - Chart formatting debug utilities
     */
    __debugChartFormatting?: Record<string, unknown>;
};
/** Extra development-only properties exposed on the preload bridge. */
export type ElectronAPIExtensions = {
    /**
     * - Development mode flag in electron API
     */
    __devMode?: boolean;
};
/** Browser performance object with Chromium memory metrics. */
export type PerformanceExtended = {
    /**
     * - Memory usage information
     */
    memory?: {
        usedJSHeapSize?: number | undefined;
        totalJSHeapSize?: number | undefined;
        jsHeapSizeLimit?: number | undefined;
    };
};
/** Minimal state manager surface consumed by renderer debug helpers. */
export type MasterStateManagerExtended = {
    /**
     * - Get current state
     */
    getState: () => unknown;
    /**
     * - Get state history
     */
    getHistory: () => unknown[];
};
/** Dependencies injected into renderer component initialization. */
export type RendererDependencies = {
    /**
     * - Open file button element
     */
    openFileBtn: HTMLElement | null;
    /**
     * - Reference to file opening state
     */
    isOpeningFileRef: {
        value: boolean;
    };
    /**
     * - Callback to show/hide loading state
     */
    setLoading: (loading: boolean) => void;
    /**
     * - Callback to display notifications
     */
    showNotification: (
        message: string,
        type?: string,
        timeout?: number
    ) => unknown;
    /**
     * - Callback to handle file opening
     */
    handleOpenFile: UnknownRendererFunction;
    /**
     * - Callback to show update notifications
     */
    showUpdateNotification: (
        message: string,
        type?: string,
        duration?: number,
        withAction?: boolean | string
    ) => void;
    /**
     * - Callback to display about modal
     */
    showAboutModal: (html?: string) => void;
    /**
     * - Callback to apply theme changes
     */
    applyTheme: (theme: string, withTransition?: boolean) => void;
    /**
     * - Callback to listen for theme changes
     */
    listenForThemeChange: (onThemeChange: (theme: string) => void) => void;
};

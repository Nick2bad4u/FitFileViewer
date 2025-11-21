export type WindowExtensions = {
    /**
     * - Development mode flag
     */
    __DEVELOPMENT__?: boolean;
    /**
     * - Export GPX button creator
     */
    createExportGPXButton?: Function;
    /**
     * - Application information
     */
    APP_INFO?: Object;
    /**
     * - Renderer debug utilities
     */
    __renderer_debug?: Object;
    /**
     * - Renderer development utilities
     */
    __renderer_dev?: Object;
    /**
     * - Sensor debug utilities
     */
    __sensorDebug?: Object;
    /**
     * - Chart formatting debug utilities
     */
    __debugChartFormatting?: Object;
};
export type ElectronAPIExtensions = {
    /**
     * - Development mode flag in electron API
     */
    __devMode?: boolean;
};
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
export type MasterStateManagerExtended = {
    /**
     * - Get current state
     */
    getState: Function;
    /**
     * - Get state history
     */
    getHistory: Function;
};
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
     * - Function to show/hide loading state
     */
    setLoading: Function;
    /**
     * - Function to display notifications
     */
    showNotification: Function;
    /**
     * - Function to handle file opening
     */
    handleOpenFile: Function;
    /**
     * - Function to show update notifications
     */
    showUpdateNotification: Function;
    /**
     * - Function to display about modal
     */
    showAboutModal: Function;
    /**
     * - Function to apply theme changes
     */
    applyTheme: Function;
    /**
     * - Function to listen for theme changes
     */
    listenForThemeChange: Function;
};
//# sourceMappingURL=renderer.d.ts.map

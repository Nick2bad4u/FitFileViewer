/**
 * Get master state manager instance
 * @returns {MasterStateManager} Master state manager
 */
export function getMasterStateManager(): MasterStateManager;
/**
 * Initialize the complete FitFileViewer state system
 * Call this once during application startup
 */
export function initializeFitFileViewerState(): Promise<void>;
/**
 * Master State Manager - orchestrates all state management components
 */
export class MasterStateManager {
    isInitialized: boolean;
    components: Map<any, any>;
    initializationOrder: string[];
    /**
     * Clean up all state management
     */
    cleanup(): void;
    /**
     * Get state history (forwards to core state manager)
     * @returns {Array<Object>} State history
     */
    getHistory(): Array<Object>;
    /**
     * Get initialization status
     * @returns {Object} Status object
     */
    getInitializationStatus(): Object;
    /**
     * Get current state (forwards to core state manager)
     * @param {string} [path] - Optional state path
     * @returns {*} State value
     */
    getState(path?: string): any;
    /**
     * Initialize core state management
     */ /**
     * Get active subscriptions for debugging
     * @returns {Object} Subscription information
     */
    getSubscriptions(): Object;
    /**
     * Initialize all state management components in proper order
     */
    initialize(): Promise<void>;
    /**
     * Initialize a specific component
     * @param {string} componentName - Name of component to initialize
     */
    initializeComponent(componentName: string): Promise<void>;
    /**
     * Initialize computed state system
     */
    initializeComputedState(): Promise<void>;
    initializeCoreState(): Promise<void>;
    /**
     * Initialize development tools
     */
    initializeDevTools(): Promise<void>;
    /**
     * Initialize FIT file components
     */
    initializeFitFileComponents(): Promise<void>;
    /**
     * Initialize integration components
     */
    initializeIntegrationComponents(): Promise<void>;
    /**
     * Initialize middleware system
     */
    initializeMiddleware(): Promise<void>;
    /**
     * Initialize renderer components
     */
    initializeRendererComponents(): Promise<void>;
    /**
     * Initialize settings state manager
     */
    initializeSettings(): Promise<void>;
    /**
     * Initialize tab-related components
     */
    initializeTabComponents(): Promise<void>;
    /**
     * Initialize UI components
     */
    initializeUIComponents(): Promise<void>;
    /**
     * Detects if the application is running in development mode
     * @returns {boolean} True if in development mode
     */
    isDevelopmentMode(): boolean;
    /**
     * Reinitialize a specific component
     * @param {string} componentName - Component to reinitialize
     */
    reinitializeComponent(componentName: string): Promise<void>;
    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop(): void;
    /**
     * Set up error handling
     */
    setupErrorHandling(): void;
    /**
     * Set up integrations between components
     */
    setupIntegrations(): void;
    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts(): void; /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring(): void;
    /**
     * Set up window event listeners
     */
    setupWindowEventListeners(): void;
}
export const masterStateManager: MasterStateManager;
export { UIActions } from "../domain/uiStateManager.js";
export type ComponentState = {
    /**
     * - Whether component is initialized
     */
    initialized: boolean;
    /**
     * - Initialization timestamp
     */
    timestamp?: number;
    /**
     * - Error message if initialization failed
     */
    error?: string;
};
export type ExtendedWindow = Window & {
    __state_debug?: {
        setState?: Function;
    };
    __DEVELOPMENT__?: boolean;
    electronAPI?: {
        __devMode?: boolean;
        openFileDialog?: Function;
        openFile?: Function;
    };
};
export { AppActions, AppSelectors } from "../../app/lifecycle/appActions.js";
//# sourceMappingURL=masterStateManager.d.ts.map

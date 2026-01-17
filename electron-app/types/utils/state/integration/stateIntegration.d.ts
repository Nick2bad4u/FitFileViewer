/**
 * Initialize the complete state management system
 * Call this once during application startup
 */
export function initializeAppState(): void;
export function initializeCompleteStateSystem(): void;
/**
 * Helper to integrate with existing renderer utilities
 */
export function integrateWithRendererUtils(): void;
/**
 * Helper to convert existing chartControlsState to new system
 */
export function migrateChartControlsState(): void;
/**
 * Set up performance monitoring for state changes
 */
export function setupStatePerformanceMonitoring(): void;
/**
 * Set up state persistence for important UI state
 */
export function setupStatePersistence(): void;
/**
 * @typedef {Object} DebugUtilities
 * @property {Function} getState - Get state by path
 * @property {Function} setState - Set state value
 * @property {Object} AppActions - Application action functions
 * @property {Object} uiStateManager - UI state manager
 * @property {Function} logState - Log current state
 * @property {Function} watchState - Watch state changes
 * @property {Function} triggerAction - Trigger state action
 */
/**
 * @typedef {Object} AppStateMigration
 * @property {Function[]} migrations - Array of migration functions
 */
/**
 * Migration helper to convert old state patterns to new system
 */
export class StateMigrationHelper {
    /** @type {Function[]} */
    migrations: Function[];
    /**
     * Add a migration function
     * @param {Function} migrationFn - Function to run migration
     */
    addMigration(migrationFn: Function): void;
    /**
     * Run all migrations
     */
    runMigrations(): Promise<void>;
}
export type DebugUtilities = {
    /**
     * - Get state by path
     */
    getState: Function;
    /**
     * - Set state value
     */
    setState: Function;
    /**
     * - Application action functions
     */
    AppActions: Object;
    /**
     * - UI state manager
     */
    uiStateManager: Object;
    /**
     * - Log current state
     */
    logState: Function;
    /**
     * - Watch state changes
     */
    watchState: Function;
    /**
     * - Trigger state action
     */
    triggerAction: Function;
};
export type AppStateMigration = {
    /**
     * - Array of migration functions
     */
    migrations: Function[];
};

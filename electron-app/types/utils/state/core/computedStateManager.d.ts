/**
 * Register a computed value (convenience function)
 * @param {string} key - Unique key for the computed value
 * @param {Function} computeFn - Function that computes the value
 * @param {Array<string>} deps - Array of state paths this computed value depends on
 * @returns {Function} Cleanup function
 */
export function addComputed(key: string, computeFn: Function, deps?: Array<string>): Function;
/**
 * Cleanup common computed values
 */
export function cleanupCommonComputedValues(): void;
/**
 * Create a reactive computed value that can be used with property descriptors
 * @param {string} key - Computed value key
 * @param {Function} computeFn - Compute function
 * @param {Array<string>} deps - Dependencies
 * @returns {Object} Property descriptor
 */
export function createReactiveComputed(key: string, computeFn: Function, deps?: Array<string>): Object;
/**
 * Predefined computed values for FitFileViewer
 */
/**
 * Get a computed value (convenience function)
 * @param {string} key - Key of computed value
 * @returns {*} Computed value
 */
export function getComputed(key: string): any;
/**
 * Initialize common computed values for the FitFileViewer application
 */
export function initializeCommonComputedValues(): void;
/**
 * Remove a computed value (convenience function)
 * @param {string} key - Key of computed value to remove
 */
export function removeComputed(key: string): void;
export const computedStateManager: ComputedStateManager;
/**
 * Computed State Manager Class
 */
declare class ComputedStateManager {
    computedValues: Map<any, any>;
    dependencies: Map<any, any>;
    subscriptions: Map<any, any>;
    isComputing: Set<any>;
    /**
     * Register a computed value
     * @param {string} key - Unique key for the computed value
     * @param {Function} computeFn - Function that computes the value
     * @param {Array<string>} deps - Array of state paths this computed value depends on
     * @returns {Function} Cleanup function
     */
    addComputed(key: string, computeFn: Function, deps?: Array<string>): Function;
    /**
     * Clean up all computed values
     */
    cleanup(): void;
    /**
     * Compute the value for a computed state
     * @param {string} key - Key of computed value
     */
    computeValue(key: string): void;
    /**
     * Get all computed values with their metadata
     * @returns {Object} All computed values and metadata
     */
    getAllComputed(): Object;
    /**
     * Get a computed value
     * @param {string} key - Key of computed value
     * @returns {*} Computed value
     */
    getComputed(key: string): any;
    /**
     * Get dependency graph
     * @returns {Object} Dependency relationships
     */
    getDependencyGraph(): Object;
    /**
     * Invalidate a computed value (mark it for recomputation)
     * @param {string} key - Key of computed value to invalidate
     */
    invalidateComputed(key: string): void;
    /**
     * Force recomputation of all computed values
     */
    recomputeAll(): void;
    /**
     * Remove a computed value
     * @param {string} key - Key of computed value to remove
     */
    removeComputed(key: string): void;
}
export {};
//# sourceMappingURL=computedStateManager.d.ts.map
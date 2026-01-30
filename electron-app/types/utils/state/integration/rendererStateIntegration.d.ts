/** @typedef {{ silent: boolean; source: string }} StateMeta */
/**
 * Example of how to use the state system in your existing functions
 */
export function exampleStateUsage(): void;
/**
 * Example of how to modify your existing renderer initialization
 */
export function initializeRendererWithNewStateSystem(): void;
/**
 * Migration helper for existing renderer.js Replace your existing
 * initialization with this pattern
 */
export function migrateExistingRenderer(): void;
export default initializeRendererWithNewStateSystem;
export type StateMeta = {
    silent: boolean;
    source: string;
};

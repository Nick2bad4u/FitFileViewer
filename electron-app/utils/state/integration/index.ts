/* eslint-disable no-barrel-files/no-barrel-files -- Stable state/integration entry point for existing runtime imports. */
/**
 * Re-exports all modules in the state/integration category.
 */

// Export in deterministic sorted order to satisfy lint rules.
export * from "./mainProcessStateClient.js";
export {
    MainProcessState,
    mainProcessState,
} from "./mainProcessStateManager.js";
export * from "./rendererStateIntegration.js";
export * from "./stateIntegration.js";
/* eslint-enable no-barrel-files/no-barrel-files */

/* eslint-disable no-barrel-files/no-barrel-files -- Stable state/integration entry point for existing runtime imports. */
/**
 * Re-exports all modules in the state/integration category.
 */
import "./mainProcessStateManager.js";
const mainProcessStateManagerExports =
    globalThis.__FFV_mainProcessStateManagerExports;
/**
 * Main-process state manager constructor exposed through the legacy CommonJS
 * bridge.
 */
export const MainProcessState =
    mainProcessStateManagerExports?.MainProcessState;
/**
 * Main-process state singleton exposed through the legacy CommonJS bridge.
 */
export const mainProcessState =
    mainProcessStateManagerExports?.mainProcessState;
// Export in deterministic sorted order to satisfy lint rules.
export * from "./mainProcessStateClient.js";
export * from "./rendererStateIntegration.js";
export * from "./stateIntegration.js";
/* eslint-enable no-barrel-files/no-barrel-files */

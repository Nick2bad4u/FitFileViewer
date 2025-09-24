/**
 * @fileoverview Barrel Export for state/integration
 * @description Re-exports all modules in the state/integration category
 */
// Re-export with compatibility wrapper so importing in renderer doesn't crash on CommonJS-only modules
import * as __mp from "./mainProcessStateManager.js";

export const MainProcessState =
	/** @type {any} */ (__mp)?.MainProcessState ??
	/** @type {any} */ (__mp)?.default?.MainProcessState ??
	/** @type {any} */ (globalThis)?.__FFV_mainProcessStateManagerExports?.MainProcessState;

export const mainProcessState =
	/** @type {any} */ (__mp)?.mainProcessState ??
	/** @type {any} */ (__mp)?.default?.mainProcessState ??
	/** @type {any} */ (globalThis)?.__FFV_mainProcessStateManagerExports?.mainProcessState;

// Export in deterministic sorted order to satisfy lint rules
export * from "./rendererStateIntegration.js";
export * from "./stateIntegration.js";

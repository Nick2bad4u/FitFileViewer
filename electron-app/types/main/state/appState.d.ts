/**
 * Clears all event handlers registered within the main process state (used by dev helpers/tests).
 */
export function cleanupEventHandlers(): void;
/**
 * Returns the current value for a state key from the main process state manager.
 *
 * @param {string} statePath - Dot-notation state path (e.g. "fitFile.lastResult").
 * @returns {any} Stored state value.
 */
export function getAppState(statePath: string): any;
import { mainProcessState } from "../../utils/state/integration/mainProcessStateManager";
/**
 * Lazily resolves the configuration store used for fit parser decoder settings. The factory mirrors
 * the previous implementation to keep test hooks unchanged.
 *
 * @returns {any} electron-conf instance or null when unavailable.
 */
export function resolveFitParserSettingsConf(): any;
/**
 * Persists a value into main process state.
 *
 * @param {string} statePath - Dot-notation path to update.
 * @param {any} value - Value to persist.
 * @param {Record<string, any>} [options={}] - Additional metadata forwarded to the state manager.
 */
export function setAppState(statePath: string, value: any, options?: Record<string, any>): void;
export { mainProcessState };
//# sourceMappingURL=appState.d.ts.map

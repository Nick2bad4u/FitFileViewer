import type { MainProcessStateData } from "../../utils/state/integration/mainProcessStateManager";

export type StateUpdateOptions = Record<string, unknown>;
export interface FitParserSettingsConf {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
}
export interface MainProcessStateLike {
    data?: MainProcessStateData;
    cleanupEventHandlers(): void;
    get(statePath: string): unknown;
    set(
        statePath: string,
        value: unknown,
        options?: StateUpdateOptions
    ): void;
}

export const mainProcessState: MainProcessStateLike;

/**
 * Clears all event handlers registered within the main process state (used by
 * dev helpers/tests).
 */
export function cleanupEventHandlers(): void;
/**
 * Returns the current value for a state key from the main process state
 * manager.
 *
 * @param {string} statePath - Dot-notation state path (e.g.
 *   "fitFile.lastResult").
 *
 * @returns {unknown} Stored state value.
 */
export function getAppState(statePath: string): unknown;
/**
 * Lazily resolves the configuration store used for fit parser decoder settings.
 * The factory mirrors the previous implementation to keep test hooks
 * unchanged.
 *
 * @returns {FitParserSettingsConf | null} Electron-conf instance or null when unavailable.
 */
export function resolveFitParserSettingsConf(): FitParserSettingsConf | null;
/**
 * Persists a value into main process state.
 *
 * @param {string} statePath - Dot-notation path to update.
 * @param {unknown} value - Value to persist.
 * @param {StateUpdateOptions} [options={}] - Additional metadata forwarded to
 *   the state manager. Default is `{}`
 */
export function setAppState(
    statePath: string,
    value: unknown,
    options?: StateUpdateOptions
): void;

/**
 * Executes the elaborate test-environment priming logic that historically lived
 * in main.js. The routine ensures mocked Electron modules expose
 * whenReady/getAllWindows calls before tests run.
 *
 * @param {InitializeApplication} initializeApplication - Callback used to
 *   bootstrap the app when a window already exists in tests.
 */
export function primeTestEnvironment(
    initializeApplication: InitializeApplication
): void;
import type { MainWindowLike } from "../window/bootstrapMainWindow";
export type InitializeApplication = () => Promise<MainWindowLike>;

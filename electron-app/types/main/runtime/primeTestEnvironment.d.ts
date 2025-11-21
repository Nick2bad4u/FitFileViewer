/**
 * Executes the elaborate test-environment priming logic that historically lived in main.js. The
 * routine ensures mocked Electron modules expose whenReady/getAllWindows calls before tests run.
 *
 * @param {() => Promise<any>} initializeApplication - Function used to bootstrap the app when a
 * window already exists in tests.
 */
export function primeTestEnvironment(initializeApplication: () => Promise<any>): void;
//# sourceMappingURL=primeTestEnvironment.d.ts.map

/**
 * FitFileViewer Electron main-process entry point. This module now focuses on
 * orchestrating the startup lifecycle while delegating the heavy lifting to the
 * modularised helpers that live under ./main/. The refactor preserves
 * test-oriented side effects (priming whenReady, IPC wiring, and Gyazo OAuth
 * support) yet keeps the file comfortably under the max-lines lint threshold.
 */
/**
 * @typedef {Record<string, unknown>} MainConstants
 *
 * @typedef {(key: string) => unknown} GetAppState
 *
 * @typedef {(key: string, value: unknown) => void} SetAppState
 *
 * @typedef {(
 *     level: string,
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} LogWithContext
 *
 * @typedef {() => Promise<unknown>} InitializeApplication
 *
 * @typedef {{
 *     appRef: () => unknown;
 *     browserWindowRef: () => unknown;
 *     exposeDevHelpers: () => void;
 *     getAppState: GetAppState;
 *     initializeApplication: InitializeApplication;
 *     logWithContext: LogWithContext;
 *     setupApplicationEventHandlers: () => void;
 *     setupIPCHandlers: (win: unknown) => void;
 *     setupMenuAndEventHandlers: () => void;
 * }} MainLifecycleDependencies
 */

const mainRequire = /** @type {(moduleId: string) => unknown} */ (require);

const { setupApplicationEventHandlers } =
    /** @type {{ setupApplicationEventHandlers: () => void }} */ (
        mainRequire("./main/app/setupApplicationEventHandlers")
    );
const { CONSTANTS } = /** @type {{ CONSTANTS: MainConstants }} */ (
    mainRequire("./main/constants")
);
const { exposeDevHelpers } = /** @type {{ exposeDevHelpers: () => void }} */ (
    mainRequire("./main/dev/exposeDevHelpers")
);
const { sendToRenderer } =
    /** @type {{ sendToRenderer: (...args: unknown[]) => void }} */ (
        mainRequire("./main/ipc/sendToRenderer")
    );
const { setupIPCHandlers } =
    /** @type {{ setupIPCHandlers: (win: unknown) => void }} */ (
        mainRequire("./main/ipc/setupIPCHandlers")
    );
const { logWithContext } = /** @type {{ logWithContext: LogWithContext }} */ (
    mainRequire("./main/logging/logWithContext")
);
const { setupMenuAndEventHandlers } =
    /** @type {{ setupMenuAndEventHandlers: () => void }} */ (
        mainRequire("./main/menu/setupMenuAndEventHandlers")
    );
const { startGyazoOAuthServer, stopGyazoOAuthServer } = /**
 * @type {{
 *     startGyazoOAuthServer: (...args: unknown[]) => unknown;
 *     stopGyazoOAuthServer: (...args: unknown[]) => unknown;
 * }}
 */ (mainRequire("./main/oauth/gyazoOAuthServer"));
const { appRef, browserWindowRef } = /**
 * @type {{
 *     appRef: () => unknown;
 *     browserWindowRef: () => unknown;
 * }}
 */ (mainRequire("./main/runtime/electronAccess"));
const { ensureFitParserStateIntegration } = /** @type {{
    ensureFitParserStateIntegration: (...args: unknown[]) => unknown;
}} */ (mainRequire("./main/runtime/fitParserIntegration"));
const { initializeApplication } =
    /** @type {{ initializeApplication: InitializeApplication }} */ (
        mainRequire("./main/runtime/initializeApplication")
    );
const { primeTestEnvironment } = /**
 * @type {{
 *     primeTestEnvironment: (
 *         initializeApplication: InitializeApplication
 *     ) => void;
 * }}
 */ (mainRequire("./main/runtime/primeTestEnvironment"));
const { setupMainLifecycle } = /**
 * @type {{
 *     setupMainLifecycle: (deps: MainLifecycleDependencies) => void;
 * }}
 */ (mainRequire("./main/runtime/setupMainLifecycle"));
const { getAppState, setAppState } = /**
 * @type {{
 *     getAppState: GetAppState;
 *     setAppState: SetAppState;
 * }}
 */ (mainRequire("./main/state/appState"));
const { getThemeFromRenderer } = /** @type {{
    getThemeFromRenderer: (...args: unknown[]) => Promise<string>;
}} */ (mainRequire("./main/theme/getThemeFromRenderer"));
const { resolveAutoUpdaterAsync, resolveAutoUpdaterSync } = /**
 * @type {{
 *     resolveAutoUpdaterAsync: () => Promise<unknown>;
 *     resolveAutoUpdaterSync: () => unknown;
 * }}
 */ (mainRequire("./main/updater/autoUpdaterAccess"));
const { setupAutoUpdater } =
    /** @type {{ setupAutoUpdater: (...args: unknown[]) => unknown }} */ (
        mainRequire("./main/updater/setupAutoUpdater")
    );
const { isWindowUsable, validateWindow } = /**
 * @type {{
 *     isWindowUsable: (...args: unknown[]) => boolean;
 *     validateWindow: (...args: unknown[]) => boolean;
 * }}
 */ (mainRequire("./main/window/windowValidation"));

primeTestEnvironment(() => initializeApplication());

setupMainLifecycle({
    appRef,
    browserWindowRef,
    exposeDevHelpers,
    getAppState,
    initializeApplication,
    logWithContext,
    setupApplicationEventHandlers,
    setupIPCHandlers,
    setupMenuAndEventHandlers,
});

const exported = {
    CONSTANTS,
    ensureFitParserStateIntegration,
    exposeDevHelpers,
    getAppState,
    getThemeFromRenderer,
    initializeApplication,
    isWindowUsable,
    logWithContext,
    resolveAutoUpdaterAsync,
    resolveAutoUpdaterSync,
    sendToRenderer,
    setAppState,
    setupApplicationEventHandlers,
    setupAutoUpdater,
    setupIPCHandlers,
    setupMainLifecycle,
    setupMenuAndEventHandlers,
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
    validateWindow,
};

module.exports = exported;
module.exports.default = exported;

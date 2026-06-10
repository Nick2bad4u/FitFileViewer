/**
 * FitFileViewer Electron main-process entry point. This module now focuses on
 * orchestrating the startup lifecycle while delegating the heavy lifting to the
 * modularised helpers that live under ./main/. The refactor preserves
 * test-oriented side effects (priming whenReady, IPC wiring, and Gyazo OAuth
 * support) yet keeps the file comfortably under the max-lines lint threshold.
 */
{
    type MainConstants = Record<string, unknown>;

    type GetAppState = (key: string) => unknown;

    type SetAppState = (key: string, value: unknown) => void;

    type LogWithContext = (
        level: string,
        message: string,
        context?: Record<string, unknown>
    ) => void;

    type InitializeApplication = () => Promise<unknown>;

    interface MainLifecycleDependencies {
        appRef: () => unknown;
        browserWindowRef: () => unknown;
        exposeDevHelpers: () => unknown;
        getAppState: GetAppState;
        initializeApplication: InitializeApplication;
        logWithContext: LogWithContext;
        setupApplicationEventHandlers: () => void;
        setupIPCHandlers: (win: unknown) => void;
        setupMenuAndEventHandlers: () => void;
    }

    const mainRequire = require as (moduleId: string) => unknown;

    const { setupApplicationEventHandlers } = mainRequire(
        "./main/app/setupApplicationEventHandlers"
    ) as { setupApplicationEventHandlers: () => void };
    const { CONSTANTS } = mainRequire("./main/constants") as {
        CONSTANTS: MainConstants;
    };
    const { exposeDevHelpers } = mainRequire("./main/dev/exposeDevHelpers") as {
        exposeDevHelpers: () => unknown;
    };
    const { sendToRenderer } = mainRequire("./main/ipc/sendToRenderer") as {
        sendToRenderer: (...args: unknown[]) => void;
    };
    const { setupIPCHandlers } = mainRequire("./main/ipc/setupIPCHandlers") as {
        setupIPCHandlers: (win: unknown) => void;
    };
    const { logWithContext } = mainRequire("./main/logging/logWithContext") as {
        logWithContext: LogWithContext;
    };
    const { setupMenuAndEventHandlers } = mainRequire(
        "./main/menu/setupMenuAndEventHandlers"
    ) as { setupMenuAndEventHandlers: () => void };
    const { startGyazoOAuthServer, stopGyazoOAuthServer } = mainRequire(
        "./main/oauth/gyazoOAuthServer"
    ) as {
        startGyazoOAuthServer: (...args: unknown[]) => unknown;
        stopGyazoOAuthServer: (...args: unknown[]) => unknown;
    };
    const { appRef, browserWindowRef } = mainRequire(
        "./main/runtime/electronAccess"
    ) as {
        appRef: () => unknown;
        browserWindowRef: () => unknown;
    };
    const { ensureFitParserStateIntegration } = mainRequire(
        "./main/runtime/fitParserIntegration"
    ) as {
        ensureFitParserStateIntegration: (...args: unknown[]) => unknown;
    };
    const { initializeApplication } = mainRequire(
        "./main/runtime/initializeApplication"
    ) as { initializeApplication: InitializeApplication };
    const { primeTestEnvironment } = mainRequire(
        "./main/runtime/primeTestEnvironment"
    ) as {
        primeTestEnvironment: (
            initializeApplication: InitializeApplication
        ) => void;
    };
    const { setupMainLifecycle } = mainRequire(
        "./main/runtime/setupMainLifecycle"
    ) as { setupMainLifecycle: (deps: MainLifecycleDependencies) => void };
    const { getAppState, setAppState } = mainRequire(
        "./main/state/appState"
    ) as {
        getAppState: GetAppState;
        setAppState: SetAppState;
    };
    const { getThemeFromRenderer } = mainRequire(
        "./main/theme/getThemeFromRenderer"
    ) as { getThemeFromRenderer: (...args: unknown[]) => Promise<string> };
    const { resolveAutoUpdaterAsync, resolveAutoUpdaterSync } = mainRequire(
        "./main/updater/autoUpdaterAccess"
    ) as {
        resolveAutoUpdaterAsync: () => Promise<unknown>;
        resolveAutoUpdaterSync: () => unknown;
    };
    const { setupAutoUpdater } = mainRequire(
        "./main/updater/setupAutoUpdater"
    ) as { setupAutoUpdater: (...args: unknown[]) => unknown };
    const { isWindowUsable, validateWindow } = mainRequire(
        "./main/window/windowValidation"
    ) as {
        isWindowUsable: (...args: unknown[]) => boolean;
        validateWindow: (...args: unknown[]) => boolean;
    };

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

    module.exports = Object.assign(exported, { default: exported });
}

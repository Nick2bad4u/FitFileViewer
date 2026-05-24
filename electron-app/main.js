"use strict";
/**
 * FitFileViewer Electron main-process entry point. This module now focuses on
 * orchestrating the startup lifecycle while delegating the heavy lifting to the
 * modularised helpers that live under ./main/. The refactor preserves
 * test-oriented side effects (priming whenReady, IPC wiring, and Gyazo OAuth
 * support) yet keeps the file comfortably under the max-lines lint threshold.
 */
{
    const mainRequire = require;
    const { setupApplicationEventHandlers } = mainRequire(
        "./main/app/setupApplicationEventHandlers"
    );
    const { CONSTANTS } = mainRequire("./main/constants");
    const { exposeDevHelpers } = mainRequire("./main/dev/exposeDevHelpers");
    const { sendToRenderer } = mainRequire("./main/ipc/sendToRenderer");
    const { setupIPCHandlers } = mainRequire("./main/ipc/setupIPCHandlers");
    const { logWithContext } = mainRequire("./main/logging/logWithContext");
    const { setupMenuAndEventHandlers } = mainRequire(
        "./main/menu/setupMenuAndEventHandlers"
    );
    const { startGyazoOAuthServer, stopGyazoOAuthServer } = mainRequire(
        "./main/oauth/gyazoOAuthServer"
    );
    const { appRef, browserWindowRef } = mainRequire(
        "./main/runtime/electronAccess"
    );
    const { ensureFitParserStateIntegration } = mainRequire(
        "./main/runtime/fitParserIntegration"
    );
    const { initializeApplication } = mainRequire(
        "./main/runtime/initializeApplication"
    );
    const { primeTestEnvironment } = mainRequire(
        "./main/runtime/primeTestEnvironment"
    );
    const { setupMainLifecycle } = mainRequire(
        "./main/runtime/setupMainLifecycle"
    );
    const { getAppState, setAppState } = mainRequire("./main/state/appState");
    const { getThemeFromRenderer } = mainRequire(
        "./main/theme/getThemeFromRenderer"
    );
    const { resolveAutoUpdaterAsync, resolveAutoUpdaterSync } = mainRequire(
        "./main/updater/autoUpdaterAccess"
    );
    const { setupAutoUpdater } = mainRequire("./main/updater/setupAutoUpdater");
    const { isWindowUsable, validateWindow } = mainRequire(
        "./main/window/windowValidation"
    );
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

/**
 * FitFileViewer Electron main-process entry point. This module now focuses on orchestrating the
 * startup lifecycle while delegating the heavy lifting to the modularised helpers that live under
 * ./main/. The refactor preserves test-oriented side effects (priming whenReady, IPC wiring, and
 * Gyazo OAuth support) yet keeps the file comfortably under the max-lines lint threshold.
 */

const { setupApplicationEventHandlers } = require("./main/app/setupApplicationEventHandlers");
const { CONSTANTS } = require("./main/constants");
const { exposeDevHelpers } = require("./main/dev/exposeDevHelpers");
const { sendToRenderer } = require("./main/ipc/sendToRenderer");
const { setupIPCHandlers } = require("./main/ipc/setupIPCHandlers");
const { logWithContext } = require("./main/logging/logWithContext");
const { setupMenuAndEventHandlers } = require("./main/menu/setupMenuAndEventHandlers");
const { startGyazoOAuthServer, stopGyazoOAuthServer } = require("./main/oauth/gyazoOAuthServer");
const { appRef, browserWindowRef } = require("./main/runtime/electronAccess");
const { ensureFitParserStateIntegration } = require("./main/runtime/fitParserIntegration");
const { initializeApplication } = require("./main/runtime/initializeApplication");
const { primeTestEnvironment } = require("./main/runtime/primeTestEnvironment");
const { setupMainLifecycle } = require("./main/runtime/setupMainLifecycle");
const { getAppState, setAppState } = require("./main/state/appState");
const { getThemeFromRenderer } = require("./main/theme/getThemeFromRenderer");
const { resolveAutoUpdaterAsync, resolveAutoUpdaterSync } = require("./main/updater/autoUpdaterAccess");
const { setupAutoUpdater } = require("./main/updater/setupAutoUpdater");
const { isWindowUsable, validateWindow } = require("./main/window/windowValidation");

primeTestEnvironment(() => initializeApplication());

setupMainLifecycle({
    appRef,
    browserWindowRef,
    getAppState,
    initializeApplication,
    setupApplicationEventHandlers,
    setupIPCHandlers,
    setupMenuAndEventHandlers,
    exposeDevHelpers,
    logWithContext,
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

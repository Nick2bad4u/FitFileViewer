/**
 * FitFileViewer Electron main-process entry point. This module focuses on
 * orchestrating the startup lifecycle while delegating the heavy lifting to the
 * modularised helpers that live under ./main/.
 */
import { setupApplicationEventHandlers } from "./main/app/setupApplicationEventHandlers.js";
import { exposeDevHelpers } from "./main/dev/exposeDevHelpers.js";
import { setupIPCHandlers } from "./main/ipc/setupIPCHandlers.js";
import { logWithContext } from "./main/logging/logWithContext.js";
import { setupMenuAndEventHandlers } from "./main/menu/setupMenuAndEventHandlers.js";
import { appRef, browserWindowRef } from "./main/runtime/electronAccess.js";
import { initializeApplication } from "./main/runtime/initializeApplication.js";
import { primeTestEnvironment } from "./main/runtime/primeTestEnvironment.js";
import { setupMainLifecycle } from "./main/runtime/setupMainLifecycle.js";
import { getMainWindow } from "./main/state/appState.js";

export { setupApplicationEventHandlers } from "./main/app/setupApplicationEventHandlers.js";
export { CONSTANTS } from "./main/constants.js";
export { exposeDevHelpers } from "./main/dev/exposeDevHelpers.js";
export { sendToRenderer } from "./main/ipc/sendToRenderer.js";
export { setupIPCHandlers } from "./main/ipc/setupIPCHandlers.js";
export { logWithContext } from "./main/logging/logWithContext.js";
export { setupMenuAndEventHandlers } from "./main/menu/setupMenuAndEventHandlers.js";
export {
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
} from "./main/oauth/gyazoOAuthServer.js";
export { ensureFitParserStateIntegration } from "./main/runtime/fitParserIntegration.js";
export { initializeApplication } from "./main/runtime/initializeApplication.js";
export { setupMainLifecycle } from "./main/runtime/setupMainLifecycle.js";
export {
    getAppState,
    getAutoUpdaterStatus,
    getLoadedFitFilePath,
    getMainWindow,
    isAutoUpdaterInitialized,
    isAutoUpdaterUpdateDownloaded,
    setAppState,
    setAutoUpdaterInitialized,
    setAutoUpdaterState,
    setLoadedFitFilePath,
    setMainWindow,
} from "./main/state/appState.js";
export { getPersistedThemePreference } from "./main/theme/getPersistedThemePreference.js";
export { resolveAutoUpdaterAsync } from "./main/updater/autoUpdaterAccess.js";
export { setupAutoUpdater } from "./main/updater/setupAutoUpdater.js";
export {
    isWindowUsable,
    validateWindow,
} from "./main/window/windowValidation.js";

type LifecycleDependencies = Parameters<typeof setupMainLifecycle>[0];
type PrimeInitializeApplication = Parameters<typeof primeTestEnvironment>[0];

const initializeApplicationForLifecycle: LifecycleDependencies["initializeApplication"] =
    () =>
        initializeApplication() as ReturnType<
            LifecycleDependencies["initializeApplication"]
        >;

const initializeApplicationForPrime: PrimeInitializeApplication = () =>
    initializeApplication() as ReturnType<PrimeInitializeApplication>;

const setupIPCHandlersForLifecycle: LifecycleDependencies["setupIPCHandlers"] =
    (win) => {
        setupIPCHandlers(win as Parameters<typeof setupIPCHandlers>[0]);
    };

primeTestEnvironment(initializeApplicationForPrime);

setupMainLifecycle({
    appRef,
    browserWindowRef,
    exposeDevHelpers,
    getMainWindow,
    initializeApplication: initializeApplicationForLifecycle,
    logWithContext,
    setupApplicationEventHandlers,
    setupIPCHandlers: setupIPCHandlersForLifecycle,
    setupMenuAndEventHandlers,
});

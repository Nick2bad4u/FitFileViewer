import { createRequire } from "node:module";

const requireFromTest = createRequire(import.meta.url);

const preloadIpcBridgeCatalog = requireFromTest(
    "../../preload/ipcBridgeCatalog.js"
);
const preloadApiDiagnostics = requireFromTest(
    "../../preload/apiDiagnostics.js"
);
const preloadBeforeExitHandler = requireFromTest(
    "../../preload/beforeExitHandler.js"
);
const preloadClipboardBridge = requireFromTest(
    "../../preload/clipboardBridge.js"
);
const preloadElectronBridge = requireFromTest("../../preload/electronBridge.js");
const preloadEnvironment = requireFromTest("../../preload/environment.js");
const preloadGenericIpcApi = requireFromTest("../../preload/genericIpcApi.js");
const preloadIpcHelpers = requireFromTest("../../preload/ipcHelpers.js");
const preloadLogger = requireFromTest("../../preload/logger.js");
const preloadMainStateBridge = requireFromTest(
    "../../preload/mainStateBridge.js"
);
const preloadValidators = requireFromTest("../../preload/validators.js");

export function resolvePreloadScriptRequire(
    moduleName: string,
    electronModule: unknown
): unknown {
    if (moduleName === "electron") {
        return electronModule;
    }

    if (moduleName === "./preload/ipcBridgeCatalog.js") {
        return preloadIpcBridgeCatalog;
    }

    if (moduleName === "./preload/apiDiagnostics.js") {
        return preloadApiDiagnostics;
    }

    if (moduleName === "./preload/beforeExitHandler.js") {
        return preloadBeforeExitHandler;
    }

    if (moduleName === "./preload/clipboardBridge.js") {
        return preloadClipboardBridge;
    }

    if (moduleName === "./preload/electronBridge.js") {
        return preloadElectronBridge;
    }

    if (moduleName === "./preload/environment.js") {
        return preloadEnvironment;
    }

    if (moduleName === "./preload/genericIpcApi.js") {
        return preloadGenericIpcApi;
    }

    if (moduleName === "./preload/ipcHelpers.js") {
        return preloadIpcHelpers;
    }

    if (moduleName === "./preload/logger.js") {
        return preloadLogger;
    }

    if (moduleName === "./preload/mainStateBridge.js") {
        return preloadMainStateBridge;
    }

    if (moduleName === "./preload/validators.js") {
        return preloadValidators;
    }

    throw new Error(`Module not mocked: ${moduleName}`);
}

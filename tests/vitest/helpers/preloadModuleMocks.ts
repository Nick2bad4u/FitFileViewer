import { createRequire } from "node:module";

const requireFromTest = createRequire(import.meta.url);

const preloadIpcBridgeCatalog = requireFromTest(
    "../../../electron-app/preload/ipcBridgeCatalog.js"
);
const preloadApiDiagnostics = requireFromTest(
    "../../../electron-app/preload/apiDiagnostics.js"
);
const preloadBeforeExitHandler = requireFromTest(
    "../../../electron-app/preload/beforeExitHandler.js"
);
const preloadClipboardBridge = requireFromTest(
    "../../../electron-app/preload/clipboardBridge.js"
);
const preloadDevtoolsMenuApi = requireFromTest(
    "../../../electron-app/preload/devtoolsMenuApi.js"
);
const preloadElectronBridge = requireFromTest(
    "../../../electron-app/preload/electronBridge.js"
);
const preloadEnvironment = requireFromTest(
    "../../../electron-app/preload/environment.js"
);
const preloadGenericIpcApi = requireFromTest(
    "../../../electron-app/preload/genericIpcApi.js"
);
const preloadIpcHelpers = requireFromTest(
    "../../../electron-app/preload/ipcHelpers.js"
);
const preloadLogger = requireFromTest(
    "../../../electron-app/preload/logger.js"
);
const preloadMainStateApi = requireFromTest(
    "../../../electron-app/preload/mainStateApi.js"
);
const preloadMainStateBridge = requireFromTest(
    "../../../electron-app/preload/mainStateBridge.js"
);
const preloadValidators = requireFromTest(
    "../../../electron-app/preload/validators.js"
);

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

    if (moduleName === "./preload/devtoolsMenuApi.js") {
        return preloadDevtoolsMenuApi;
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

    if (moduleName === "./preload/mainStateApi.js") {
        return preloadMainStateApi;
    }

    if (moduleName === "./preload/mainStateBridge.js") {
        return preloadMainStateBridge;
    }

    if (moduleName === "./preload/validators.js") {
        return preloadValidators;
    }

    throw new Error(`Module not mocked: ${moduleName}`);
}

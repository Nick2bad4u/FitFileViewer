import { createPreloadSourceRequire } from "./preloadSourceRequire";

const requireFromTest = createPreloadSourceRequire(import.meta.url);

const preloadApiAssembly = requireFromTest(
    "../../../electron-app/preload/apiAssembly.js"
);
const preloadApiAssemblyContext = requireFromTest(
    "../../../electron-app/preload/apiAssemblyContext.js"
);
const preloadClipboardApiDomain = requireFromTest(
    "../../../electron-app/preload/clipboardApiDomain.js"
);
const preloadDeveloperApiDomain = requireFromTest(
    "../../../electron-app/preload/developerApiDomain.js"
);
const preloadDiagnosticsApiDomain = requireFromTest(
    "../../../electron-app/preload/diagnosticsApiDomain.js"
);
const preloadExternalApiDomain = requireFromTest(
    "../../../electron-app/preload/externalApiDomain.js"
);
const preloadFileApiDomain = requireFromTest(
    "../../../electron-app/preload/fileApiDomain.js"
);
const preloadIpcEventApiDomain = requireFromTest(
    "../../../electron-app/preload/ipcEventApiDomain.js"
);
const preloadStateApiDomain = requireFromTest(
    "../../../electron-app/preload/stateApiDomain.js"
);
const preloadSystemApiDomain = requireFromTest(
    "../../../electron-app/preload/systemApiDomain.js"
);
const preloadRuntime = requireFromTest(
    "../../../electron-app/preload/preloadRuntime.js"
);
const preloadRuntimeEnvironment = requireFromTest(
    "../../../electron-app/preload/preloadRuntimeEnvironment.js"
);
const preloadBootstrap = requireFromTest(
    "../../../electron-app/preload/preloadBootstrap.js"
);
const preloadModuleLoader = requireFromTest(
    "../../../electron-app/preload/preloadModuleLoader.js"
);
const preloadAppModuleLoader = requireFromTest(
    "../../../electron-app/preload/preloadAppModuleLoader.js"
);
const preloadFileModuleLoader = requireFromTest(
    "../../../electron-app/preload/preloadFileModuleLoader.js"
);
const preloadIpcModuleLoader = requireFromTest(
    "../../../electron-app/preload/preloadIpcModuleLoader.js"
);
const preloadIpcBridgeCatalog = requireFromTest(
    "../../../electron-app/preload/ipcBridgeCatalog.js"
);
const preloadApiDiagnostics = requireFromTest(
    "../../../electron-app/preload/apiDiagnostics.js"
);
const preloadAppInfoApi = requireFromTest(
    "../../../electron-app/preload/appInfoApi.js"
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
const preloadDevelopmentToolsGlobal = requireFromTest(
    "../../../electron-app/preload/developmentToolsGlobal.js"
);
const preloadElectronApiExposure = requireFromTest(
    "../../../electron-app/preload/electronApiExposure.js"
);
const preloadElectronApiFactory = requireFromTest(
    "../../../electron-app/preload/electronApiFactory.js"
);
const preloadElectronBridge = requireFromTest(
    "../../../electron-app/preload/electronBridge.js"
);
const preloadEnvironment = requireFromTest(
    "../../../electron-app/preload/environment.js"
);
const preloadGyazoExternalApi = requireFromTest(
    "../../../electron-app/preload/gyazoExternalApi.js"
);
const preloadEventApi = requireFromTest(
    "../../../electron-app/preload/preloadEventApi.js"
);
const preloadFileApi = requireFromTest(
    "../../../electron-app/preload/fileApi.js"
);
const preloadFitBrowserApi = requireFromTest(
    "../../../electron-app/preload/fitBrowserApi.js"
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
const preloadMenuEventApi = requireFromTest(
    "../../../electron-app/preload/menuEventApi.js"
);
const preloadThemeApi = requireFromTest(
    "../../../electron-app/preload/themeApi.js"
);
const preloadValidators = requireFromTest(
    "../../../electron-app/preload/validators.js"
);
const preloadStateModuleLoader = requireFromTest(
    "../../../electron-app/preload/preloadStateModuleLoader.js"
);
const preloadShellExternalApi = requireFromTest(
    "../../../electron-app/preload/shellExternalApi.js"
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

    if (moduleName === "./preload/apiAssembly.js") {
        return preloadApiAssembly;
    }

    if (moduleName === "./preload/apiAssemblyContext.js") {
        return preloadApiAssemblyContext;
    }

    if (moduleName === "./preload/clipboardApiDomain.js") {
        return preloadClipboardApiDomain;
    }

    if (moduleName === "./preload/developerApiDomain.js") {
        return preloadDeveloperApiDomain;
    }

    if (moduleName === "./preload/diagnosticsApiDomain.js") {
        return preloadDiagnosticsApiDomain;
    }

    if (moduleName === "./preload/externalApiDomain.js") {
        return preloadExternalApiDomain;
    }

    if (moduleName === "./preload/fileApiDomain.js") {
        return preloadFileApiDomain;
    }

    if (moduleName === "./preload/ipcEventApiDomain.js") {
        return preloadIpcEventApiDomain;
    }

    if (moduleName === "./preload/stateApiDomain.js") {
        return preloadStateApiDomain;
    }

    if (moduleName === "./preload/systemApiDomain.js") {
        return preloadSystemApiDomain;
    }

    if (moduleName === "./preload/preloadRuntime.js") {
        return preloadRuntime;
    }

    if (moduleName === "./preload/preloadRuntimeEnvironment.js") {
        return preloadRuntimeEnvironment;
    }

    if (moduleName === "./preload/preloadBootstrap.js") {
        return preloadBootstrap;
    }

    if (moduleName === "./preload/preloadModuleLoader.js") {
        return preloadModuleLoader;
    }

    if (moduleName === "./preload/preloadAppModuleLoader.js") {
        return preloadAppModuleLoader;
    }

    if (moduleName === "./preload/preloadFileModuleLoader.js") {
        return preloadFileModuleLoader;
    }

    if (moduleName === "./preload/preloadIpcModuleLoader.js") {
        return preloadIpcModuleLoader;
    }

    if (moduleName === "./preload/preloadStateModuleLoader.js") {
        return preloadStateModuleLoader;
    }

    if (moduleName === "./preload/apiDiagnostics.js") {
        return preloadApiDiagnostics;
    }

    if (moduleName === "./preload/appInfoApi.js") {
        return preloadAppInfoApi;
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

    if (moduleName === "./preload/developmentToolsGlobal.js") {
        return preloadDevelopmentToolsGlobal;
    }

    if (moduleName === "./preload/electronApiExposure.js") {
        return preloadElectronApiExposure;
    }

    if (moduleName === "./preload/electronApiFactory.js") {
        return preloadElectronApiFactory;
    }

    if (moduleName === "./preload/electronBridge.js") {
        return preloadElectronBridge;
    }

    if (moduleName === "./preload/environment.js") {
        return preloadEnvironment;
    }

    if (moduleName === "./preload/gyazoExternalApi.js") {
        return preloadGyazoExternalApi;
    }

    if (moduleName === "./preload/preloadEventApi.js") {
        return preloadEventApi;
    }

    if (moduleName === "./preload/fileApi.js") {
        return preloadFileApi;
    }

    if (moduleName === "./preload/fitBrowserApi.js") {
        return preloadFitBrowserApi;
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

    if (moduleName === "./preload/menuEventApi.js") {
        return preloadMenuEventApi;
    }

    if (moduleName === "./preload/themeApi.js") {
        return preloadThemeApi;
    }

    if (moduleName === "./preload/validators.js") {
        return preloadValidators;
    }

    if (moduleName === "./preload/shellExternalApi.js") {
        return preloadShellExternalApi;
    }

    throw new Error(`Module not mocked: ${moduleName}`);
}

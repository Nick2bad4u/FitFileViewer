import * as preloadApiAssembly from "../../../electron-app/preload/apiAssembly.js";
import * as preloadApiAssemblyContext from "../../../electron-app/preload/apiAssemblyContext.js";
import * as preloadApiAssemblyModuleLoader from "../../../electron-app/preload/preloadApiAssemblyModuleLoader.js";
import * as preloadApiDiagnostics from "../../../electron-app/preload/apiDiagnostics.js";
import * as preloadAppInfoApi from "../../../electron-app/preload/appInfoApi.js";
import * as preloadAppModuleLoader from "../../../electron-app/preload/preloadAppModuleLoader.js";
import * as preloadBeforeExitHandler from "../../../electron-app/preload/beforeExitHandler.js";
import * as preloadBootstrap from "../../../electron-app/preload/preloadBootstrap.js";
import * as preloadClipboardApiDomain from "../../../electron-app/preload/clipboardApiDomain.js";
import * as preloadClipboardBridge from "../../../electron-app/preload/clipboardBridge.js";
import * as preloadDeveloperApiDomain from "../../../electron-app/preload/developerApiDomain.js";
import * as preloadDevtoolsMenuApi from "../../../electron-app/preload/devtoolsMenuApi.js";
import * as preloadDevelopmentToolsGlobal from "../../../electron-app/preload/developmentToolsGlobal.js";
import * as preloadDiagnosticsApiDomain from "../../../electron-app/preload/diagnosticsApiDomain.js";
import * as preloadElectronApiExposure from "../../../electron-app/preload/electronApiExposure.js";
import * as preloadElectronApiFactory from "../../../electron-app/preload/electronApiFactory.js";
import * as preloadElectronBridge from "../../../electron-app/preload/electronBridge.js";
import * as preloadEnvironment from "../../../electron-app/preload/environment.js";
import * as preloadEventApi from "../../../electron-app/preload/preloadEventApi.js";
import * as preloadExternalApiDomain from "../../../electron-app/preload/externalApiDomain.js";
import * as preloadFileApi from "../../../electron-app/preload/fileApi.js";
import * as preloadFileApiDomain from "../../../electron-app/preload/fileApiDomain.js";
import * as preloadFileModuleLoader from "../../../electron-app/preload/preloadFileModuleLoader.js";
import * as preloadFitBrowserApi from "../../../electron-app/preload/fitBrowserApi.js";
import * as preloadGyazoExternalApi from "../../../electron-app/preload/gyazoExternalApi.js";
import * as preloadIpcBridgeCatalog from "../../../electron-app/preload/ipcBridgeCatalog.js";
import * as preloadIpcEventApiDomain from "../../../electron-app/preload/ipcEventApiDomain.js";
import * as preloadIpcHelpers from "../../../electron-app/preload/ipcHelpers.js";
import * as preloadIpcModuleLoader from "../../../electron-app/preload/preloadIpcModuleLoader.js";
import * as preloadLogger from "../../../electron-app/preload/logger.js";
import * as preloadMainStateApi from "../../../electron-app/preload/mainStateApi.js";
import * as preloadMainStateBridge from "../../../electron-app/preload/mainStateBridge.js";
import * as preloadMenuEventApi from "../../../electron-app/preload/menuEventApi.js";
import * as preloadModuleLoader from "../../../electron-app/preload/preloadModuleLoader.js";
import * as preloadPolicyModuleLoader from "../../../electron-app/preload/preloadPolicyModuleLoader.js";
import * as preloadRuntime from "../../../electron-app/preload/preloadRuntime.js";
import * as preloadRuntimeEnvironment from "../../../electron-app/preload/preloadRuntimeEnvironment.js";
import * as preloadShellExternalApi from "../../../electron-app/preload/shellExternalApi.js";
import * as preloadStateApiDomain from "../../../electron-app/preload/stateApiDomain.js";
import * as preloadStateModuleLoader from "../../../electron-app/preload/preloadStateModuleLoader.js";
import * as preloadSystemApiDomain from "../../../electron-app/preload/systemApiDomain.js";
import * as preloadThemeApi from "../../../electron-app/preload/themeApi.js";
import * as preloadValidators from "../../../electron-app/preload/validators.js";

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

    if (moduleName === "./preload/preloadApiAssemblyModuleLoader.js") {
        return preloadApiAssemblyModuleLoader;
    }

    if (moduleName === "./preload/preloadAppModuleLoader.js") {
        return preloadAppModuleLoader;
    }

    if (moduleName === "./preload/preloadPolicyModuleLoader.js") {
        return preloadPolicyModuleLoader;
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

{
    type PreloadModuleRegistry =
        import("./preloadModuleTypes").PreloadModuleRegistry;
    function loadPreloadModules(): PreloadModuleRegistry {
        const { createApiDiagnostics } = require("./apiDiagnostics.js") as {
            createApiDiagnostics: PreloadModuleRegistry["createApiDiagnostics"];
        };
        const { createAppInfoApi } = require("./appInfoApi.js") as {
            createAppInfoApi: PreloadModuleRegistry["createAppInfoApi"];
        };
        const { registerPreloadBeforeExitHandler } =
            require("./beforeExitHandler.js") as {
                registerPreloadBeforeExitHandler: PreloadModuleRegistry["registerPreloadBeforeExitHandler"];
            };
        const { createClipboardBridge } = require("./clipboardBridge.js") as {
            createClipboardBridge: PreloadModuleRegistry["createClipboardBridge"];
        };
        const { createDevtoolsMenuApi } = require("./devtoolsMenuApi.js") as {
            createDevtoolsMenuApi: PreloadModuleRegistry["createDevtoolsMenuApi"];
        };
        const { exposeDevelopmentToolsGlobal } =
            require("./developmentToolsGlobal.js") as {
                exposeDevelopmentToolsGlobal: PreloadModuleRegistry["exposeDevelopmentToolsGlobal"];
            };
        const { createFitBrowserApi } = require("./fitBrowserApi.js") as {
            createFitBrowserApi: PreloadModuleRegistry["createFitBrowserApi"];
        };
        const { createFileApi } = require("./fileApi.js") as {
            createFileApi: PreloadModuleRegistry["createFileApi"];
        };
        const { createExternalApi } = require("./externalApi.js") as {
            createExternalApi: PreloadModuleRegistry["createExternalApi"];
        };
        const { createMenuEventApi } = require("./menuEventApi.js") as {
            createMenuEventApi: PreloadModuleRegistry["createMenuEventApi"];
        };
        const { createThemeApi } = require("./themeApi.js") as {
            createThemeApi: PreloadModuleRegistry["createThemeApi"];
        };
        const { createPreloadValidators } = require("./validators.js") as {
            createPreloadValidators: PreloadModuleRegistry["createPreloadValidators"];
        };
        const {
            isPreloadDevelopmentMode,
            shouldAllowGenericIpcBridge,
            shouldEnforceGenericIpcAllowlist,
        } = require("./environment.js") as {
            isPreloadDevelopmentMode: PreloadModuleRegistry["isPreloadDevelopmentMode"];
            shouldAllowGenericIpcBridge: PreloadModuleRegistry["shouldAllowGenericIpcBridge"];
            shouldEnforceGenericIpcAllowlist: PreloadModuleRegistry["shouldEnforceGenericIpcAllowlist"];
        };
        const { createGenericIpcApi } = require("./genericIpcApi.js") as {
            createGenericIpcApi: PreloadModuleRegistry["createGenericIpcApi"];
        };
        const { resolvePreloadElectronBridge } =
            require("./electronBridge.js") as {
                resolvePreloadElectronBridge: PreloadModuleRegistry["resolvePreloadElectronBridge"];
            };
        const { exposeElectronApi } = require("./electronApiExposure.js") as {
            exposeElectronApi: PreloadModuleRegistry["exposeElectronApi"];
        };
        const { createMainStateBridge } = require("./mainStateBridge.js") as {
            createMainStateBridge: PreloadModuleRegistry["createMainStateBridge"];
        };
        const { createPreloadIpcHelpers } = require("./ipcHelpers.js") as {
            createPreloadIpcHelpers: PreloadModuleRegistry["createPreloadIpcHelpers"];
        };
        const { createPreloadLogger } = require("./logger.js") as {
            createPreloadLogger: PreloadModuleRegistry["createPreloadLogger"];
        };
        const { createMainStateApi } = require("./mainStateApi.js") as {
            createMainStateApi: PreloadModuleRegistry["createMainStateApi"];
        };
        const ipcBridgeCatalog =
            require("./ipcBridgeCatalog.js") as PreloadModuleRegistry["ipcBridgeCatalog"];

        return {
            createApiDiagnostics,
            createAppInfoApi,
            createClipboardBridge,
            createDevtoolsMenuApi,
            createExternalApi,
            createFileApi,
            createFitBrowserApi,
            createGenericIpcApi,
            createMainStateApi,
            createMainStateBridge,
            createMenuEventApi,
            createPreloadIpcHelpers,
            createPreloadLogger,
            createPreloadValidators,
            createThemeApi,
            exposeDevelopmentToolsGlobal,
            exposeElectronApi,
            ipcBridgeCatalog,
            isPreloadDevelopmentMode,
            registerPreloadBeforeExitHandler,
            resolvePreloadElectronBridge,
            shouldAllowGenericIpcBridge,
            shouldEnforceGenericIpcAllowlist,
        };
    }

    module.exports = {
        loadPreloadModules,
    };
}

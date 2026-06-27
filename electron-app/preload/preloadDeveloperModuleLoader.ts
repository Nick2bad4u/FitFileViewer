import { createApiDiagnostics } from "./apiDiagnostics.js";
import { createDevtoolsMenuApi } from "./devtoolsMenuApi.js";
import { exposeDevelopmentToolsGlobal } from "./developmentToolsGlobal.js";

type PreloadDeveloperModules =
    import("./preloadAssemblyTypes").PreloadDeveloperModules;

export function loadPreloadDeveloperModules(): PreloadDeveloperModules {
    return {
        createApiDiagnostics,
        createDevtoolsMenuApi,
        exposeDevelopmentToolsGlobal,
    };
}

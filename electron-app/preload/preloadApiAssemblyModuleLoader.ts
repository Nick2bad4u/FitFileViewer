import { createPreloadApiAssemblyContext } from "./apiAssemblyContext.js";
import { createPreloadClipboardApiDomain } from "./clipboardApiDomain.js";
import { createPreloadDeveloperApiDomain } from "./developerApiDomain.js";
import { createPreloadDiagnosticsApiDomain } from "./diagnosticsApiDomain.js";
import { createPreloadExternalApiDomain } from "./externalApiDomain.js";
import { createPreloadFileApiDomain } from "./fileApiDomain.js";
import { createPreloadIpcEventApiDomain } from "./ipcEventApiDomain.js";
import { createPreloadStateApiDomain } from "./stateApiDomain.js";
import { createPreloadSystemApiDomain } from "./systemApiDomain.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadApiAssemblyModules = Pick<
    PreloadModuleRegistry,
    | "createPreloadApiAssemblyContext"
    | "createPreloadClipboardApiDomain"
    | "createPreloadDeveloperApiDomain"
    | "createPreloadDiagnosticsApiDomain"
    | "createPreloadExternalApiDomain"
    | "createPreloadFileApiDomain"
    | "createPreloadIpcEventApiDomain"
    | "createPreloadStateApiDomain"
    | "createPreloadSystemApiDomain"
>;

export function loadPreloadApiAssemblyModules(): PreloadApiAssemblyModules {
    return {
        createPreloadApiAssemblyContext,
        createPreloadClipboardApiDomain,
        createPreloadDeveloperApiDomain,
        createPreloadDiagnosticsApiDomain:
            createPreloadDiagnosticsApiDomain,
        createPreloadExternalApiDomain,
        createPreloadFileApiDomain,
        createPreloadIpcEventApiDomain,
        createPreloadStateApiDomain,
        createPreloadSystemApiDomain,
    };
}

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

const createPreloadApiAssemblyContextModule =
    createPreloadApiAssemblyContext as unknown as PreloadModuleRegistry["createPreloadApiAssemblyContext"];
const createPreloadClipboardApiDomainModule =
    createPreloadClipboardApiDomain as unknown as PreloadModuleRegistry["createPreloadClipboardApiDomain"];
const createPreloadDeveloperApiDomainModule =
    createPreloadDeveloperApiDomain as unknown as PreloadModuleRegistry["createPreloadDeveloperApiDomain"];
const createPreloadDiagnosticsApiDomainModule =
    createPreloadDiagnosticsApiDomain as unknown as PreloadModuleRegistry["createPreloadDiagnosticsApiDomain"];
const createPreloadExternalApiDomainModule =
    createPreloadExternalApiDomain as unknown as PreloadModuleRegistry["createPreloadExternalApiDomain"];
const createPreloadFileApiDomainModule =
    createPreloadFileApiDomain as unknown as PreloadModuleRegistry["createPreloadFileApiDomain"];
const createPreloadIpcEventApiDomainModule =
    createPreloadIpcEventApiDomain as unknown as PreloadModuleRegistry["createPreloadIpcEventApiDomain"];
const createPreloadStateApiDomainModule =
    createPreloadStateApiDomain as unknown as PreloadModuleRegistry["createPreloadStateApiDomain"];
const createPreloadSystemApiDomainModule =
    createPreloadSystemApiDomain as unknown as PreloadModuleRegistry["createPreloadSystemApiDomain"];

export function loadPreloadApiAssemblyModules(): PreloadApiAssemblyModules {
    return {
        createPreloadApiAssemblyContext:
            createPreloadApiAssemblyContextModule,
        createPreloadClipboardApiDomain:
            createPreloadClipboardApiDomainModule,
        createPreloadDeveloperApiDomain:
            createPreloadDeveloperApiDomainModule,
        createPreloadDiagnosticsApiDomain:
            createPreloadDiagnosticsApiDomainModule,
        createPreloadExternalApiDomain: createPreloadExternalApiDomainModule,
        createPreloadFileApiDomain: createPreloadFileApiDomainModule,
        createPreloadIpcEventApiDomain: createPreloadIpcEventApiDomainModule,
        createPreloadStateApiDomain: createPreloadStateApiDomainModule,
        createPreloadSystemApiDomain: createPreloadSystemApiDomainModule,
    };
}

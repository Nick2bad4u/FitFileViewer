import { createFileApi } from "./fileApi.js";
import { createFitBrowserApi } from "./fitBrowserApi.js";

type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadFileModules = Pick<
    PreloadModuleRegistry,
    "createFileApi" | "createFitBrowserApi"
>;

const createFileApiModule =
    createFileApi as unknown as PreloadModuleRegistry["createFileApi"];
const createFitBrowserApiModule =
    createFitBrowserApi as unknown as PreloadModuleRegistry["createFitBrowserApi"];

export function loadPreloadFileModules(): PreloadFileModules {
    return {
        createFileApi: createFileApiModule,
        createFitBrowserApi: createFitBrowserApiModule,
    };
}

import { createRequire } from "node:module";

const requireFromTest = createRequire(import.meta.url);

const preloadIpcBridgeCatalog = requireFromTest(
    "../../preload/ipcBridgeCatalog.js"
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

    throw new Error(`Module not mocked: ${moduleName}`);
}

import { createRequire } from "node:module";

const requireFromTest = createRequire(import.meta.url);

const preloadIpcBridgeCatalog = requireFromTest(
    "../../preload/ipcBridgeCatalog.js"
);
const preloadBeforeExitHandler = requireFromTest(
    "../../preload/beforeExitHandler.js"
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

    if (moduleName === "./preload/beforeExitHandler.js") {
        return preloadBeforeExitHandler;
    }

    if (moduleName === "./preload/validators.js") {
        return preloadValidators;
    }

    throw new Error(`Module not mocked: ${moduleName}`);
}

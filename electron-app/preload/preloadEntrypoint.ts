type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;

interface StartPreloadEntrypointOptions {
    consoleRef?: Console;
    globalScope?: typeof globalThis;
    processRef?: NodeJS.Process;
}

type PreloadBootstrapModule = {
    startPreloadScript: (options: {
        consoleRef?: Console;
        globalScope?: typeof globalThis;
        processRef?: NodeJS.Process;
        requireModule: PreloadModuleRequire;
    }) => void;
};

/** Starts the Electron preload script with the runtime Node globals. */
export function startDefaultPreloadEntrypoint(): void {
    startPreloadEntrypoint(require, {
        consoleRef: console,
        globalScope: globalThis,
        processRef: process,
    });
}

export function startPreloadEntrypoint(
    requireModule: NodeJS.Require,
    { consoleRef, globalScope, processRef }: StartPreloadEntrypointOptions = {}
): void {
    const preloadRequire = createPreloadEntrypointRequire(requireModule);
    const { startPreloadScript } = loadPreloadBootstrap(preloadRequire);

    startPreloadScript({
        ...(consoleRef === undefined ? {} : { consoleRef }),
        ...(globalScope === undefined ? {} : { globalScope }),
        ...(processRef === undefined ? {} : { processRef }),
        requireModule: preloadRequire as PreloadModuleRequire,
    });
}

function loadPreloadBootstrap(
    requireModule: NodeJS.Require
): PreloadBootstrapModule {
    try {
        return requireModule(
            "./preload/preloadBootstrap.js"
        ) as PreloadBootstrapModule;
    } catch (error) {
        if (!isCannotFindModuleError(error, "./preload/preloadBootstrap.js")) {
            throw error;
        }

        return requireModule("./preloadBootstrap.js") as PreloadBootstrapModule;
    }
}

function createPreloadEntrypointRequire(
    requireModule: NodeJS.Require
): NodeJS.Require {
    const preloadRequire = ((moduleId: string) => {
        try {
            return requireModule(moduleId);
        } catch (error) {
            if (
                !moduleId.startsWith("./preload/") ||
                !isCannotFindModuleError(error, moduleId)
            ) {
                throw error;
            }

            return requireModule(`./${moduleId.slice("./preload/".length)}`);
        }
    }) as NodeJS.Require;

    Object.assign(preloadRequire, requireModule);
    return preloadRequire;
}

function isCannotFindModuleError(error: unknown, moduleId: string): boolean {
    return (
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: unknown }).code === "MODULE_NOT_FOUND" &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string" &&
        (error as { message: string }).message.includes(moduleId)
    );
}

type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadElectronBridge =
    import("./preloadModuleTypes").PreloadElectronBridge;

interface StartPreloadEntrypointOptions {
    consoleRef?: Console;
    electronBridgeOverride?: null | PreloadElectronBridge;
    globalScope?: object;
    processRef?: NodeJS.Process;
}

type PreloadBootstrapModule = {
    startPreloadScript: (options: {
        consoleRef?: Console;
        electronBridgeOverride?: null | PreloadElectronBridge;
        globalScope?: object;
        processRef?: NodeJS.Process;
        requireModule: PreloadModuleRequire;
    }) => void;
};

type PreloadRuntimeEnvironmentModule = {
    getDefaultPreloadRuntimeEnvironment: () => {
        consoleRef: Console;
        globalScope: object;
        processRef: NodeJS.Process;
    };
};

/** Starts the Electron preload script with the runtime Node globals. */
export function startDefaultPreloadEntrypoint(): void {
    startPreloadEntrypoint(
        require,
        loadPreloadRuntimeEnvironment(
            createPreloadEntrypointRequire(require)
        ).getDefaultPreloadRuntimeEnvironment()
    );
}

export function startPreloadEntrypoint(
    requireModule: NodeJS.Require,
    {
        consoleRef,
        electronBridgeOverride,
        globalScope,
        processRef,
    }: StartPreloadEntrypointOptions = {}
): void {
    const preloadRequire = createPreloadEntrypointRequire(requireModule);
    const { startPreloadScript } = loadPreloadBootstrap(preloadRequire);

    startPreloadScript({
        ...(consoleRef === undefined ? {} : { consoleRef }),
        ...(electronBridgeOverride === undefined
            ? {}
            : { electronBridgeOverride }),
        ...(globalScope === undefined ? {} : { globalScope }),
        ...(processRef === undefined ? {} : { processRef }),
        requireModule: preloadRequire as PreloadModuleRequire,
    });
}

function loadPreloadRuntimeEnvironment(
    requireModule: NodeJS.Require
): PreloadRuntimeEnvironmentModule {
    try {
        return requireModule(
            "./preload/preloadRuntimeEnvironment.js"
        ) as PreloadRuntimeEnvironmentModule;
    } catch (error) {
        if (
            !isCannotFindModuleError(
                error,
                "./preload/preloadRuntimeEnvironment.js"
            )
        ) {
            throw error;
        }

        return requireModule(
            "./preloadRuntimeEnvironment.js"
        ) as PreloadRuntimeEnvironmentModule;
    }
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

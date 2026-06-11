type RendererStateStartupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

interface RendererStateStartupOptions {
    ensureCoreModules: () => Promise<Record<string, unknown>>;
    logRenderer: RendererStateStartupLogger;
    toModuleRecord: (target: unknown) => Record<string, unknown>;
}

interface RendererStateStartup {
    initializeStateManager: () => Promise<void>;
    isOpeningFileRef: { value: boolean };
    resetStateInitializationForTests: () => void;
}

/**
 * Owns the renderer state-manager bootstrap and local file-opening state
 * mirror.
 */
export function createRendererStateStartup(
    options: RendererStateStartupOptions
): RendererStateStartup {
    const isOpeningFileRef = { value: false };
    const stateInitTracker: {
        initialized: boolean;
        promise: null | Promise<void>;
    } = {
        initialized: false,
        promise: null,
    };

    async function initializeStateManager(): Promise<void> {
        if (stateInitTracker.initialized) {
            return stateInitTracker.promise ?? Promise.resolve();
        }

        if (stateInitTracker.promise) {
            return stateInitTracker.promise;
        }

        stateInitTracker.promise = (async () => {
            try {
                options.logRenderer(
                    "log",
                    "[Renderer] Initializing state management system..."
                );
                const { masterStateManager, subscribeAppDomainPath } =
                    await options.ensureCoreModules();
                const masterStateManagerRecord =
                    options.toModuleRecord(masterStateManager);
                const initialize = masterStateManagerRecord["initialize"];
                if (typeof initialize !== "function") {
                    throw new TypeError(
                        "masterStateManager.initialize missing"
                    );
                }

                const initializeFn = /**
                 * @type {(this: unknown) => Promise<unknown> | unknown}
                 */ initialize;
                await initializeFn.call(masterStateManager);

                if (typeof subscribeAppDomainPath !== "function") {
                    throw new TypeError("subscribeAppDomainPath missing");
                }

                const subscribeOpeningFile =
                    subscribeAppDomainPath as (
                        path: string,
                        callback: (value: unknown) => void
                    ) => unknown;
                subscribeOpeningFile(
                    "app.isOpeningFile",
                    (isOpening: unknown) => {
                        isOpeningFileRef.value = isOpening === true;
                    }
                );

                stateInitTracker.initialized = true;

                options.logRenderer(
                    "log",
                    "[Renderer] State management system initialized"
                );
            } catch (error) {
                options.logRenderer(
                    "error",
                    "[Renderer] Failed to initialize state manager:",
                    error
                );
                stateInitTracker.initialized = false;
                stateInitTracker.promise = null;
                throw error;
            }
        })();

        return stateInitTracker.promise;
    }

    function resetStateInitializationForTests(): void {
        stateInitTracker.initialized = false;
        stateInitTracker.promise = null;
        isOpeningFileRef.value = false;
    }

    return {
        initializeStateManager,
        isOpeningFileRef,
        resetStateInitializationForTests,
    };
}

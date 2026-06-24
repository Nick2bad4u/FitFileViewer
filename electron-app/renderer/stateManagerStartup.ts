import type { RendererCoreModules } from "./coreModuleResolution.js";

type RendererStateStartupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

interface RendererStateStartupOptions {
    ensureCoreModules: () => Promise<
        Pick<
            RendererCoreModules,
            "masterStateManager" | "subscribeAppDomainPath"
        >
    >;
    logRenderer: RendererStateStartupLogger;
}

type RendererStateManager = {
    initialize: () => Promise<unknown> | unknown;
};

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
                const stateManager = toRendererStateManager(masterStateManager);
                if (stateManager === undefined) {
                    throw new TypeError(
                        "masterStateManager.initialize missing"
                    );
                }

                await stateManager.initialize();

                if (typeof subscribeAppDomainPath !== "function") {
                    throw new TypeError("subscribeAppDomainPath missing");
                }

                subscribeAppDomainPath("app.isOpeningFile", (isOpening) => {
                    isOpeningFileRef.value = isOpening === true;
                });

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

function toRendererStateManager(
    value: unknown
): RendererStateManager | undefined {
    if (value === null || typeof value !== "object") {
        return undefined;
    }

    const candidate = value as Partial<RendererStateManager>;
    return typeof candidate.initialize === "function"
        ? (candidate as RendererStateManager)
        : undefined;
}

import type { AppOpeningFileSubscriber } from "../utils/state/domain/appDomainState.js";

type RendererStateStartupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

export type RendererStateStartupCoreModules = Readonly<{
    readonly masterStateManager: unknown;
    readonly subscribeToAppOpeningFile: AppOpeningFileSubscriber | undefined;
}>;

export type RendererFileOpeningStateRef = {
    value: boolean;
};

interface RendererStateStartupOptions {
    ensureCoreModules: () => Promise<RendererStateStartupCoreModules>;
    logRenderer: RendererStateStartupLogger;
}

type RendererStateManager = {
    initialize: () => Promise<unknown> | unknown;
};
type RendererStateManagerCandidate = Readonly<{
    initialize?: unknown;
}>;

interface RendererStateStartup {
    initializeStateManager: () => Promise<void>;
    isOpeningFileRef: RendererFileOpeningStateRef;
    resetStateInitializationForTests: () => void;
}

/**
 * Owns the renderer state-manager bootstrap and local file-opening state
 * mirror.
 */
export function createRendererStateStartup(
    options: RendererStateStartupOptions
): RendererStateStartup {
    const isOpeningFileRef = createRendererFileOpeningStateRef();
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
                const { masterStateManager, subscribeToAppOpeningFile } =
                    await options.ensureCoreModules();
                const stateManager = toRendererStateManager(masterStateManager);
                if (stateManager === undefined) {
                    throw new TypeError(
                        "masterStateManager.initialize missing"
                    );
                }

                await stateManager.initialize();

                if (typeof subscribeToAppOpeningFile !== "function") {
                    throw new TypeError("subscribeToAppOpeningFile missing");
                }

                subscribeToAppOpeningFile((isOpening) => {
                    setRendererFileOpeningState(
                        isOpeningFileRef,
                        isOpening === true
                    );
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
        setRendererFileOpeningState(isOpeningFileRef, false);
    }

    return {
        initializeStateManager,
        isOpeningFileRef,
        resetStateInitializationForTests,
    };
}

export function createRendererFileOpeningStateRef(): RendererFileOpeningStateRef {
    return { value: false };
}

export function isRendererFileOpening(
    stateRef: RendererFileOpeningStateRef
): boolean {
    return stateRef.value;
}

export function setRendererFileOpeningState(
    stateRef: RendererFileOpeningStateRef,
    isOpeningFile: boolean
): void {
    stateRef.value = isOpeningFile;
}

function toRendererStateManager(
    value: unknown
): RendererStateManager | undefined {
    return isRendererStateManager(value) ? value : undefined;
}

function isRendererStateManager(value: unknown): value is RendererStateManager {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const candidate = value as RendererStateManagerCandidate;
    return typeof candidate.initialize === "function";
}

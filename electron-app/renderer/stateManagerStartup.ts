import type { AppOpeningFileSubscriber } from "../utils/state/domain/appDomainState.js";

type RendererStateStartupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

export type RendererFileOpeningStateRef = {
    value: boolean;
};

interface RendererStateStartupOptions {
    logRenderer: RendererStateStartupLogger;
    masterStateManager: RendererStateManager;
    subscribeToAppOpeningFile: AppOpeningFileSubscriber;
}

type RendererStateManagerInitializer = () => Promise<void> | void;

type RendererStateManager = {
    initialize: RendererStateManagerInitializer;
};

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

                await options.masterStateManager.initialize();

                options.subscribeToAppOpeningFile((isOpening) => {
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

import type { RendererLifecycleAppState } from "./lifecycleCleanup.js";

type RendererStateStartupLogger = (
    level: "error" | "log",
    ...args: unknown[]
) => void;

interface RendererStateStartupOptions {
    ensureCoreModules: () => Promise<Record<string, unknown>>;
    getState: (path: string) => unknown;
    logRenderer: RendererStateStartupLogger;
    subscribe: (path: string, callback: (value: unknown) => void) => unknown;
    toModuleRecord: (target: unknown) => Record<string, unknown>;
}

interface RendererStateStartup {
    getAppState: () => RendererLifecycleAppState | null;
    initializeStateManager: () => Promise<void>;
    isOpeningFileRef: { value: boolean };
    resetStateInitializationForTests: () => void;
}

/**
 * Owns the renderer state-manager bootstrap and its legacy compatibility proxy.
 */
export function createRendererStateStartup(
    options: RendererStateStartupOptions
): RendererStateStartup {
    let appState: RendererLifecycleAppState | null = null;
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
                const { AppActions, masterStateManager } =
                    await options.ensureCoreModules();
                const appActions = options.toModuleRecord(AppActions);
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

                appState = {
                    get isInitialized() {
                        return getMasterAppFlag(
                            masterStateManager,
                            "initialized"
                        );
                    },
                    set isInitialized(value) {
                        callBooleanAppAction(
                            appActions,
                            "setInitialized",
                            value
                        );
                    },
                    get isOpeningFile() {
                        return getMasterAppFlag(
                            masterStateManager,
                            "isOpeningFile"
                        );
                    },
                    set isOpeningFile(value) {
                        callBooleanAppAction(
                            appActions,
                            "setFileOpening",
                            value
                        );
                        isOpeningFileRef.value = value;
                    },
                    get startTime() {
                        return getStateStartTime();
                    },
                };

                options.subscribe("app.isOpeningFile", (isOpening) => {
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
                appState = {
                    isInitialized: false,
                    isOpeningFile: false,
                    startTime: performance.now(),
                };
                stateInitTracker.initialized = false;
                stateInitTracker.promise = null;
                throw error;
            }
        })();

        return stateInitTracker.promise;
    }

    function callBooleanAppAction(
        appActions: Record<string, unknown>,
        actionName: "setFileOpening" | "setInitialized",
        value: boolean
    ): void {
        const action = appActions[actionName];
        if (typeof action === "function") {
            const actionFn = /** @type {(value: boolean) => unknown} */ action;
            actionFn(value);
        }
    }

    function getMasterAppFlag(
        masterStateManager: unknown,
        key: string
    ): boolean {
        const getStateMember =
            options.toModuleRecord(masterStateManager)["getState"];
        if (typeof getStateMember !== "function") {
            return false;
        }

        const getStateFn = /** @type {() => unknown} */ getStateMember;
        const state = options.toModuleRecord(getStateFn());
        const app = options.toModuleRecord(state["app"]);

        return app[key] === true;
    }

    function getStateStartTime(): number | undefined {
        const startTime = options.getState("app.startTime");
        return typeof startTime === "number" ? startTime : undefined;
    }

    function resetStateInitializationForTests(): void {
        stateInitTracker.initialized = false;
        stateInitTracker.promise = null;
        isOpeningFileRef.value = false;
    }

    return {
        getAppState: () => appState,
        initializeStateManager,
        isOpeningFileRef,
        resetStateInitializationForTests,
    };
}

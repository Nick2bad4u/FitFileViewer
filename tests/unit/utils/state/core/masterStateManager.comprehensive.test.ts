import { describe, expect, it, vi } from "vitest";

/* eslint-disable vitest/prefer-to-be-falsy, vitest/prefer-to-be-truthy -- Exact booleans are required by test-signal/no-weak-truthy-assertions. */

const staticModuleMocks = vi.hoisted(() => ({
    AppActions: {
        switchTab: vi.fn<(tabName: string) => void>(),
    },
    AppSelectors: {
        hasData: vi.fn<() => boolean>().mockReturnValue(true),
    },
    initializeRendererStateBindings: vi.fn<() => void>(),
    showNotification: vi.fn<(message: string, kind: string) => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/ui/rendererStateBindings.js"),
    () => ({
        initializeRendererStateBindings:
            staticModuleMocks.initializeRendererStateBindings,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/syncRendererNotifications.js"),
    () => ({
        showNotification: staticModuleMocks.showNotification,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/app/lifecycle/appActions.js"),
    () => ({
        AppActions: staticModuleMocks.AppActions,
        AppSelectors: staticModuleMocks.AppSelectors,
    })
);

import {
    getMasterStateManager,
    initializeFitFileViewerState,
    MasterStateManager,
    masterStateManager,
} from "../../../../../electron-app/utils/state/core/masterStateManager.js";
import type { MasterStateManagerDependencies } from "../../../../../electron-app/utils/state/core/masterStateManager.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type StateOptions = {
    readonly source: string;
};

type StateManagerApiMock = {
    getState: ReturnType<typeof vi.fn<(path?: string) => unknown>>;
    getStateHistory: ReturnType<typeof vi.fn<() => unknown[]>>;
    getSubscriptions: ReturnType<typeof vi.fn<() => Record<string, unknown>>>;
    setState: ReturnType<
        typeof vi.fn<
            (path: string, value: unknown, options?: StateOptions) => void
        >
    >;
    subscribe: ReturnType<
        typeof vi.fn<
            (path: string, callback: (value: unknown) => void) => () => void
        >
    >;
};

type HarnessMocks = {
    appActions: {
        AppActions: {
            switchTab: ReturnType<typeof vi.fn<(tabName: string) => void>>;
        };
        AppSelectors: {
            hasData: ReturnType<typeof vi.fn<() => boolean>>;
        };
    };
    computedStateManager: {
        computedStateManager: {
            cleanup: ReturnType<typeof vi.fn<() => void>>;
        };
        initializeCommonComputedValues: ReturnType<typeof vi.fn<() => void>>;
    };
    enableTabButtons: {
        initializeTabButtonState: ReturnType<typeof vi.fn<() => void>>;
    };
    fitFileState: {
        fitFileStateManager?: {
            cleanup: ReturnType<typeof vi.fn<() => void>>;
            initialize: ReturnType<typeof vi.fn<() => Promise<void>>>;
        };
    };
    rendererStateBindings: {
        initializeRendererStateBindings: ReturnType<typeof vi.fn<() => void>>;
    };
    settingsStateManager: {
        settingsStateManager: {
            cleanup: ReturnType<typeof vi.fn<() => void>>;
            initialize: ReturnType<typeof vi.fn<() => Promise<void>>>;
        };
    };
    stateDevTools: {
        cleanupStateDevTools: ReturnType<typeof vi.fn<() => void>>;
        initializeStateDevTools: ReturnType<typeof vi.fn<() => void>>;
    };
    stateIntegration: {
        initializeCompleteStateSystem: ReturnType<
            typeof vi.fn<() => Promise<void>>
        >;
    };
    stateManager: StateManagerApiMock;
    stateMiddleware: {
        cleanupMiddleware: ReturnType<typeof vi.fn<() => void>>;
        initializeDefaultMiddleware: ReturnType<typeof vi.fn<() => void>>;
    };
    uiStateManager: {
        UIActions: {
            setTheme: ReturnType<typeof vi.fn<(themeName: string) => void>>;
            showTab: ReturnType<typeof vi.fn<(tabName: string) => void>>;
            updateWindowState: ReturnType<typeof vi.fn<() => void>>;
        };
    };
    updateActiveTab: {
        initializeActiveTabState: ReturnType<typeof vi.fn<() => void>>;
    };
    updateControlsState: {
        initializeControlsState: ReturnType<typeof vi.fn<() => void>>;
    };
    updateTabVisibility: {
        initializeTabVisibilityState: ReturnType<typeof vi.fn<() => void>>;
    };
};

type ListenerMap = Map<string, EventListener[]>;

type Harness = {
    bodyElement: HTMLElement;
    documentListeners: ListenerMap;
    electronAPI: MasterStateElectronApi;
    globalListeners: ListenerMap;
    intervalHandlers: Array<() => void>;
    loadingElement: HTMLElement;
    location: Location;
    mocks: HarnessMocks;
    dependencies: MasterStateManagerDependencies;
    windowListeners: ListenerMap;
};

type HarnessOptions = {
    readonly appVersion?: string;
    readonly development?: boolean;
    readonly legacyLocalTheme?: string;
    readonly localTheme?: string;
};

type MasterStateGlobal = typeof globalThis & {
    __DEVELOPMENT__?: boolean;
};

type MasterStateElectronApi = {
    __devMode?: boolean;
    getAppVersion: ReturnType<typeof vi.fn<() => Promise<string>>>;
    openFileDialog: ReturnType<typeof vi.fn<() => void>>;
};

let activeElectronApiScope: RendererElectronApiScope | undefined;
let activeDependencies: MasterStateManagerDependencies | undefined;

function createMasterStateManager(): MasterStateManager {
    return new MasterStateManager({
        dependencies: activeDependencies,
        electronApiScope: activeElectronApiScope,
    });
}

function createElectronApiScope(
    api: MasterStateElectronApi | null
): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

const globalKeys = [
    "__DEVELOPMENT__",
    "addEventListener",
    "clearInterval",
    "dispatchEvent",
    "document",
    "getComputedStyle",
    "localStorage",
    "location",
    "performance",
    "setInterval",
    "window",
] as const;

type GlobalKey = (typeof globalKeys)[number];

const devToolsComponentName = ["dev", "Tools"].join("");

describe("masterStateManager comprehensive behavior", () => {
    it("constructs state accessors and reports initialization status", async () => {
        expect.assertions(6);

        await withMasterStateHarness(async ({ mocks }) => {
            mocks.stateManager.getState.mockImplementation((path) => {
                const values: Record<string, unknown> = {
                    "system.initialized": false,
                    "system.mode": "production",
                    "system.startupTime": 123,
                    "system.version": "30.0.0",
                    "ui.theme": "dark",
                };
                return path ? values[path] : values;
            });

            const manager = createMasterStateManager();
            manager.components.set("core", {
                initialized: true,
                timestamp: 123,
            });

            expect(manager.initializationOrder).toStrictEqual([
                "core",
                "middleware",
                "computed",
                "settings",
                "renderer",
                "tabs",
                "fitFile",
                "ui",
                devToolsComponentName,
                "integration",
            ]);
            expect({ initialized: manager.isInitialized }).toStrictEqual({
                initialized: false,
            });
            expect(manager.getState("ui.theme")).toBe("dark");
            expect(manager.getHistory()).toStrictEqual([]);
            expect(manager.getSubscriptions()).toStrictEqual({});
            expect(manager.getInitializationStatus()).toStrictEqual({
                components: {
                    core: { initialized: true, timestamp: 123 },
                },
                isInitialized: false,
                systemState: {
                    initialized: false,
                    mode: "production",
                    startupTime: 123,
                    version: "30.0.0",
                },
            });
        });
    });

    it("initializes all components in dependency order", async () => {
        expect.assertions(16);

        await withMasterStateHarness(
            async ({ mocks }) => {
                const manager = createMasterStateManager();

                await manager.initialize();

                expect(
                    mocks.stateIntegration.initializeCompleteStateSystem
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.stateMiddleware.initializeDefaultMiddleware
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.computedStateManager.initializeCommonComputedValues
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.settingsStateManager.settingsStateManager.initialize
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.rendererStateBindings.initializeRendererStateBindings
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.enableTabButtons.initializeTabButtonState
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.updateActiveTab.initializeActiveTabState
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.updateTabVisibility.initializeTabVisibilityState
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.updateControlsState.initializeControlsState
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.stateDevTools.initializeStateDevTools
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.uiStateManager.UIActions.setTheme
                ).toHaveBeenCalledWith("system");
                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "system.version",
                    "30.0.0",
                    { source: "MasterStateManager" }
                );
                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "system.initialized",
                    true,
                    { source: "MasterStateManager" }
                );
                expect(mocks.stateManager.subscribe).toHaveBeenCalledWith(
                    "fitFile.rawData",
                    expect.any(Function)
                );
                expect({ initialized: manager.isInitialized }).toStrictEqual({
                    initialized: true,
                });
                expect([...manager.components.keys()]).toContain("integration");
            },
            { appVersion: "30.0.0", development: true, localTheme: "auto" }
        );
    });

    it("skips duplicate initialization without invoking component startup", async () => {
        expect.assertions(4);

        await withMasterStateHarness(async ({ mocks }) => {
            const manager = createMasterStateManager();
            manager.isInitialized = true;

            await manager.initialize();

            expect(console.warn).toHaveBeenCalledWith(
                "[MasterState] Already initialized"
            );
            expect(
                mocks.stateIntegration.initializeCompleteStateSystem
            ).not.toHaveBeenCalled();
            expect(mocks.stateManager.setState).not.toHaveBeenCalledWith(
                "system.initialized",
                true,
                expect.any(Object)
            );
            expect({ initialized: manager.isInitialized }).toStrictEqual({
                initialized: true,
            });
        });
    });

    it("initializes UI theme from the legacy persisted theme key", async () => {
        expect.assertions(1);

        await withMasterStateHarness(
            async ({ mocks }) => {
                const manager = createMasterStateManager();
                let appliedTheme: string | undefined;
                mocks.uiStateManager.UIActions.setTheme.mockImplementation(
                    (themeName) => {
                        appliedTheme = themeName;
                    }
                );

                manager.initializeUIComponents();

                expect(appliedTheme).toBe("dark");
            },
            { legacyLocalTheme: "dark" }
        );
    });

    it("records component initialization failures and missing FIT manager errors", async () => {
        expect.assertions(4);

        await withMasterStateHarness(async ({ dependencies, mocks }) => {
            const manager = createMasterStateManager();
            const settingsError = new Error("Settings failed");
            mocks.settingsStateManager.settingsStateManager.initialize.mockRejectedValue(
                settingsError
            );

            await expect(
                manager.initializeComponent("settings")
            ).rejects.toThrow("Settings failed");
            expect(console.error).toHaveBeenCalledWith(
                "[MasterState] Failed to initialize settings:",
                settingsError
            );
            expect(manager.components.get("settings")).toStrictEqual({
                error: "Settings failed",
                initialized: false,
            });

            dependencies.fitFileState = {};

            expect(() => {
                manager.initializeFitFileComponents();
            }).toThrow("FIT file state manager not available");
        });
    });

    it("detects development mode from runtime signals and production fallback", async () => {
        expect.assertions(2);

        await withMasterStateHarness(
            async ({ electronAPI, location }) => {
                const manager = createMasterStateManager();

                expect({
                    developmentMode: manager.isDevelopmentMode(),
                }).toStrictEqual({
                    developmentMode: true,
                });

                location.hostname = "example.com";
                location.href = "https://example.com/";
                location.protocol = "https:";
                location.search = "";
                location.hash = "";
                delete (globalThis as MasterStateGlobal).__DEVELOPMENT__;
                electronAPI.__devMode = undefined;

                expect({
                    developmentMode: manager.isDevelopmentMode(),
                }).toStrictEqual({
                    developmentMode: false,
                });
            },
            { development: true }
        );
    });

    it("sets up drag and drop handlers for valid and invalid dropped files", async () => {
        expect.assertions(6);

        await withMasterStateHarness(
            async ({ bodyElement, documentListeners }) => {
                const manager = createMasterStateManager();

                manager.setupDragAndDrop();

                expect(document.addEventListener).toHaveBeenCalledWith(
                    "dragenter",
                    expect.any(Function),
                    expect.objectContaining({ signal: expect.any(Object) })
                );
                expect(document.addEventListener).toHaveBeenCalledWith(
                    "drop",
                    expect.any(Function),
                    expect.objectContaining({ signal: expect.any(Object) })
                );

                dispatchListeners(
                    documentListeners,
                    "dragover",
                    createDropEvent("ride.fit")
                );

                expect(bodyElement.classList.contains("drag-over")).toBe(true);

                dispatchListeners(
                    documentListeners,
                    "dragleave",
                    createDropEvent("ride.fit")
                );

                expect(bodyElement.classList.contains("drag-over")).toBe(false);

                dispatchListeners(
                    documentListeners,
                    "drop",
                    createDropEvent("ride.fit")
                );

                expect(staticModuleMocks.showNotification).toHaveBeenCalledWith(
                    "FIT file dropped",
                    "info"
                );

                staticModuleMocks.showNotification.mockClear();
                dispatchListeners(
                    documentListeners,
                    "drop",
                    createDropEvent("ride.txt")
                );

                expect(staticModuleMocks.showNotification).toHaveBeenCalledWith(
                    "Please drop a .fit file",
                    "warning"
                );
            }
        );
    });

    it("routes keyboard shortcuts and window lifecycle events", async () => {
        expect.assertions(8);

        await withMasterStateHarness(
            async ({
                documentListeners,
                electronAPI,
                mocks,
                windowListeners,
            }) => {
                const manager = createMasterStateManager();

                manager.setupKeyboardShortcuts();
                manager.setupWindowEventListeners();

                dispatchListeners(
                    documentListeners,
                    "keydown",
                    createKeyboardEvent("o")
                );
                dispatchListeners(
                    documentListeners,
                    "keydown",
                    createKeyboardEvent("t")
                );
                dispatchListeners(
                    documentListeners,
                    "keydown",
                    createKeyboardEvent("2")
                );
                dispatchListeners(
                    windowListeners,
                    "resize",
                    new Event("resize")
                );
                dispatchListeners(windowListeners, "focus", new Event("focus"));
                dispatchListeners(windowListeners, "blur", new Event("blur"));
                dispatchListeners(
                    windowListeners,
                    "beforeunload",
                    new Event("beforeunload")
                );

                expect(electronAPI.openFileDialog).toHaveBeenCalledOnce();
                expect(
                    mocks.uiStateManager.UIActions.setTheme
                ).toHaveBeenCalledWith("dark");
                expect(
                    mocks.appActions.AppActions.switchTab
                ).toHaveBeenCalledWith("chart");
                expect(
                    mocks.uiStateManager.UIActions.updateWindowState
                ).toHaveBeenCalledOnce();
                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "ui.windowFocused",
                    true,
                    { source: "windowEventListener" }
                );
                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "ui.windowFocused",
                    false,
                    { source: "windowEventListener" }
                );
                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "system.unloading",
                    true,
                    { source: "windowEventListener" }
                );
                expect({
                    developmentMode: manager.isDevelopmentMode(),
                }).toStrictEqual({
                    developmentMode: true,
                });
            },
            { development: true }
        );
    });

    it("connects error handling, integrations, performance monitoring, and cleanup", async () => {
        expect.assertions(16);

        await withMasterStateHarness(
            async ({
                globalListeners,
                intervalHandlers,
                loadingElement,
                mocks,
            }) => {
                const manager = createMasterStateManager();

                manager.setupErrorHandling();
                dispatchListeners(
                    globalListeners,
                    "error",
                    new ErrorEvent("error", {
                        colno: 4,
                        error: new Error("boom"),
                        filename: "app.js",
                        lineno: 2,
                    })
                );
                dispatchListeners(
                    globalListeners,
                    "unhandledrejection",
                    new PromiseRejectionEvent("unhandledrejection", {
                        promise: Promise.resolve(),
                        reason: new Error("async boom"),
                    })
                );

                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "system.lastError",
                    expect.objectContaining({ message: "boom" }),
                    { source: "globalErrorHandler" }
                );
                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "system.lastPromiseRejection",
                    expect.objectContaining({ reason: "async boom" }),
                    { source: "promiseRejectionHandler" }
                );

                manager.setupIntegrations();
                const subscriptions = mocks.stateManager.subscribe.mock.calls;
                subscriptions.find(([path]) => path === "fitFile.rawData")?.[1](
                    { records: [] }
                );
                subscriptions.find(([path]) => path === "isLoading")?.[1](true);
                subscriptions.find(([path]) => path === "ui.theme")?.[1](
                    "dark"
                );

                expect(
                    mocks.uiStateManager.UIActions.showTab
                ).toHaveBeenCalledWith("summary");
                expect(loadingElement.style.pointerEvents).toBe("none");
                expect(loadingElement.style.opacity).toBe("0.5");
                expect(globalThis.dispatchEvent).toHaveBeenCalledWith(
                    expect.objectContaining({ type: "themeChanged" })
                );

                manager.components.set("settings", {});
                manager.components.set("computed", {});
                manager.components.set("middleware", {});
                manager.components.set(devToolsComponentName, {});
                manager.isInitialized = true;
                const performanceUnsubscribe = vi.fn<() => void>();
                mocks.stateManager.subscribe.mockImplementation((path) =>
                    path === "" ? performanceUnsubscribe : vi.fn<() => void>()
                );
                manager.setupPerformanceMonitoring();
                const performanceSubscription = [
                    ...mocks.stateManager.subscribe.mock.calls,
                ]
                    .reverse()
                    .find(([path]) => path === "")?.[1];
                performanceSubscription?.(undefined);
                performanceSubscription?.(undefined);
                intervalHandlers.at(-1)?.();
                manager.cleanup();

                expect(setInterval).toHaveBeenCalledWith(
                    expect.any(Function),
                    60_000
                );
                expect(mocks.stateManager.subscribe).toHaveBeenCalledWith(
                    "",
                    expect.any(Function)
                );
                expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                    "system.performance",
                    expect.objectContaining({
                        memoryUsage: { total: 95, used: 48 },
                        stateChangesPerMinute: expect.any(Number),
                    }),
                    { source: "performanceMonitor" }
                );
                expect(performanceUnsubscribe).toHaveBeenCalledOnce();
                expect(
                    mocks.settingsStateManager.settingsStateManager.cleanup
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.computedStateManager.computedStateManager.cleanup
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.stateMiddleware.cleanupMiddleware
                ).toHaveBeenCalledOnce();
                expect(
                    mocks.stateDevTools.cleanupStateDevTools
                ).toHaveBeenCalledOnce();
                expect(clearInterval).toHaveBeenCalledWith(12345);
                expect({
                    componentCount: manager.components.size,
                    initialized: manager.isInitialized,
                }).toStrictEqual({
                    componentCount: 0,
                    initialized: false,
                });
            },
            { development: true }
        );
    });

    it("exports the singleton and startup convenience function", async () => {
        expect.assertions(3);

        const initializeSpy = vi
            .spyOn(masterStateManager, "initialize")
            .mockResolvedValue();
        try {
            await initializeFitFileViewerState();

            expect(getMasterStateManager()).toBe(masterStateManager);
            expect(masterStateManager).toBeInstanceOf(MasterStateManager);
            expect(initializeSpy).toHaveBeenCalledOnce();
        } finally {
            initializeSpy.mockRestore();
        }
    });
});

function createDropEvent(fileName: string): DragEvent {
    return {
        dataTransfer: {
            files: [{ name: fileName }],
        },
        preventDefault: vi.fn<() => void>(),
        stopPropagation: vi.fn<() => void>(),
    } as unknown as DragEvent;
}

function createHarnessMocks(): HarnessMocks {
    return {
        appActions: {
            AppActions: { switchTab: vi.fn<(tabName: string) => void>() },
            AppSelectors: {
                hasData: vi.fn<() => boolean>().mockReturnValue(true),
            },
        },
        computedStateManager: {
            computedStateManager: { cleanup: vi.fn<() => void>() },
            initializeCommonComputedValues: vi.fn<() => void>(),
        },
        enableTabButtons: {
            initializeTabButtonState: vi.fn<() => void>(),
        },
        fitFileState: {
            fitFileStateManager: {
                cleanup: vi.fn<() => void>(),
                initialize: vi.fn<() => Promise<void>>().mockResolvedValue(),
            },
        },
        rendererStateBindings: {
            initializeRendererStateBindings: vi.fn<() => void>(),
        },
        settingsStateManager: {
            settingsStateManager: {
                cleanup: vi.fn<() => void>(),
                initialize: vi.fn<() => Promise<void>>().mockResolvedValue(),
            },
        },
        stateDevTools: {
            cleanupStateDevTools: vi.fn<() => void>(),
            initializeStateDevTools: vi.fn<() => void>(),
        },
        stateIntegration: {
            initializeCompleteStateSystem: vi
                .fn<() => Promise<void>>()
                .mockResolvedValue(),
        },
        stateManager: {
            getState: vi.fn<(path?: string) => unknown>((path) =>
                path === "ui.theme" ? "light" : undefined
            ),
            getStateHistory: vi.fn<() => unknown[]>().mockReturnValue([]),
            getSubscriptions: vi
                .fn<() => Record<string, unknown>>()
                .mockReturnValue({}),
            setState:
                vi.fn<
                    (
                        path: string,
                        value: unknown,
                        options?: StateOptions
                    ) => void
                >(),
            subscribe: vi.fn<
                (path: string, callback: (value: unknown) => void) => () => void
            >(() => vi.fn<() => void>()),
        },
        stateMiddleware: {
            cleanupMiddleware: vi.fn<() => void>(),
            initializeDefaultMiddleware: vi.fn<() => void>(),
        },
        uiStateManager: {
            UIActions: {
                setTheme: vi.fn<(themeName: string) => void>(),
                showTab: vi.fn<(tabName: string) => void>(),
                updateWindowState: vi.fn<() => void>(),
            },
        },
        updateActiveTab: {
            initializeActiveTabState: vi.fn<() => void>(),
        },
        updateControlsState: {
            initializeControlsState: vi.fn<() => void>(),
        },
        updateTabVisibility: {
            initializeTabVisibilityState: vi.fn<() => void>(),
        },
    };
}

function createKeyboardEvent(key: string): KeyboardEvent {
    return {
        ctrlKey: true,
        key,
        metaKey: false,
        preventDefault: vi.fn<() => void>(),
    } as unknown as KeyboardEvent;
}

function createMasterStateDependencies(
    mocks: HarnessMocks
): MasterStateManagerDependencies {
    return {
        appLifecycle: mocks.appActions,
        computedState: mocks.computedStateManager,
        controlsState: mocks.updateControlsState,
        enableTabButtons: mocks.enableTabButtons,
        fitFileState: mocks.fitFileState,
        rendererStateBindings: mocks.rendererStateBindings,
        settingsState: mocks.settingsStateManager,
        stateDevTools: mocks.stateDevTools,
        stateIntegration: mocks.stateIntegration,
        stateManager: mocks.stateManager,
        stateMiddleware: mocks.stateMiddleware,
        uiState: mocks.uiStateManager,
        updateActiveTab: mocks.updateActiveTab,
        updateTabVisibility: mocks.updateTabVisibility,
    };
}

function defineGlobalValue(
    descriptors: Map<GlobalKey, PropertyDescriptor>,
    key: GlobalKey,
    value: unknown
): void {
    if (!descriptors.has(key)) {
        descriptors.set(key, getGlobalRestoreDescriptor(key));
    }
    Object.defineProperty(globalThis, key, {
        configurable: true,
        value,
        writable: true,
    });
}

function getGlobalRestoreDescriptor(key: GlobalKey): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis, key) ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

function dispatchListeners(
    listeners: ListenerMap,
    eventName: string,
    event: Event
): void {
    for (const listener of listeners.get(eventName) ?? []) {
        listener(event);
    }
}

function registerListener(
    listeners: ListenerMap,
    eventName: string,
    listener: EventListenerOrEventListenerObject
): void {
    if (typeof listener !== "function") {
        return;
    }
    const existingListeners = listeners.get(eventName) ?? [];
    existingListeners.push(listener);
    listeners.set(eventName, existingListeners);
}

function restoreGlobals(descriptors: Map<GlobalKey, PropertyDescriptor>): void {
    for (const [key, descriptor] of [...descriptors.entries()].reverse()) {
        Object.defineProperty(globalThis, key, descriptor);
    }
}

async function withMasterStateHarness(
    callback: (harness: Harness) => Promise<void> | void,
    options: HarnessOptions = {}
): Promise<void> {
    const descriptors = new Map<GlobalKey, PropertyDescriptor>();
    const mocks = createHarnessMocks();
    const dependencies = createMasterStateDependencies(mocks);
    const documentListeners: ListenerMap = new Map();
    const globalListeners: ListenerMap = new Map();
    const windowListeners: ListenerMap = new Map();
    const intervalHandlers: Array<() => void> = [];
    const bodyElement = document.createElement("main");
    const loadingElement = document.createElement("button");
    const location = {
        hash: options.development ? "#debug" : "",
        hostname: options.development ? "localhost" : "example.com",
        href: options.development
            ? "http://localhost/#debug"
            : "https://example.com/",
        protocol: options.development ? "http:" : "https:",
        search: options.development ? "?debug=true" : "",
    } as Location;

    vi.spyOn(console, "error").mockReturnValue(undefined);
    vi.spyOn(console, "log").mockReturnValue(undefined);
    vi.spyOn(console, "warn").mockReturnValue(undefined);
    staticModuleMocks.AppActions.switchTab.mockClear();
    staticModuleMocks.AppSelectors.hasData.mockReturnValue(true);
    staticModuleMocks.initializeRendererStateBindings.mockClear();
    staticModuleMocks.showNotification.mockClear();

    const documentMock = {
        addEventListener: vi.fn<
            (
                eventName: string,
                listener: EventListenerOrEventListenerObject,
                options?: AddEventListenerOptions
            ) => void
        >((eventName, listener) =>
            registerListener(documentListeners, eventName, listener)
        ),
        body: bodyElement,
        documentElement: {
            dataset: {},
            hasAttribute: vi
                .fn<(name: string) => boolean>()
                .mockReturnValue(false),
        },
        querySelector: vi
            .fn<(selector: string) => HTMLElement | null>()
            .mockReturnValue(loadingElement),
        querySelectorAll: vi
            .fn<(selector: string) => HTMLElement[]>()
            .mockReturnValue([loadingElement]),
    } satisfies Partial<Document>;

    const windowMock = {
        addEventListener: vi.fn<
            (
                eventName: string,
                listener: EventListenerOrEventListenerObject,
                options?: AddEventListenerOptions
            ) => void
        >((eventName, listener) =>
            registerListener(windowListeners, eventName, listener)
        ),
        getComputedStyle: vi
            .fn<() => Partial<CSSStyleDeclaration>>()
            .mockReturnValue({
                display: "block",
                visibility: "visible",
            }),
        location,
    } satisfies Partial<Window>;

    const electronAPI = {
        __devMode: options.development ? true : undefined,
        getAppVersion: vi
            .fn<() => Promise<string>>()
            .mockResolvedValue(options.appVersion ?? "26.5.0"),
        openFileDialog: vi.fn<() => void>(),
    } satisfies MasterStateElectronApi;

    try {
        defineGlobalValue(descriptors, "document", documentMock);
        defineGlobalValue(descriptors, "window", windowMock);
        defineGlobalValue(descriptors, "location", location);
        activeElectronApiScope = createElectronApiScope(electronAPI);
        activeDependencies = dependencies;
        defineGlobalValue(
            descriptors,
            "__DEVELOPMENT__",
            options.development === true
        );
        defineGlobalValue(
            descriptors,
            "addEventListener",
            vi.fn(registerGlobalListener)
        );
        defineGlobalValue(
            descriptors,
            "dispatchEvent",
            vi.fn<() => boolean>().mockReturnValue(true)
        );
        defineGlobalValue(
            descriptors,
            "clearInterval",
            vi.fn<(id: number) => void>()
        );
        defineGlobalValue(
            descriptors,
            "getComputedStyle",
            windowMock.getComputedStyle
        );
        defineGlobalValue(descriptors, "localStorage", {
            getItem: vi.fn<(key: string) => string | null>((key) => {
                if (key === "ffv-theme") {
                    return options.localTheme ?? null;
                }

                if (key === "fitFileViewer_theme") {
                    return options.legacyLocalTheme ?? null;
                }

                return null;
            }),
            setItem: vi.fn<(key: string, value: string) => void>(),
        });
        defineGlobalValue(descriptors, "performance", {
            memory: {
                totalJSHeapSize: 99_614_720,
                usedJSHeapSize: 50_331_648,
            },
        });
        defineGlobalValue(
            descriptors,
            "setInterval",
            vi.fn<(handler: TimerHandler, timeout?: number) => number>(
                (handler) => {
                    if (typeof handler === "function") {
                        intervalHandlers.push(handler as () => void);
                    }
                    return 12_345;
                }
            )
        );

        await callback({
            bodyElement,
            documentListeners,
            electronAPI,
            globalListeners,
            intervalHandlers,
            loadingElement,
            location,
            mocks,
            dependencies,
            windowListeners,
        });
    } finally {
        activeElectronApiScope = undefined;
        activeDependencies = undefined;
        restoreGlobals(descriptors);
        vi.restoreAllMocks();
    }

    function registerGlobalListener(
        eventName: string,
        listener: EventListenerOrEventListenerObject
    ): void {
        registerListener(globalListeners, eventName, listener);
        registerListener(windowListeners, eventName, listener);
    }
}

/* eslint-enable vitest/prefer-to-be-falsy, vitest/prefer-to-be-truthy */

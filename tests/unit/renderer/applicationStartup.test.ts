import { describe, expect, it, vi } from "vitest";

import {
    createRendererApplicationStartup,
    type RendererApplicationStartupCoreModules,
} from "../../../electron-app/renderer/applicationStartup.js";
import type { RendererApplicationStartupRuntime } from "../../../electron-app/renderer/applicationStartupRuntime.js";

function createCoreModules(
    overrides: Partial<RendererApplicationStartupCoreModules> = {}
): RendererApplicationStartupCoreModules {
    return {
        handleOpenFile: vi.fn(),
        setupListeners: vi.fn(),
        setupTheme: vi.fn(),
        ...overrides,
    };
}

function createPerformanceMonitor() {
    const starts: string[] = [];
    const ends: string[] = [];

    return {
        ends,
        monitor: {
            end: vi.fn<(name: string) => number>((name) => {
                ends.push(name);
                return 12.34;
            }),
            getMetrics: vi.fn(() => ({})),
            start: vi.fn<(name: string) => void>((name) => {
                starts.push(name);
            }),
        },
        starts,
    };
}

function createApplicationStartupRuntime(): RendererApplicationStartupRuntime {
    return {
        clearTimeout: vi.fn((handle) => {
            clearTimeout(handle);
        }),
        createAbortController: vi.fn(() => new AbortController()),
        setTimeout: vi.fn((callback, delay) => setTimeout(callback, delay)),
    };
}

describe("renderer application startup", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("initializes state, DOM, components, hooks, and app actions", async () => {
        expect.assertions(12);

        const coreModules = createCoreModules();
        const openFileButton = document.createElement("button");
        const initializeStateManager = vi.fn<() => Promise<void>>(
            async () => undefined
        );
        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const performance = createPerformanceMonitor();
        const electronApiScope = {};
        const appActions = {
            setInitialized: vi.fn(),
        };
        const applyTheme = vi.fn();
        const getAppStartTime = vi.fn();
        const listenForThemeChange = vi.fn();
        const showAboutModal = vi.fn();
        const showNotification = vi.fn();
        const showUpdateNotification = vi.fn();
        const utils = createRendererApplicationStartup({
            addEventListener,
            appActions,
            applyTheme,
            ensureCoreModules: async () => coreModules,
            errorHandlers: {
                handleUncaughtError: vi.fn(),
                handleUnhandledRejection: vi.fn(),
                onUncaughtErrorEvent: vi.fn(),
                onUnhandledRejectionEvent: vi.fn(),
            },
            getElectronApiScope: () => electronApiScope,
            getAppStartTime,
            getOpenFileButton: () => openFileButton,
            initializeStateManager,
            isDevelopmentMode: () => true,
            isOpeningFileRef: { value: false },
            listenForThemeChange,
            logRenderer: vi.fn(),
            performanceMonitor: performance.monitor,
            setLoading: vi.fn(),
            showAboutModal,
            showNotification,
            showUpdateNotification,
            setupCreditsMarquee: vi.fn(),
            validateDOMElements: () => true,
        });

        await utils();

        expect(initializeStateManager).toHaveBeenCalledOnce();
        expect(addEventListener).toHaveBeenCalledWith(
            "unhandledrejection",
            expect.any(Function),
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(addEventListener).toHaveBeenCalledWith(
            "error",
            expect.any(Function),
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(coreModules.setupTheme).toHaveBeenCalledWith(
            applyTheme,
            listenForThemeChange,
            { electronApiScope }
        );
        expect(coreModules.setupListeners).toHaveBeenCalledWith(
            expect.objectContaining({
                electronApiScope,
                handleOpenFile: coreModules.handleOpenFile,
                openFileBtn: openFileButton,
            })
        );
        expect(getAppStartTime).toHaveBeenCalledOnce();
        expect(appActions.setInitialized).toHaveBeenCalledWith(true);
        expect(showNotification).toHaveBeenCalledWith(
            "App initialized in 12ms",
            "success",
            3000
        );
        expect(performance.starts).toStrictEqual([
            "app_initialization",
            "theme_setup",
            "listeners_setup",
            "async_components",
        ]);
        expect(performance.ends).toStrictEqual([
            "theme_setup",
            "listeners_setup",
            "async_components",
            "app_initialization",
        ]);
        expect(showAboutModal).not.toHaveBeenCalled();
        expect(showUpdateNotification).not.toHaveBeenCalled();
    });

    it("schedules production update checks and cancels the pending timer before unload", async () => {
        expect.assertions(6);

        vi.useFakeTimers();

        const checkForUpdates = vi.fn<() => void>();
        const coreModules = createCoreModules();
        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const performance = createPerformanceMonitor();
        const runtime = createApplicationStartupRuntime();
        const utils = createRendererApplicationStartup({
            addEventListener,
            appActions: { setInitialized: vi.fn() },
            applyTheme: vi.fn(),
            ensureCoreModules: async () => coreModules,
            errorHandlers: {
                handleUncaughtError: vi.fn(),
                handleUnhandledRejection: vi.fn(),
                onUncaughtErrorEvent: vi.fn(),
                onUnhandledRejectionEvent: vi.fn(),
            },
            getElectronApiScope: () => ({
                getElectronAPI: () => ({ checkForUpdates }),
            }),
            getAppStartTime: vi.fn(),
            getOpenFileButton: () => null,
            initializeStateManager: async () => undefined,
            isDevelopmentMode: () => false,
            isOpeningFileRef: { value: false },
            listenForThemeChange: vi.fn(),
            logRenderer: vi.fn(),
            performanceMonitor: performance.monitor,
            runtime,
            setLoading: vi.fn(),
            showAboutModal: vi.fn(),
            showNotification: vi.fn(),
            showUpdateNotification: vi.fn(),
            setupCreditsMarquee: vi.fn(),
            validateDOMElements: () => true,
        });

        await utils();

        const beforeUnloadListener = addEventListener.mock.calls.find(
            ([eventName]) => eventName === "beforeunload"
        )?.[1];
        if (typeof beforeUnloadListener === "function") {
            beforeUnloadListener(new Event("beforeunload"));
        }

        await vi.advanceTimersByTimeAsync(Number("5000"));

        expect(typeof beforeUnloadListener).toBe("function");
        expect(checkForUpdates).not.toHaveBeenCalled();
        expect(runtime.createAbortController).toHaveBeenCalledOnce();
        expect(runtime.setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            5000
        );
        expect(runtime.clearTimeout).toHaveBeenCalledOnce();
        expect(addEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function),
            expect.objectContaining({
                once: true,
                signal: expect.any(AbortSignal),
            })
        );
    });

    it("shows initialization failure notifications without throwing", async () => {
        expect.assertions(3);

        const showNotification = vi.fn();
        const performance = createPerformanceMonitor();
        const logRenderer = vi.fn();
        const utils = createRendererApplicationStartup({
            addEventListener: vi.fn(),
            appActions: { setInitialized: vi.fn() },
            applyTheme: vi.fn(),
            ensureCoreModules: async () => createCoreModules(),
            errorHandlers: {
                handleUncaughtError: vi.fn(),
                handleUnhandledRejection: vi.fn(),
                onUncaughtErrorEvent: vi.fn(),
                onUnhandledRejectionEvent: vi.fn(),
            },
            getElectronApiScope: () => ({}),
            getAppStartTime: vi.fn(),
            getOpenFileButton: () => null,
            initializeStateManager: async () => undefined,
            isDevelopmentMode: () => false,
            isOpeningFileRef: { value: false },
            listenForThemeChange: vi.fn(),
            logRenderer,
            performanceMonitor: performance.monitor,
            setLoading: vi.fn(),
            showAboutModal: vi.fn(),
            showNotification,
            showUpdateNotification: vi.fn(),
            setupCreditsMarquee: vi.fn(),
            validateDOMElements: () => false,
        });

        await expect(utils()).resolves.toBeUndefined();

        expect(showNotification).toHaveBeenCalledWith(
            "Initialization failed: Required DOM elements are missing",
            "error",
            10_000
        );
        expect(logRenderer).toHaveBeenCalledWith(
            "error",
            "[Renderer] Failed to initialize application:",
            expect.any(Error)
        );
    });
});

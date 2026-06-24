import { describe, expect, it, vi } from "vitest";

import { createRendererApplicationStartup } from "../../../electron-app/renderer/applicationStartup.js";
import type { RendererCoreModules } from "../../../electron-app/renderer/coreModuleResolution.js";
import {
    registerRendererElectronApiCandidate,
    resetRendererElectronApiCandidate,
} from "../../../electron-app/utils/runtime/electronApiRuntime.js";

function createCoreModules(
    overrides: Partial<RendererCoreModules> = {}
): RendererCoreModules {
    return {
        AppActions: {
            setInitialized: vi.fn(),
        },
        applyTheme: vi.fn(),
        getAppDomainState: vi.fn(),
        handleOpenFile: vi.fn(),
        listenForThemeChange: vi.fn(),
        masterStateManager: {},
        setupListeners: vi.fn(),
        setupTheme: vi.fn(),
        showAboutModal: vi.fn(),
        showNotification: vi.fn(),
        showUpdateNotification: vi.fn(),
        subscribeAppDomain: vi.fn(),
        subscribeAppDomainPath: vi.fn(),
        uiStateManager: {},
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

describe("renderer application startup", () => {
    afterEach(() => {
        resetRendererElectronApiCandidate();
        vi.useRealTimers();
    });

    it("initializes state, DOM, components, file input, hooks, and app actions", async () => {
        expect.assertions(14);

        const coreModules = createCoreModules();
        const fileInput = document.createElement("input");
        const openFileButton = document.createElement("button");
        const initializeStateManager = vi.fn<() => Promise<void>>(
            async () => undefined
        );
        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const performance = createPerformanceMonitor();
        const utils = createRendererApplicationStartup({
            addEventListener,
            ensureCoreModules: async () => coreModules,
            errorHandlers: {
                handleUncaughtError: vi.fn(),
                handleUnhandledRejection: vi.fn(),
                onUncaughtErrorEvent: vi.fn(),
                onUnhandledRejectionEvent: vi.fn(),
            },
            getFileInput: () => fileInput,
            getOpenFileButton: () => openFileButton,
            initializeStateManager,
            isDevelopmentMode: () => true,
            isOpeningFileRef: { value: false },
            logRenderer: vi.fn(),
            performanceMonitor: performance.monitor,
            setLoading: vi.fn(),
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
            coreModules.applyTheme,
            coreModules.listenForThemeChange
        );
        expect(coreModules.setupListeners).toHaveBeenCalledWith(
            expect.objectContaining({
                handleOpenFile: coreModules.handleOpenFile,
                openFileBtn: openFileButton,
            })
        );
        expect(coreModules.getAppDomainState).toHaveBeenCalledWith(
            "app.startTime"
        );
        expect(coreModules.AppActions?.setInitialized).toHaveBeenCalledWith(
            true
        );
        expect(coreModules.showNotification).toHaveBeenCalledWith(
            "App initialized in 12ms",
            "success",
            3000
        );
        expect(fileInput.onchange).toBeNull();

        Object.defineProperty(fileInput, "files", {
            configurable: true,
            value: [new File(["fit"], "activity.fit")],
        });
        fileInput.dispatchEvent(new Event("change"));

        expect(coreModules.handleOpenFile).toHaveBeenCalled();
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
        expect(coreModules.showAboutModal).not.toHaveBeenCalled();
        expect(coreModules.showUpdateNotification).not.toHaveBeenCalled();
    });

    it("schedules production update checks and cancels the pending timer before unload", async () => {
        expect.assertions(3);

        vi.useFakeTimers();

        const checkForUpdates = vi.fn<() => void>();
        const coreModules = createCoreModules();
        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const performance = createPerformanceMonitor();
        const utils = createRendererApplicationStartup({
            addEventListener,
            ensureCoreModules: async () => coreModules,
            errorHandlers: {
                handleUncaughtError: vi.fn(),
                handleUnhandledRejection: vi.fn(),
                onUncaughtErrorEvent: vi.fn(),
                onUnhandledRejectionEvent: vi.fn(),
            },
            getFileInput: () => null,
            getOpenFileButton: () => null,
            initializeStateManager: async () => undefined,
            isDevelopmentMode: () => false,
            isOpeningFileRef: { value: false },
            logRenderer: vi.fn(),
            performanceMonitor: performance.monitor,
            setLoading: vi.fn(),
            setupCreditsMarquee: vi.fn(),
            validateDOMElements: () => true,
        });

        registerRendererElectronApiCandidate({ checkForUpdates });

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
            ensureCoreModules: async () =>
                createCoreModules({
                    showNotification,
                }),
            errorHandlers: {
                handleUncaughtError: vi.fn(),
                handleUnhandledRejection: vi.fn(),
                onUncaughtErrorEvent: vi.fn(),
                onUnhandledRejectionEvent: vi.fn(),
            },
            getFileInput: () => null,
            getOpenFileButton: () => null,
            initializeStateManager: async () => undefined,
            isDevelopmentMode: () => false,
            isOpeningFileRef: { value: false },
            logRenderer,
            performanceMonitor: performance.monitor,
            setLoading: vi.fn(),
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

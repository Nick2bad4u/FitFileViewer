import { afterEach, describe, expect, it, vi } from "vitest";

import {
    APP_INFO,
    createRendererDevelopmentDebugTools,
    getRendererDevelopmentRuntimeInfo,
    type RendererDevelopmentRuntimeInfo,
} from "../../../electron-app/renderer/developmentDebugTools.js";
import type { RendererDevelopmentDebugToolsRuntime } from "../../../electron-app/renderer/developmentDebugToolsRuntime.js";
import type { RendererPerformanceMonitor } from "../../../electron-app/renderer/startupPerformanceMonitor.js";
import {
    isRendererDebugLoggingEnabled,
    setRendererDebugLoggingEnabled,
} from "../../../electron-app/utils/debug/rendererDebugLoggingState.js";
import {
    isChartDebugLoggingEnabled,
    isChartFullscreenTraceEnabled,
    isChartVerboseDebugLoggingEnabled,
    resetChartDebugStateForTests,
} from "../../../electron-app/utils/charts/core/chartDebugState.js";
import { uiStateManager } from "../../../electron-app/utils/state/domain/uiStateManager.js";

vi.mock("../../../electron-app/utils/debug/debugSensorInfo.js", () => ({
    checkDataAvailability: vi.fn(),
    debugSensorInfo: vi.fn(),
    showDataKeys: vi.fn(),
    showSensorNames: vi.fn(),
    testManufacturerId: vi.fn(),
    testProductId: vi.fn(),
}));

vi.mock("../../../electron-app/utils/debug/debugChartFormatting.js", () => ({
    testFaveroCase: vi.fn(),
    testFaveroStringCase: vi.fn(),
    testNewFormatting: vi.fn(),
}));

const originalNodeEnv = process.env.NODE_ENV;

function restoreNodeEnv(): void {
    if (originalNodeEnv === undefined) {
        Reflect.deleteProperty(process.env, "NODE_ENV");
        return;
    }

    process.env.NODE_ENV = originalNodeEnv;
}

function createPerformanceMonitor(): RendererPerformanceMonitor {
    return {
        end: vi.fn<RendererPerformanceMonitor["end"]>(() => 12),
        getMetrics: vi.fn<RendererPerformanceMonitor["getMetrics"]>(() => ({
            app_initialization: 12,
        })),
        metrics: new Map<string, number>(),
        start: vi.fn<RendererPerformanceMonitor["start"]>(),
    };
}

type RendererSensorDebugTestUtilities = Readonly<{
    readonly checkDataAvailability: (...args: never[]) => unknown;
    readonly debugSensorInfo: (...args: never[]) => unknown;
    readonly showDataKeys: (...args: never[]) => unknown;
    readonly showSensorNames: (...args: never[]) => unknown;
    readonly testManufacturerId: (...args: never[]) => unknown;
    readonly testProductId: (...args: never[]) => unknown;
}>;

type RendererDebugChartFormattingTestUtilities = Readonly<{
    readonly testFaveroCase: (...args: never[]) => unknown;
    readonly testFaveroStringCase: (...args: never[]) => unknown;
    readonly testNewFormatting: (...args: never[]) => unknown;
}>;

describe("renderer development debug tools", () => {
    afterEach(() => {
        setRendererDebugLoggingEnabled(false);
        resetChartDebugStateForTests();
        restoreNodeEnv();
        vi.restoreAllMocks();
    });

    it("does not install debug globals outside development mode", () => {
        expect.assertions(2);

        expect(
            createRendererDevelopmentDebugTools({
                cleanup: vi.fn(),
                debugFunctions: {},
                initializeApplication: async () => {},
                isDevelopmentMode: () => false,
                isOpeningFileRef: { value: false },
                logRenderer: vi.fn(),
                performanceMonitor: createPerformanceMonitor(),
                stateModules: {},
                validateDOMElements: () => true,
            })
        ).toBeNull();
        expect(Reflect.get(globalThis, "__renderer_dev")).toBeUndefined();
    });

    it("creates renderer dev/debug tools without publishing globals", async () => {
        expect.assertions(25);

        const handleOpenFile = vi.fn<(...args: unknown[]) => string>(
            () => "opened"
        );
        const masterStateManager = {
            getHistory: vi.fn(() => ["history"]),
            getState: vi.fn(() => ({ app: { initialized: true } })),
            getSubscriptions: vi.fn(() => ["subscription"]),
        };
        const performanceMonitor = createPerformanceMonitor();
        const logRenderer = vi.fn();
        process.env.NODE_ENV = "development";

        const view = createRendererDevelopmentDebugTools({
            cleanup: vi.fn(),
            debugFunctions: {
                handleOpenFile,
            },
            stateModules: {
                AppActions: { setInitialized: vi.fn() },
                masterStateManager,
                uiStateManager,
            },
            initializeApplication: async () => {},
            isDevelopmentMode: () => true,
            isOpeningFileRef: { value: false },
            logRenderer,
            performanceMonitor,
            validateDOMElements: () => true,
        });
        await vi.dynamicImportSettled();

        const rendererDebug = view?.rendererDebug as {
            handleOpenFile: (...args: unknown[]) => Promise<unknown>;
        };
        const rendererDev = view?.rendererDev as {
            APP_INFO: typeof APP_INFO;
            AppActions?: unknown;
            chartDebug: boolean;
            chartDebugVerbose: boolean;
            debugChartFormatting?: RendererDebugChartFormattingTestUtilities;
            chartFullscreenTrace: boolean;
            debug: boolean;
            debugState: () => void;
            getPerformanceMetrics: () => Record<string, number>;
            getState: () => Promise<unknown>;
            sensorDebug?: RendererSensorDebugTestUtilities;
            stateManager: Promise<typeof masterStateManager | undefined>;
            uiStateManager?: typeof uiStateManager;
        };

        await expect(rendererDebug.handleOpenFile("fit-file")).resolves.toBe(
            "opened"
        );
        await expect(rendererDev.getState()).resolves.toStrictEqual({
            app: { initialized: true },
        });
        rendererDev.debugState();
        await Promise.resolve();

        expect(Reflect.get(globalThis, "__renderer_debug")).toBeUndefined();
        expect(Reflect.get(globalThis, "__renderer_dev")).toBeUndefined();
        expect(Reflect.get(globalThis, "__sensorDebug")).toBeUndefined();
        expect(
            Reflect.get(globalThis, "__debugChartFormatting")
        ).toBeUndefined();
        expect(Object.hasOwn(rendererDev, "appState")).toBe(false);
        expect(rendererDev.APP_INFO).toBe(APP_INFO);
        expect(rendererDev.debug).toBe(false);
        rendererDev.debug = true;
        expect(isRendererDebugLoggingEnabled()).toBe(true);
        expect(rendererDev.chartDebug).toBe(false);
        rendererDev.chartDebug = true;
        expect(isChartDebugLoggingEnabled()).toBe(true);
        expect(rendererDev.chartDebugVerbose).toBe(false);
        rendererDev.chartDebugVerbose = true;
        expect(isChartVerboseDebugLoggingEnabled()).toBe(true);
        expect(rendererDev.chartFullscreenTrace).toBe(true);
        rendererDev.chartFullscreenTrace = false;
        expect(isChartFullscreenTraceEnabled()).toBe(false);
        rendererDev.chartFullscreenTrace = "auto";
        expect(isChartFullscreenTraceEnabled()).toBe(true);
        expect(rendererDev.getPerformanceMetrics()).toStrictEqual({
            app_initialization: 12,
        });
        await expect(rendererDev.stateManager).resolves.toBe(
            masterStateManager
        );
        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith("fit-file");
        expect(masterStateManager.getState).toHaveBeenCalled();
        expect(masterStateManager.getHistory).toHaveBeenCalled();
        expect(masterStateManager.getSubscriptions).toHaveBeenCalled();
        expect(rendererDev.sensorDebug).toMatchObject({
            checkDataAvailability: expect.any(Function),
        });
        expect(rendererDev.debugChartFormatting).toMatchObject({
            testNewFormatting: expect.any(Function),
        });
    });

    it("ignores malformed development state manager methods", async () => {
        expect.assertions(3);

        process.env.NODE_ENV = "development";

        const view = createRendererDevelopmentDebugTools({
            cleanup: vi.fn(),
            debugFunctions: {},
            stateModules: {
                masterStateManager: {
                    getHistory: "not history",
                    getState: "not state",
                    getSubscriptions: "not subscriptions",
                } as never,
            },
            initializeApplication: async () => {},
            isDevelopmentMode: () => true,
            isOpeningFileRef: { value: false },
            logRenderer: vi.fn(),
            performanceMonitor: createPerformanceMonitor(),
            validateDOMElements: () => true,
        });

        const rendererDev = view?.rendererDev as {
            debugState: () => void;
            getState: () => Promise<unknown>;
            getStateHistory: () => Promise<unknown>;
        };

        await expect(rendererDev.getState()).resolves.toBeUndefined();
        await expect(rendererDev.getStateHistory()).resolves.toBeUndefined();
        expect(() => {
            rendererDev.debugState();
        }).not.toThrow();
    });

    it("rejects array-shaped development state manager candidates", async () => {
        expect.assertions(2);

        process.env.NODE_ENV = "development";

        const getState = vi.fn(() => ({ app: { initialized: true } }));
        const arrayStateManager = Object.assign([], { getState });
        const view = createRendererDevelopmentDebugTools({
            cleanup: vi.fn(),
            debugFunctions: {},
            stateModules: {
                masterStateManager: arrayStateManager as never,
            },
            initializeApplication: async () => {},
            isDevelopmentMode: () => true,
            isOpeningFileRef: { value: false },
            logRenderer: vi.fn(),
            performanceMonitor: createPerformanceMonitor(),
            validateDOMElements: () => true,
        });

        const rendererDev = view?.rendererDev as {
            getState: () => Promise<unknown>;
        };

        await expect(rendererDev.getState()).resolves.toBeUndefined();
        expect(getState).not.toHaveBeenCalled();
    });

    it("ignores malformed development debug function exports", async () => {
        expect.assertions(1);

        process.env.NODE_ENV = "development";

        const view = createRendererDevelopmentDebugTools({
            cleanup: vi.fn(),
            debugFunctions: {
                handleOpenFile: "not a handler" as never,
            },
            initializeApplication: async () => {},
            isDevelopmentMode: () => true,
            isOpeningFileRef: { value: false },
            logRenderer: vi.fn(),
            performanceMonitor: createPerformanceMonitor(),
            stateModules: {},
            validateDOMElements: () => true,
        });

        const rendererDebug = view?.rendererDebug as {
            handleOpenFile: (...args: unknown[]) => Promise<unknown>;
        };

        await expect(
            rendererDebug.handleOpenFile("fit-file")
        ).resolves.toBeUndefined();
    });

    it("reports runtime information without assuming browser-only globals", () => {
        expect.assertions(2);

        const runtimeInfo: RendererDevelopmentRuntimeInfo =
            APP_INFO.getRuntimeInfo();

        expect(APP_INFO.name).toBe("FIT File Viewer");
        expect(Object.hasOwn(runtimeInfo, "memoryUsage")).toBe(true);
    });

    it("reports runtime information through an injected metadata runtime", () => {
        expect.assertions(1);

        const utils: RendererDevelopmentDebugToolsRuntime = {
            getLocationSnapshot: vi.fn(() => ({ protocol: "https:" })),
            getNavigatorSnapshot: vi.fn(() => ({
                cookieEnabled: true,
                hardwareConcurrency: 16,
                language: "en-US",
                onLine: true,
                platform: "test-platform",
                userAgent: "fitfileviewer-test",
            })),
            getPerformanceMemorySnapshot: vi.fn(() => ({
                jsHeapSizeLimit: 300,
                totalJSHeapSize: 200,
                usedJSHeapSize: 100,
            })),
        };

        expect(getRendererDevelopmentRuntimeInfo(utils)).toStrictEqual({
            cookieEnabled: true,
            hardwareConcurrency: 16,
            language: "en-US",
            memoryUsage: {
                jsHeapSizeLimit: 300,
                totalJSHeapSize: 200,
                usedJSHeapSize: 100,
            },
            onLine: true,
            platform: "test-platform",
            userAgent: "fitfileviewer-test",
        });
    });
});

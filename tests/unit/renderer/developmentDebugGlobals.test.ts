import { afterEach, describe, expect, it, vi } from "vitest";

import {
    APP_INFO,
    installRendererDevelopmentDebugGlobals,
} from "../../../electron-app/renderer/developmentDebugGlobals.js";
import type { RendererPerformanceMonitor } from "../../../electron-app/renderer/startupPerformanceMonitor.js";

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

describe("renderer development debug globals", () => {
    afterEach(() => {
        Reflect.deleteProperty(globalThis, "__debugChartFormatting");
        Reflect.deleteProperty(globalThis, "__renderer_debug");
        Reflect.deleteProperty(globalThis, "__renderer_dev");
        Reflect.deleteProperty(globalThis, "__sensorDebug");
        vi.restoreAllMocks();
    });

    it("does not install debug globals outside development mode", () => {
        expect.assertions(2);

        expect(
            installRendererDevelopmentDebugGlobals({
                appState: null,
                callRecordMethod: vi.fn(),
                cleanup: vi.fn(),
                ensureCoreModules: async () => ({}),
                initializeApplication: async () => {},
                isDevelopmentMode: () => false,
                isOpeningFileRef: { value: false },
                logRenderer: vi.fn(),
                performanceMonitor: createPerformanceMonitor(),
                validateDOMElements: () => true,
            })
        ).toBeNull();
        expect(Reflect.get(globalThis, "__renderer_dev")).toBeUndefined();
    });

    it("installs renderer dev/debug globals and resolves core debug functions", async () => {
        expect.assertions(9);

        const handleOpenFile = vi.fn<(...args: unknown[]) => string>(
            () => "opened"
        );
        const masterStateManager = {
            getHistory: vi.fn(() => ["history"]),
            getState: vi.fn(() => ({ app: { initialized: true } })),
            getSubscriptions: vi.fn(() => ["subscription"]),
        };
        const callRecordMethod = vi.fn((target: unknown, methodName: string) =>
            (target as Record<string, () => unknown>)[methodName]?.()
        );
        const performanceMonitor = createPerformanceMonitor();
        const logRenderer = vi.fn();

        installRendererDevelopmentDebugGlobals({
            appState: null,
            callRecordMethod,
            cleanup: vi.fn(),
            ensureCoreModules: async () => ({
                AppActions: { setInitialized: vi.fn() },
                handleOpenFile,
                masterStateManager,
                uiStateManager: { ready: true },
            }),
            initializeApplication: async () => {},
            isDevelopmentMode: () => true,
            isOpeningFileRef: { value: false },
            logRenderer,
            performanceMonitor,
            validateDOMElements: () => true,
        });
        await vi.dynamicImportSettled();

        const rendererDebug = Reflect.get(globalThis, "__renderer_debug") as {
            handleOpenFile: (...args: unknown[]) => Promise<unknown>;
        };
        const rendererDev = Reflect.get(globalThis, "__renderer_dev") as {
            APP_INFO: typeof APP_INFO;
            AppActions?: unknown;
            debugState: () => void;
            getPerformanceMetrics: () => Record<string, number>;
            getState: () => Promise<unknown>;
            stateManager: Promise<unknown>;
            uiStateManager?: unknown;
        };

        await expect(rendererDebug.handleOpenFile("fit-file")).resolves.toBe(
            "opened"
        );
        await expect(rendererDev.getState()).resolves.toStrictEqual({
            app: { initialized: true },
        });
        rendererDev.debugState();
        await Promise.resolve();

        expect(Reflect.get(globalThis, "__renderer_dev")).toBe(rendererDev);
        expect(rendererDev.APP_INFO).toBe(APP_INFO);
        expect(rendererDev.getPerformanceMetrics()).toStrictEqual({
            app_initialization: 12,
        });
        await expect(rendererDev.stateManager).resolves.toBe(
            masterStateManager
        );
        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith("fit-file");
        expect(Reflect.get(globalThis, "__sensorDebug")).toMatchObject({
            checkDataAvailability: expect.any(Function),
        });
        expect(Reflect.get(globalThis, "__debugChartFormatting")).toMatchObject(
            {
                testNewFormatting: expect.any(Function),
            }
        );
    });

    it("reports runtime information without assuming browser-only globals", () => {
        expect.assertions(2);

        const runtimeInfo = APP_INFO.getRuntimeInfo();

        expect(APP_INFO.name).toBe("FIT File Viewer");
        expect(Object.hasOwn(runtimeInfo, "memoryUsage")).toBe(true);
    });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { initializeRendererDiagnostics } from "../../../electron-app/renderer/rendererDiagnosticsWiring.js";
import type { RendererPerformanceMonitor } from "../../../electron-app/renderer/startupPerformanceMonitor.js";

vi.mock(
    "../../../electron-app/utils/app/initialization/rendererEnvironment.js",
    () => ({
        getEnvironment: () => "test",
        isDevelopmentMode: () => false,
    })
);

function createPerformanceMonitor(): RendererPerformanceMonitor {
    return {
        end: vi.fn<RendererPerformanceMonitor["end"]>(() => 0),
        getMetrics: vi.fn<RendererPerformanceMonitor["getMetrics"]>(() => ({})),
        metrics: new Map<string, number>(),
        start: vi.fn<RendererPerformanceMonitor["start"]>(),
    };
}

describe("renderer diagnostics wiring", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("logs startup diagnostics without installing renderer globals", () => {
        expect.assertions(4);

        const logRenderer =
            vi.fn<
                (
                    level: "group" | "groupEnd" | "log" | "warn",
                    ...args: unknown[]
                ) => void
            >();
        initializeRendererDiagnostics({
            cleanup: vi.fn(),
            debugFunctions: {},
            initializeApplication: async () => undefined,
            isOpeningFileRef: { value: false },
            logRenderer,
            performanceMonitor: createPerformanceMonitor(),
            stateModules: {},
            validateDOMElements: () => true,
        });

        expect(
            Reflect.get(globalThis, "createExportGPXButton")
        ).toBeUndefined();
        expect(Reflect.get(globalThis, "APP_INFO")).toBeUndefined();
        expect(logRenderer).toHaveBeenCalledWith("log", "Environment:", "test");
        expect(Reflect.get(globalThis, "__renderer_dev")).toBeUndefined();
    });
});

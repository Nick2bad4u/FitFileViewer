import { afterEach, describe, expect, it, vi } from "vitest";

import { installRendererGlobalSurfaces } from "../../../electron-app/renderer/globalSurfacesWiring.js";
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

describe("renderer global surfaces wiring", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("installs development globals and logs startup through one renderer surface", () => {
        expect.assertions(4);

        const scope = {} as typeof globalThis;
        const logRenderer =
            vi.fn<
                (
                    level: "group" | "groupEnd" | "log" | "warn",
                    ...args: unknown[]
                ) => void
            >();
        installRendererGlobalSurfaces({
            appState: null,
            cleanup: vi.fn(),
            ensureCoreModules: async () => ({}),
            initializeApplication: async () => undefined,
            isOpeningFileRef: { value: false },
            logRenderer,
            performanceMonitor: createPerformanceMonitor(),
            scope,
            validateDOMElements: () => true,
        });

        expect(Reflect.get(scope, "createExportGPXButton")).toBeUndefined();
        expect(Reflect.get(scope, "APP_INFO")).toBeUndefined();
        expect(logRenderer).toHaveBeenCalledWith("log", "Environment:", "test");
        expect(Reflect.get(scope, "__renderer_dev")).toBeUndefined();
    });
});

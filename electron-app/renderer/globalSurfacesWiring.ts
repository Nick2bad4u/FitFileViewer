import {
    getEnvironment,
    isDevelopmentMode,
} from "../utils/app/initialization/rendererEnvironment.js";
import {
    APP_INFO,
    createRendererDevelopmentDebugTools,
} from "./developmentDebugGlobals.js";
import { logRendererStartupInfo } from "./rendererStartupInfo.js";
import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";

type RendererGlobalSurfacesLogLevel = "group" | "groupEnd" | "log" | "warn";

type RendererGlobalSurfacesLogger = (
    level: RendererGlobalSurfacesLogLevel,
    ...args: unknown[]
) => void;

type RendererGlobalSurfacesOptions = {
    readonly cleanup: () => void;
    readonly ensureCoreModules: () => Promise<Record<string, unknown>>;
    readonly initializeApplication: () => Promise<void>;
    readonly isOpeningFileRef: { value: boolean };
    readonly logRenderer: RendererGlobalSurfacesLogger;
    readonly performanceMonitor: RendererPerformanceMonitor;
    readonly validateDOMElements: () => boolean;
};

export function installRendererGlobalSurfaces(
    options: RendererGlobalSurfacesOptions
): void {
    logRendererStartupInfo({
        appInfo: APP_INFO,
        environment: getEnvironment(),
        logRenderer: options.logRenderer,
    });

    createRendererDevelopmentDebugTools({
        cleanup: options.cleanup,
        ensureCoreModules: options.ensureCoreModules,
        initializeApplication: options.initializeApplication,
        isDevelopmentMode,
        isOpeningFileRef: options.isOpeningFileRef,
        logRenderer: options.logRenderer,
        performanceMonitor: options.performanceMonitor,
        validateDOMElements: options.validateDOMElements,
    });
}

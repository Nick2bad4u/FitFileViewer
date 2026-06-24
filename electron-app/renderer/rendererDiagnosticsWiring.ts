import {
    getEnvironment,
    isDevelopmentMode,
} from "../utils/app/initialization/rendererEnvironment.js";
import {
    APP_INFO,
    createRendererDevelopmentDebugTools,
    type RendererDevelopmentDebugCoreModules,
} from "./developmentDebugTools.js";
import { logRendererStartupInfo } from "./rendererStartupInfo.js";
import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";

type RendererDiagnosticsLogLevel = "group" | "groupEnd" | "log" | "warn";

type RendererDiagnosticsLogger = (
    level: RendererDiagnosticsLogLevel,
    ...args: unknown[]
) => void;

type RendererDiagnosticsOptions = {
    readonly cleanup: () => void;
    readonly ensureCoreModules: () => Promise<RendererDevelopmentDebugCoreModules>;
    readonly initializeApplication: () => Promise<void>;
    readonly isOpeningFileRef: { value: boolean };
    readonly logRenderer: RendererDiagnosticsLogger;
    readonly performanceMonitor: RendererPerformanceMonitor;
    readonly validateDOMElements: () => boolean;
};

export function initializeRendererDiagnostics(
    options: RendererDiagnosticsOptions
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

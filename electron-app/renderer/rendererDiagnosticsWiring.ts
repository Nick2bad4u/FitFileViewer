import {
    getEnvironment,
    isDevelopmentMode,
} from "../utils/app/initialization/rendererEnvironment.js";
import {
    APP_INFO,
    createRendererDevelopmentDebugTools,
    type RendererDevelopmentDebugFunctionModules,
    type RendererDevelopmentDebugStateModules,
} from "./developmentDebugTools.js";
import { logRendererStartupInfo } from "./rendererStartupInfo.js";
import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";

type RendererDiagnosticsLogLevel = "group" | "groupEnd" | "log" | "warn";

type RendererDiagnosticsLogger = (
    level: RendererDiagnosticsLogLevel,
    ...args: unknown[]
) => void;

type RendererDiagnosticsOptions = {
    readonly cleanup: () => void;
    readonly debugFunctions: RendererDevelopmentDebugFunctionModules;
    readonly initializeApplication: () => Promise<void>;
    readonly isOpeningFileRef: RendererFileOpeningStateRef;
    readonly logRenderer: RendererDiagnosticsLogger;
    readonly performanceMonitor: RendererPerformanceMonitor;
    readonly stateModules: RendererDevelopmentDebugStateModules;
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
        debugFunctions: options.debugFunctions,
        initializeApplication: options.initializeApplication,
        isDevelopmentMode,
        isOpeningFileRef: options.isOpeningFileRef,
        logRenderer: options.logRenderer,
        performanceMonitor: options.performanceMonitor,
        stateModules: options.stateModules,
        validateDOMElements: options.validateDOMElements,
    });
}

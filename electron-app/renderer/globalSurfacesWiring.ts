import {
    getEnvironment,
    isDevelopmentMode,
} from "../utils/app/initialization/rendererEnvironment.js";
import { createExportGPXButton } from "../utils/files/export/createExportGPXButton.js";
import {
    APP_INFO,
    installRendererDevelopmentDebugGlobals,
} from "./developmentDebugGlobals.js";
import {
    installRendererGlobalApiExposure,
    logRendererStartupInfo,
} from "./globalApiExposure.js";
import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";

type RendererGlobalSurfacesLogLevel = "group" | "groupEnd" | "log" | "warn";

type RendererGlobalSurfacesLogger = (
    level: RendererGlobalSurfacesLogLevel,
    ...args: unknown[]
) => void;

type RendererGlobalSurfacesOptions = {
    readonly appState: unknown;
    readonly cleanup: () => void;
    readonly ensureCoreModules: () => Promise<Record<string, unknown>>;
    readonly initializeApplication: () => Promise<void>;
    readonly isOpeningFileRef: { value: boolean };
    readonly logRenderer: RendererGlobalSurfacesLogger;
    readonly performanceMonitor: RendererPerformanceMonitor;
    readonly resetStateInitializationForTests: () => void;
    readonly scope?: typeof globalThis;
    readonly validateDOMElements: () => boolean;
};

export function installRendererGlobalSurfaces(
    options: RendererGlobalSurfacesOptions
): void {
    const scope = options.scope ?? globalThis;

    installRendererGlobalApiExposure({
        appInfo: APP_INFO,
        createExportGPXButton,
        resetStateInitializationForTests:
            options.resetStateInitializationForTests,
        scope,
    });

    logRendererStartupInfo({
        appInfo: APP_INFO,
        environment: getEnvironment(),
        logRenderer: options.logRenderer,
    });

    installRendererDevelopmentDebugGlobals({
        appState: options.appState,
        cleanup: options.cleanup,
        ensureCoreModules: options.ensureCoreModules,
        initializeApplication: options.initializeApplication,
        isDevelopmentMode,
        isOpeningFileRef: options.isOpeningFileRef,
        logRenderer: options.logRenderer,
        performanceMonitor: options.performanceMonitor,
        scope,
        validateDOMElements: options.validateDOMElements,
    });
}

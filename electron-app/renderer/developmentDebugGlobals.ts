import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";
import {
    isRendererDebugLoggingEnabled,
    setRendererDebugLoggingEnabled,
} from "../utils/debug/rendererDebugLoggingState.js";
import {
    isChartDebugLoggingEnabled,
    isChartFullscreenTraceEnabled,
    isChartVerboseDebugLoggingEnabled,
    setChartDebugLoggingEnabled,
    setChartFullscreenTraceEnabled,
    setChartVerboseDebugLoggingEnabled,
} from "../utils/charts/core/chartDebugState.js";

type DevelopmentDebugLogLevel = "log" | "warn";
type DevelopmentDebugLogger = (
    level: DevelopmentDebugLogLevel,
    ...args: unknown[]
) => void;
type DevelopmentCoreModuleResolver = () => Promise<Record<string, unknown>>;

interface RendererDevelopmentDebugGlobalsOptions {
    appState: unknown;
    cleanup: () => void;
    ensureCoreModules: DevelopmentCoreModuleResolver;
    initializeApplication: () => Promise<void>;
    isDevelopmentMode: () => boolean;
    isOpeningFileRef: { value: boolean };
    logRenderer: DevelopmentDebugLogger;
    performanceMonitor: RendererPerformanceMonitor;
    scope?: typeof globalThis;
    validateDOMElements: () => boolean;
}

const APP_INFO = {
    author: "FIT File Viewer Team",
    description: "Advanced FIT file analysis and visualization tool",
    getRuntimeInfo,
    license: "MIT",
    name: "FIT File Viewer",
    repository: "https://github.com/user/FitFileViewer",
    version: "21.1.0",
};

export { APP_INFO };

export function installRendererDevelopmentDebugGlobals(
    options: RendererDevelopmentDebugGlobalsOptions
): Record<string, unknown> | null {
    if (!options.isDevelopmentMode()) {
        return null;
    }

    const scope = options.scope ?? globalThis;
    const rendererDebugTools = createRendererDebugTools(options);
    Reflect.set(scope, "__renderer_debug", rendererDebugTools);

    const rendererDevTools = createRendererDevTools(options);
    Reflect.set(scope, "__renderer_dev", rendererDevTools);

    void loadDevelopmentDebugUtilities(rendererDevTools, options);

    options.logRenderer(
        "log",
        "[Renderer] Development utilities available at window.__renderer_dev"
    );
    options.logRenderer(
        "log",
        "[Renderer] Performance metrics:",
        options.performanceMonitor.getMetrics()
    );

    return rendererDevTools;
}

function createRendererDebugTools(
    options: RendererDevelopmentDebugGlobalsOptions
): Record<string, unknown> {
    const createDebugFunction =
        (exportName: string) =>
        async (...args: unknown[]): Promise<unknown> =>
            callDebugCoreFunction(exportName, args, options);

    return {
        handleOpenFile: createDebugFunction("handleOpenFile"),
        PerformanceMonitor: options.performanceMonitor,
        setupTheme: createDebugFunction("setupTheme"),
        showAboutModal: createDebugFunction("showAboutModal"),
        showNotification: createDebugFunction("showNotification"),
        showUpdateNotification: createDebugFunction("showUpdateNotification"),
    };
}

function createRendererDevTools(
    options: RendererDevelopmentDebugGlobalsOptions
): Record<string, unknown> {
    return {
        APP_INFO,
        appState: options.appState,
        cleanup: options.cleanup,
        get debug() {
            return isRendererDebugLoggingEnabled();
        },
        set debug(value: unknown) {
            setRendererDebugLoggingEnabled(value === true);
        },
        get chartDebug() {
            return isChartDebugLoggingEnabled();
        },
        set chartDebug(value: unknown) {
            setChartDebugLoggingEnabled(value === true);
        },
        get chartDebugVerbose() {
            return isChartVerboseDebugLoggingEnabled();
        },
        set chartDebugVerbose(value: unknown) {
            setChartVerboseDebugLoggingEnabled(value === true);
        },
        get chartFullscreenTrace() {
            return isChartFullscreenTraceEnabled();
        },
        set chartFullscreenTrace(value: unknown) {
            setChartFullscreenTraceEnabled(
                typeof value === "boolean" ? value : null
            );
        },
        debugState: () => {
            void logRendererDebugState(options);
        },
        getPerformanceMetrics: () => options.performanceMonitor.getMetrics(),
        getState: async () => getRendererStateRecord("getState", options),
        getStateHistory: async () =>
            getRendererStateRecord("getHistory", options),
        isOpeningFileRef: options.isOpeningFileRef,
        PerformanceMonitor: options.performanceMonitor,
        reinitialize: options.initializeApplication,
        get stateManager() {
            return getRendererStateManagerForDev(options);
        },
        validateDOM: options.validateDOMElements,
    };
}

async function callDebugCoreFunction(
    exportName: string,
    args: unknown[],
    options: RendererDevelopmentDebugGlobalsOptions
): Promise<unknown> {
    try {
        const coreModules = await options.ensureCoreModules();
        const debugFunction = coreModules[exportName];
        if (typeof debugFunction === "function") {
            return debugFunction(...args);
        }
    } catch {
        /* Ignore errors */
    }

    return undefined;
}

async function getRendererStateManagerForDev(
    options: RendererDevelopmentDebugGlobalsOptions
): Promise<unknown> {
    try {
        const coreModules = await options.ensureCoreModules();
        return coreModules["masterStateManager"];
    } catch {
        /* Ignore state manager access errors */
    }

    return undefined;
}

async function getRendererStateRecord(
    methodName: "getHistory" | "getState",
    options: RendererDevelopmentDebugGlobalsOptions
): Promise<unknown> {
    try {
        const coreModules = await options.ensureCoreModules();
        return callRecordMethod(coreModules["masterStateManager"], methodName);
    } catch {
        /* Ignore state access errors */
    }
    return undefined;
}

async function loadDevelopmentDebugUtilities(
    rendererDevTools: Record<string, unknown>,
    options: RendererDevelopmentDebugGlobalsOptions
): Promise<void> {
    try {
        try {
            const coreModules = await options.ensureCoreModules();
            if (coreModules["AppActions"] !== undefined) {
                rendererDevTools["AppActions"] = coreModules["AppActions"];
            }
            if (coreModules["uiStateManager"] !== undefined) {
                rendererDevTools["uiStateManager"] =
                    coreModules["uiStateManager"];
            }
        } catch {
            /* Ignore errors */
        }

        const {
                checkDataAvailability,
                debugSensorInfo,
                showDataKeys,
                showSensorNames,
                testManufacturerId,
                testProductId,
            } = await import("../utils/debug/debugSensorInfo.js"),
            { testFaveroCase, testFaveroStringCase, testNewFormatting } =
                await import("../utils/debug/debugChartFormatting.js");

        Reflect.set(options.scope ?? globalThis, "__sensorDebug", {
            checkDataAvailability,
            debugSensorInfo,
            showDataKeys,
            showSensorNames,
            testManufacturerId,
            testProductId,
        });

        Reflect.set(options.scope ?? globalThis, "__debugChartFormatting", {
            testFaveroCase,
            testFaveroStringCase,
            testNewFormatting,
        });

        logDevelopmentDebugCommands(options.logRenderer);
    } catch (error) {
        options.logRenderer(
            "warn",
            "[Renderer] Debug utilities failed to load:",
            getDebugErrorMessage(error)
        );
    }
}

async function logRendererDebugState(
    options: RendererDevelopmentDebugGlobalsOptions
): Promise<void> {
    try {
        const coreModules = await options.ensureCoreModules();
        options.logRenderer(
            "log",
            "Current State:",
            callRecordMethod(coreModules["masterStateManager"], "getState")
        );
        options.logRenderer(
            "log",
            "State History:",
            callRecordMethod(coreModules["masterStateManager"], "getHistory")
        );
        options.logRenderer(
            "log",
            "Active Subscriptions:",
            callRecordMethod(
                coreModules["masterStateManager"],
                "getSubscriptions"
            )
        );
    } catch {
        /* Ignore errors */
    }
}

function callRecordMethod(
    target: unknown,
    methodName: string,
    args: unknown[] = []
): unknown {
    const method = toModuleRecord(target)[methodName];
    if (typeof method !== "function") {
        return undefined;
    }

    const methodFn = method as (this: unknown, ...args: unknown[]) => unknown;
    return methodFn.apply(target, args);
}

function getDebugErrorMessage(errorLike: unknown): string {
    if (errorLike instanceof Error) {
        return errorLike.message;
    }

    if (typeof errorLike === "string") {
        return errorLike;
    }

    try {
        return JSON.stringify(errorLike);
    } catch {
        return String(errorLike);
    }
}

function getRecordBoolean(
    record: Record<string, unknown>,
    key: string
): boolean | undefined {
    const value = record[key];
    return typeof value === "boolean" ? value : undefined;
}

function getRecordNumber(
    record: Record<string, unknown>,
    key: string
): number | undefined {
    const value = record[key];
    return typeof value === "number" ? value : undefined;
}

function getRecordString(
    record: Record<string, unknown>,
    key: string
): string | undefined {
    const value = record[key];
    return typeof value === "string" ? value : undefined;
}

function getRuntimeInfo(): Record<string, unknown> {
    let cookieAvailability = false;
    try {
        const locationRecord = toModuleRecord(
            Reflect.get(globalThis, "location")
        );
        const protocol = getRecordString(locationRecord, "protocol") ?? "";

        if (protocol === "http:" || protocol === "https:") {
            const navigatorRecord = toModuleRecord(
                Reflect.get(globalThis, "navigator")
            );
            const cookieEnabled = getRecordBoolean(
                navigatorRecord,
                "cookieEnabled"
            );
            cookieAvailability = cookieEnabled ?? false;
        }
    } catch {
        cookieAvailability = false;
    }

    const navigatorRecord = toModuleRecord(
        Reflect.get(globalThis, "navigator")
    );
    const memoryRecord = toModuleRecord(
        toModuleRecord(Reflect.get(globalThis, "performance"))["memory"]
    );
    const memoryUsage =
        Object.keys(memoryRecord).length > 0
            ? {
                  jsHeapSizeLimit: getRecordNumber(
                      memoryRecord,
                      "jsHeapSizeLimit"
                  ),
                  totalJSHeapSize: getRecordNumber(
                      memoryRecord,
                      "totalJSHeapSize"
                  ),
                  usedJSHeapSize: getRecordNumber(
                      memoryRecord,
                      "usedJSHeapSize"
                  ),
              }
            : null;

    return {
        cookieEnabled: cookieAvailability,
        hardwareConcurrency: getRecordNumber(
            navigatorRecord,
            "hardwareConcurrency"
        ),
        language: getRecordString(navigatorRecord, "language"),
        memoryUsage,
        onLine: getRecordBoolean(navigatorRecord, "onLine"),
        platform: getRecordString(navigatorRecord, "platform"),
        userAgent: getRecordString(navigatorRecord, "userAgent"),
    };
}

function logDevelopmentDebugCommands(
    logRenderer: DevelopmentDebugLogger
): void {
    logRenderer("log", "🛠️  Debug utilities loaded!");
    logRenderer("log", "📊 Sensor Debug Commands:");
    logRenderer(
        "log",
        "  __sensorDebug.checkDataAvailability()     - Check if FIT data is loaded"
    );
    logRenderer(
        "log",
        "  __sensorDebug.debugSensorInfo()           - Full sensor analysis"
    );
    logRenderer(
        "log",
        "  __sensorDebug.debugSensorInfo(true)       - Verbose sensor analysis"
    );
    logRenderer(
        "log",
        "  __sensorDebug.showSensorNames()           - Quick sensor name list"
    );
    logRenderer(
        "log",
        "  __sensorDebug.testManufacturerId(269)     - Test manufacturer ID (e.g., Favero)"
    );
    logRenderer(
        "log",
        "  __sensorDebug.testProductId(269, 12)      - Test product ID (e.g., Favero assioma_duo)"
    );
    logRenderer(
        "log",
        "  __sensorDebug.showDataKeys()              - Show all available data keys"
    );
    logRenderer("log", "");
    logRenderer("log", "🧪 Format Testing Commands:");
    logRenderer(
        "log",
        "  __debugChartFormatting.testNewFormatting()      - Test all formatting scenarios"
    );
    logRenderer(
        "log",
        "  __debugChartFormatting.testFaveroCase()         - Test the specific Favero case"
    );
    logRenderer(
        "log",
        "  __debugChartFormatting.testFaveroStringCase()   - Test Favero with string manufacturer name"
    );
    logRenderer("log", "");
    logRenderer("log", "🏗️  State Management Debug Commands:");
    logRenderer(
        "log",
        "  __renderer_dev.debugState()               - Show current state and history"
    );
    logRenderer(
        "log",
        "  __renderer_dev.getState()                 - Get current application state"
    );
    logRenderer(
        "log",
        "  __renderer_dev.getStateHistory()          - Get state change history"
    );
    logRenderer(
        "log",
        "  __renderer_dev.stateManager               - Access state manager directly"
    );
    logRenderer(
        "log",
        "  __renderer_dev.AppActions                 - Access app actions"
    );
    logRenderer(
        "log",
        "  __renderer_dev.uiStateManager             - Access UI state manager"
    );
}

function toModuleRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : {};
}

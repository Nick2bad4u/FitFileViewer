import type { RendererPerformanceMonitor } from "./startupPerformanceMonitor.js";
import type { AppActions } from "../utils/app/lifecycle/appActions.js";
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
import {
    getRendererDevelopmentDebugToolsRuntime,
    type RendererDevelopmentDebugToolsRuntime,
    type RendererDevelopmentPerformanceMemorySnapshot,
} from "./developmentDebugToolsRuntime.js";
import type { RendererFileOpeningStateRef } from "./stateManagerStartup.js";

type DevelopmentDebugLogLevel = "log" | "warn";
type DevelopmentDebugLogger = (
    level: DevelopmentDebugLogLevel,
    ...args: unknown[]
) => void;
type DevelopmentDebugCoreFunctionName =
    | "handleOpenFile"
    | "setupTheme"
    | "showAboutModal"
    | "showNotification"
    | "showUpdateNotification";
type DevelopmentStateManagerMethodName =
    | "getHistory"
    | "getState"
    | "getSubscriptions";
type DevelopmentStateManagerMethod = (this: unknown) => unknown;
type RendererDevelopmentDebugStateManager = Readonly<
    Partial<
        Record<DevelopmentStateManagerMethodName, DevelopmentStateManagerMethod>
    >
>;

type RendererDebugCoreFunction = (...args: never[]) => unknown;
type RendererDebugCoreFunctionCaller = (...args: unknown[]) => unknown;
type RendererDevelopmentDebugFunctionModules = {
    readonly [Name in DevelopmentDebugCoreFunctionName]?:
        | RendererDebugCoreFunction
        | undefined;
};
type RendererDevelopmentDebugAppActions = Readonly<{
    readonly setInitialized: typeof AppActions.setInitialized;
}>;
type RendererDevelopmentDebugStateModules = {
    readonly AppActions?: RendererDevelopmentDebugAppActions | undefined;
    readonly masterStateManager?: unknown;
    readonly uiStateManager?: unknown;
};
type RendererDevelopmentDebugStateManagerCandidate = {
    readonly getHistory?: unknown;
    readonly getState?: unknown;
    readonly getSubscriptions?: unknown;
};
export type RendererDevelopmentDebugCoreModules = Readonly<
    RendererDevelopmentDebugFunctionModules &
        RendererDevelopmentDebugStateModules
>;
type DevelopmentCoreModuleResolver =
    () => Promise<RendererDevelopmentDebugCoreModules>;
type RendererDebugToolCall = (...args: unknown[]) => Promise<unknown>;
type RendererDebugToolsView = {
    readonly handleOpenFile: RendererDebugToolCall;
    readonly PerformanceMonitor: RendererPerformanceMonitor;
    readonly setupTheme: RendererDebugToolCall;
    readonly showAboutModal: RendererDebugToolCall;
    readonly showNotification: RendererDebugToolCall;
    readonly showUpdateNotification: RendererDebugToolCall;
};
type RendererDebugUtilityGroup = Record<string, unknown>;
export type RendererDevelopmentRuntimeMemoryUsage = Readonly<{
    readonly jsHeapSizeLimit: number | undefined;
    readonly totalJSHeapSize: number | undefined;
    readonly usedJSHeapSize: number | undefined;
}>;
export type RendererDevelopmentRuntimeInfo = Readonly<{
    readonly cookieEnabled: boolean;
    readonly hardwareConcurrency: number | undefined;
    readonly language: string | undefined;
    readonly memoryUsage: RendererDevelopmentRuntimeMemoryUsage | null;
    readonly onLine: boolean | undefined;
    readonly platform: string | undefined;
    readonly userAgent: string | undefined;
}>;
type RendererDevToolsView = {
    APP_INFO: typeof APP_INFO;
    AppActions?: RendererDevelopmentDebugAppActions;
    cleanup: () => void;
    chartDebug: boolean;
    chartDebugVerbose: boolean;
    chartFullscreenTrace: boolean | string;
    debug: boolean;
    debugChartFormatting?: RendererDebugUtilityGroup;
    debugState: () => void;
    getPerformanceMetrics: () => Record<string, number>;
    getState: () => Promise<unknown>;
    getStateHistory: () => Promise<unknown>;
    isOpeningFileRef: RendererFileOpeningStateRef;
    PerformanceMonitor: RendererPerformanceMonitor;
    reinitialize: () => Promise<void>;
    sensorDebug?: RendererDebugUtilityGroup;
    readonly stateManager: Promise<unknown>;
    uiStateManager?: unknown;
    validateDOM: () => boolean;
};
type RendererDevelopmentDebugTools = {
    readonly rendererDebug: RendererDebugToolsView;
    readonly rendererDev: RendererDevToolsView;
};

interface RendererDevelopmentDebugToolsOptions {
    cleanup: () => void;
    ensureCoreModules: DevelopmentCoreModuleResolver;
    initializeApplication: () => Promise<void>;
    isDevelopmentMode: () => boolean;
    isOpeningFileRef: RendererFileOpeningStateRef;
    logRenderer: DevelopmentDebugLogger;
    performanceMonitor: RendererPerformanceMonitor;
    validateDOMElements: () => boolean;
}

const APP_INFO = {
    author: "FIT File Viewer Team",
    description: "Advanced FIT file analysis and visualization tool",
    getRuntimeInfo: getRendererDevelopmentRuntimeInfo,
    license: "MIT",
    name: "FIT File Viewer",
    repository: "https://github.com/user/FitFileViewer",
    version: "21.1.0",
};

export { APP_INFO };

let latestRendererDevelopmentDebugTools: RendererDevelopmentDebugTools | null =
    null;

export function createRendererDevelopmentDebugTools(
    options: RendererDevelopmentDebugToolsOptions
): RendererDevelopmentDebugTools | null {
    if (!options.isDevelopmentMode()) {
        latestRendererDevelopmentDebugTools = null;
        return null;
    }

    const rendererDebugTools = createRendererDebugTools(options);
    const rendererDevTools = createRendererDevTools(options);
    const debugTools = {
        rendererDebug: rendererDebugTools,
        rendererDev: rendererDevTools,
    };
    latestRendererDevelopmentDebugTools = debugTools;

    void loadDevelopmentDebugUtilities(rendererDevTools, options);

    options.logRenderer("log", "[Renderer] Development utilities initialized");
    options.logRenderer(
        "log",
        "[Renderer] Performance metrics:",
        options.performanceMonitor.getMetrics()
    );

    return debugTools;
}

export function getRendererDevelopmentDebugToolsForTests(): RendererDevelopmentDebugTools | null {
    return latestRendererDevelopmentDebugTools;
}

function createRendererDebugTools(
    options: RendererDevelopmentDebugToolsOptions
): RendererDebugToolsView {
    const createDebugFunction =
        (exportName: DevelopmentDebugCoreFunctionName) =>
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
    options: RendererDevelopmentDebugToolsOptions
): RendererDevToolsView {
    return {
        APP_INFO,
        cleanup: options.cleanup,
        get debug() {
            return isRendererDebugLoggingEnabled();
        },
        set debug(value: boolean) {
            setRendererDebugLoggingEnabled(value);
        },
        get chartDebug() {
            return isChartDebugLoggingEnabled();
        },
        set chartDebug(value: boolean) {
            setChartDebugLoggingEnabled(value);
        },
        get chartDebugVerbose() {
            return isChartVerboseDebugLoggingEnabled();
        },
        set chartDebugVerbose(value: boolean) {
            setChartVerboseDebugLoggingEnabled(value);
        },
        get chartFullscreenTrace() {
            return isChartFullscreenTraceEnabled();
        },
        set chartFullscreenTrace(value: boolean | string) {
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
    exportName: DevelopmentDebugCoreFunctionName,
    args: unknown[],
    options: RendererDevelopmentDebugToolsOptions
): Promise<unknown> {
    try {
        const coreModules = await options.ensureCoreModules();
        const debugFunction = getDebugCoreFunction(coreModules, exportName);
        if (debugFunction !== undefined) {
            return debugFunction(...args);
        }
    } catch {
        /* Ignore errors */
    }

    return undefined;
}

async function getRendererStateManagerForDev(
    options: RendererDevelopmentDebugToolsOptions
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
    options: RendererDevelopmentDebugToolsOptions
): Promise<unknown> {
    try {
        const coreModules = await options.ensureCoreModules();
        return callStateManagerMethod(
            coreModules.masterStateManager,
            methodName
        );
    } catch {
        /* Ignore state access errors */
    }
    return undefined;
}

async function loadDevelopmentDebugUtilities(
    rendererDevTools: RendererDevToolsView,
    options: RendererDevelopmentDebugToolsOptions
): Promise<void> {
    try {
        try {
            const coreModules = await options.ensureCoreModules();
            if (coreModules.AppActions !== undefined) {
                rendererDevTools.AppActions = coreModules.AppActions;
            }
            if (coreModules.uiStateManager !== undefined) {
                rendererDevTools.uiStateManager = coreModules.uiStateManager;
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

        rendererDevTools.sensorDebug = {
            checkDataAvailability,
            debugSensorInfo,
            showDataKeys,
            showSensorNames,
            testManufacturerId,
            testProductId,
        };

        rendererDevTools.debugChartFormatting = {
            testFaveroCase,
            testFaveroStringCase,
            testNewFormatting,
        };

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
    options: RendererDevelopmentDebugToolsOptions
): Promise<void> {
    try {
        const coreModules = await options.ensureCoreModules();
        options.logRenderer(
            "log",
            "Current State:",
            callStateManagerMethod(coreModules.masterStateManager, "getState")
        );
        options.logRenderer(
            "log",
            "State History:",
            callStateManagerMethod(coreModules.masterStateManager, "getHistory")
        );
        options.logRenderer(
            "log",
            "Active Subscriptions:",
            callStateManagerMethod(
                coreModules.masterStateManager,
                "getSubscriptions"
            )
        );
    } catch {
        /* Ignore errors */
    }
}

function callStateManagerMethod(
    target: unknown,
    methodName: DevelopmentStateManagerMethodName
): unknown {
    const stateManager = toRendererDevelopmentDebugStateManager(target);
    if (stateManager === undefined) {
        return undefined;
    }

    return stateManager[methodName]?.call(target);
}

function getDebugCoreFunction(
    coreModules: RendererDevelopmentDebugCoreModules,
    exportName: DevelopmentDebugCoreFunctionName
): RendererDebugCoreFunctionCaller | undefined {
    const debugFunction = coreModules[exportName];
    return typeof debugFunction === "function"
        ? (...args: unknown[]) => Reflect.apply(debugFunction, undefined, args)
        : undefined;
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

function toRendererDevelopmentDebugStateManager(
    value: unknown
): RendererDevelopmentDebugStateManager | undefined {
    if (typeof value !== "object" || value === null) {
        return undefined;
    }

    const candidate = value as RendererDevelopmentDebugStateManagerCandidate;
    const stateManager: Partial<
        Record<DevelopmentStateManagerMethodName, DevelopmentStateManagerMethod>
    > = {};
    if (isDevelopmentStateManagerMethod(candidate.getHistory)) {
        stateManager.getHistory = candidate.getHistory;
    }
    if (isDevelopmentStateManagerMethod(candidate.getState)) {
        stateManager.getState = candidate.getState;
    }
    if (isDevelopmentStateManagerMethod(candidate.getSubscriptions)) {
        stateManager.getSubscriptions = candidate.getSubscriptions;
    }

    return Object.keys(stateManager).length === 0 ? undefined : stateManager;
}

function isDevelopmentStateManagerMethod(
    value: unknown
): value is DevelopmentStateManagerMethod {
    return typeof value === "function";
}

export function getRendererDevelopmentRuntimeInfo(
    runtime: RendererDevelopmentDebugToolsRuntime = getRendererDevelopmentDebugToolsRuntime()
): RendererDevelopmentRuntimeInfo {
    let cookieAvailability = false;
    try {
        const locationSnapshot = runtime.getLocationSnapshot();
        const protocol = locationSnapshot.protocol ?? "";

        if (protocol === "http:" || protocol === "https:") {
            const navigatorSnapshot = runtime.getNavigatorSnapshot();
            const cookieEnabled = navigatorSnapshot.cookieEnabled;
            cookieAvailability = cookieEnabled ?? false;
        }
    } catch {
        cookieAvailability = false;
    }

    const navigatorSnapshot = runtime.getNavigatorSnapshot();
    const memorySnapshot = runtime.getPerformanceMemorySnapshot();
    const memoryUsage = hasDevelopmentRuntimeMemory(memorySnapshot)
        ? {
              jsHeapSizeLimit: memorySnapshot.jsHeapSizeLimit,
              totalJSHeapSize: memorySnapshot.totalJSHeapSize,
              usedJSHeapSize: memorySnapshot.usedJSHeapSize,
          }
        : null;

    return {
        cookieEnabled: cookieAvailability,
        hardwareConcurrency: navigatorSnapshot.hardwareConcurrency,
        language: navigatorSnapshot.language,
        memoryUsage,
        onLine: navigatorSnapshot.onLine,
        platform: navigatorSnapshot.platform,
        userAgent: navigatorSnapshot.userAgent,
    };
}

function hasDevelopmentRuntimeMemory(
    memorySnapshot: RendererDevelopmentPerformanceMemorySnapshot
): boolean {
    return (
        memorySnapshot.jsHeapSizeLimit !== undefined ||
        memorySnapshot.totalJSHeapSize !== undefined ||
        memorySnapshot.usedJSHeapSize !== undefined
    );
}

function logDevelopmentDebugCommands(
    logRenderer: DevelopmentDebugLogger
): void {
    logRenderer("log", "Renderer development debug utilities loaded");
}

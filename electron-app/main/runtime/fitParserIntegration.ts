import { CONSTANTS } from "../constants.js";
import { logWithContext } from "../logging/logWithContext.js";
import { mainProcessState as runtimeMainProcessState } from "../../utils/state/integration/mainProcessStateManager.js";
import { createElectronConf } from "./electronConfAccess.js";
import {
    getFitParserIntegrationRuntime,
    type FitParserIntegrationRuntime,
} from "./fitParserIntegrationRuntime.js";
import { getFitParserModule } from "./fitParserFacade.js";

type DecoderOptions = import("../../shared/fit").DecoderOptions;
type FitFileStateManager = import("../../shared/fitParser").FitFileStateManager;
type FitParserStateManagers =
    import("../../shared/fitParser").FitParserStateManagers;
type PerformanceMonitor = import("../../shared/fitParser").PerformanceMonitor;
type SettingsStateManager =
    import("../../shared/fitParser").SettingsStateManager;
interface FitParserSettingsConf {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
}

interface MainProcessStateLike {
    completeOperation: (
        operationId: string,
        result?: Record<string, unknown>
    ) => void;
    failOperation: (operationId: string, error: unknown) => void;
    get: (statePath: string) => unknown;
    recordMetric: (
        metricName: string,
        value: number,
        metadata?: Record<string, unknown>
    ) => void;
    set: (
        statePath: string,
        value: unknown,
        options?: Record<string, unknown>
    ) => void;
    startOperation: (
        operationId: string,
        operationData?: Record<string, unknown>
    ) => void;
    updateOperation: (
        operationId: string,
        updates: Record<string, unknown>
    ) => void;
}

interface FitParserStateAdapters {
    fitFileStateManager: FitFileStateManager;
    performanceMonitor: PerformanceMonitor;
    settingsStateManager: SettingsStateManager;
}

type TimerState = {
    duration: number | null;
    start: number;
};

const mainProcessState = runtimeMainProcessState as MainProcessStateLike;

export const FIT_PARSER_OPERATION_ID = "fitFile:decode" as const;
let fitParserSettingsConf: FitParserSettingsConf | null | undefined;
let fitParserStateAdaptersOverride: FitParserStateManagers | null = null;
let fitParserStateIntegrationPromise: Promise<void> | null = null;

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : "Unknown error";

function fitParserIntegrationRuntime(): FitParserIntegrationRuntime {
    return getFitParserIntegrationRuntime();
}

function isFitParserStateManagers(
    value: unknown
): value is FitParserStateManagers {
    return Boolean(value && typeof value === "object");
}

function getFitParserStateAdaptersOverride(): FitParserStateManagers | null {
    return isFitParserStateManagers(fitParserStateAdaptersOverride)
        ? fitParserStateAdaptersOverride
        : null;
}

function now(): number {
    return fitParserIntegrationRuntime().monotonicNowMs();
}

function resolveFitParserSettingsConf(): FitParserSettingsConf | null {
    if (fitParserSettingsConf !== undefined) {
        return fitParserSettingsConf;
    }

    try {
        fitParserSettingsConf = createElectronConf<FitParserSettingsConf>({
            name: CONSTANTS.SETTINGS_CONFIG_NAME,
        });
    } catch {
        fitParserSettingsConf = null;
    }

    return fitParserSettingsConf;
}

export function resetFitParserStateIntegrationForTests(): void {
    fitParserStateAdaptersOverride = null;
    fitParserStateIntegrationPromise = null;
}

export function setFitParserStateAdaptersOverrideForTests(
    override: FitParserStateManagers | null | undefined
): void {
    fitParserStateAdaptersOverride = override ?? null;
    fitParserStateIntegrationPromise = null;
}

function ensureOperationStarted(): void {
    try {
        if (mainProcessState.get(`operations.${FIT_PARSER_OPERATION_ID}`)) {
            return;
        }

        mainProcessState.startOperation(FIT_PARSER_OPERATION_ID, {
            message: "Decoding FIT file",
            metadata: { source: "fitParser" },
        });
    } catch (error) {
        logWithContext(
            "warn",
            "Unable to start fit parser operation tracking",
            {
                error: getErrorMessage(error),
            }
        );
    }
}

function getMessageRecordCandidates(messages: object): unknown {
    if ("recordMesgs" in messages) {
        return messages.recordMesgs;
    }

    return "records" in messages ? messages.records : undefined;
}

function getArrayLikeLength(value: unknown): number | null {
    if (!value || typeof value !== "object" || !("length" in value)) {
        return null;
    }

    return typeof value.length === "number" ? Number(value.length) || 0 : null;
}

function initializeFitParserStateIntegration(): void {
    try {
        const fitParser = getFitParserModule();
        if (
            !fitParser ||
            typeof fitParser.initializeStateManagement !== "function"
        ) {
            return;
        }

        const adapters =
            getFitParserStateAdaptersOverride() ??
            createFitParserStateAdapters();
        fitParser.initializeStateManagement(adapters);

        logWithContext("info", "Fit parser state management initialized");
    } catch (error) {
        logWithContext("warn", "Skipping fit parser state integration", {
            error: getErrorMessage(error),
        });
    }
}

/**
 * Builds the adapter collection consumed by the fit parser's state integration
 * layer.
 */
export function createFitParserStateAdapters(): FitParserStateAdapters {
    const timers = new Map<string, TimerState>();

    const fitFileStateManager: FitFileStateManager = {
        getRecordCount(messages) {
            if (!messages || typeof messages !== "object") {
                return 0;
            }

            const recordCandidates = getMessageRecordCandidates(messages);

            if (Array.isArray(recordCandidates)) {
                return recordCandidates.length;
            }

            const arrayLikeLength = getArrayLikeLength(recordCandidates);
            if (arrayLikeLength !== null) {
                return arrayLikeLength;
            }

            return 0;
        },
        handleFileLoaded(payload) {
            ensureOperationStarted();

            try {
                mainProcessState.updateOperation(FIT_PARSER_OPERATION_ID, {
                    progress: 100,
                    status: "running",
                });
                mainProcessState.completeOperation(FIT_PARSER_OPERATION_ID, {
                    metadata: payload?.metadata || null,
                });
            } catch (completeError) {
                logWithContext(
                    "warn",
                    "Failed to mark fit parser operation complete",
                    {
                        error: getErrorMessage(completeError),
                    }
                );
            }

            try {
                mainProcessState.set(
                    "fitFile.lastResult",
                    {
                        metadata: payload?.metadata || null,
                        timestamp: fitParserIntegrationRuntime().dateNow(),
                    },
                    { source: "fitParser" }
                );
            } catch (stateError) {
                logWithContext(
                    "warn",
                    "Failed to persist fit parser metadata to state",
                    {
                        error: getErrorMessage(stateError),
                    }
                );
            }
        },
        handleFileLoadingError(error) {
            ensureOperationStarted();

            try {
                mainProcessState.failOperation(FIT_PARSER_OPERATION_ID, error);
            } catch (failError) {
                logWithContext("warn", "Failed to record fit parser error", {
                    error: getErrorMessage(failError),
                });
            }
        },
        updateLoadingProgress(progress) {
            ensureOperationStarted();

            try {
                const numeric = Number(progress);
                const clamped = Number.isFinite(numeric)
                    ? Math.max(0, Math.min(100, numeric))
                    : 0;
                mainProcessState.updateOperation(FIT_PARSER_OPERATION_ID, {
                    progress: clamped,
                    status: "running",
                });
            } catch (error) {
                logWithContext("warn", "Failed to update fit parser progress", {
                    error: getErrorMessage(error),
                });
            }
        },
    };

    const settingsStateManager: SettingsStateManager = {
        getCategory(category) {
            if (!category) {
                return null;
            }

            try {
                const stateValue = mainProcessState.get(`settings.${category}`);
                if (stateValue !== undefined && stateValue !== null) {
                    return stateValue;
                }
            } catch {
                /* ignore state read errors */
            }

            if (category === "decoder") {
                const conf = resolveFitParserSettingsConf();
                if (conf && typeof conf.get === "function") {
                    try {
                        return conf.get(
                            "decoderOptions"
                        ) as Partial<DecoderOptions>;
                    } catch {
                        /* ignore conf read errors */
                    }
                }
            }

            return null;
        },
        updateCategory(category, value, options = {}) {
            if (!category) {
                return;
            }

            try {
                mainProcessState.set(`settings.${category}`, value, {
                    source: "fitParser",
                    ...(options && typeof options === "object" ? options : {}),
                });
            } catch (error) {
                logWithContext(
                    "warn",
                    "Failed to update settings in main process state",
                    {
                        category,
                        error: getErrorMessage(error),
                    }
                );
            }

            if (category === "decoder") {
                const conf = resolveFitParserSettingsConf();
                if (conf && typeof conf.set === "function") {
                    try {
                        conf.set("decoderOptions", value);
                    } catch (confError) {
                        logWithContext(
                            "warn",
                            "Failed to persist decoder settings to configuration store",
                            {
                                error: getErrorMessage(confError),
                            }
                        );
                    }
                }
            }
        },
    };

    const performanceMonitor: PerformanceMonitor = {
        isEnabled: true,
        endTimer(operationId) {
            if (!operationId) {
                return null;
            }

            const timer = timers.get(operationId);
            if (!timer) {
                return null;
            }

            timer.duration = now() - timer.start;
            timers.set(operationId, timer);

            try {
                mainProcessState.recordMetric(operationId, timer.duration, {
                    source: "fitParser",
                });
            } catch {
                /* ignore metric errors */
            }

            return timer.duration;
        },
        getOperationTime(operationId) {
            const timer = operationId ? timers.get(operationId) : null;
            if (!timer) {
                return null;
            }

            if (typeof timer.duration === "number") {
                return timer.duration;
            }

            return now() - timer.start;
        },
        startTimer(operationId) {
            if (!operationId) {
                return;
            }

            timers.set(operationId, { duration: null, start: now() });
        },
    };

    return {
        fitFileStateManager,
        performanceMonitor,
        settingsStateManager,
    };
}

/**
 * Ensures that fit parser state integration has executed once. Subsequent calls
 * reuse the same promise to avoid re-registering identical adapters.
 */
export async function ensureFitParserStateIntegration(): Promise<void> {
    if (fitParserStateIntegrationPromise) {
        return fitParserStateIntegrationPromise;
    }

    fitParserStateIntegrationPromise = Promise.resolve(
        initializeFitParserStateIntegration()
    );

    return fitParserStateIntegrationPromise;
}

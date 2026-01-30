const { logWithContext } = require("../logging/logWithContext");
const {
    mainProcessState,
    resolveFitParserSettingsConf,
} = require("../state/appState");

const FIT_PARSER_OPERATION_ID = "fitFile:decode";
/** @type {Promise<void> | null} */
let fitParserStateIntegrationPromise = null;

if (
    typeof process !== "undefined" &&
    process.env &&
    /** @type {any} */ (process.env).NODE_ENV === "test" &&
    typeof globalThis !== "undefined"
) {
    Object.defineProperty(
        globalThis,
        "__resetFitParserStateIntegrationForTests",
        {
            configurable: true,
            value: () => {
                fitParserStateIntegrationPromise = null;
            },
        }
    );
}

/**
 * Builds the adapter collection consumed by the fit parser's state integration
 * layer.
 *
 * @returns {{
 *     fitFileStateManager: {
 *         updateLoadingProgress(progress: number): void;
 *         handleFileLoadingError(error: Error): void;
 *         handleFileLoaded(payload: any): void;
 *         getRecordCount(messages: any): number;
 *     };
 *     performanceMonitor: {
 *         isEnabled: boolean;
 *         startTimer(id: string): void;
 *         endTimer(id: string): number | null;
 *         getOperationTime(id: string): number | null;
 *     };
 *     settingsStateManager: {
 *         getCategory(category: string): any;
 *         updateCategory(category: string, value: any, options?: Record<string, unknown>): void;
 *     };
 * }}
 *   Adapter contract wired to mainProcessState.
 */
function createFitParserStateAdapters() {
    /** @type {Map<string, { start: number; duration: number | null }>} */
    const timers = new Map();
    const now = () =>
        typeof performance !== "undefined" &&
        performance &&
        typeof performance.now === "function"
            ? performance.now()
            : Date.now();

    const ensureOperationStarted = () => {
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
                    error: /** @type {Error} */ (error)?.message,
                }
            );
        }
    };

    const fitFileStateManager = {
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
                    error: /** @type {Error} */ (error)?.message,
                });
            }
        },
        handleFileLoadingError(error) {
            ensureOperationStarted();

            try {
                mainProcessState.failOperation(FIT_PARSER_OPERATION_ID, error);
            } catch (failError) {
                logWithContext("warn", "Failed to record fit parser error", {
                    error: /** @type {Error} */ (failError)?.message,
                });
            }
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
                        error: /** @type {Error} */ (completeError)?.message,
                    }
                );
            }

            try {
                mainProcessState.set(
                    "fitFile.lastResult",
                    {
                        metadata: payload?.metadata || null,
                        timestamp: Date.now(),
                    },
                    { source: "fitParser" }
                );
            } catch (stateError) {
                logWithContext(
                    "warn",
                    "Failed to persist fit parser metadata to state",
                    {
                        error: /** @type {Error} */ (stateError)?.message,
                    }
                );
            }
        },
        getRecordCount(messages) {
            if (!messages || typeof messages !== "object") {
                return 0;
            }

            const recordCandidates =
                /** @type {any} */ (messages).recordMesgs ||
                /** @type {any} */ (messages).records;

            if (Array.isArray(recordCandidates)) {
                return recordCandidates.length;
            }

            if (
                recordCandidates &&
                typeof recordCandidates.length === "number"
            ) {
                return Number(recordCandidates.length) || 0;
            }

            return 0;
        },
    };

    const settingsStateManager = {
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
                        return conf.get("decoderOptions");
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
                        error: /** @type {Error} */ (error)?.message,
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
                                error: /** @type {Error} */ (confError)
                                    ?.message,
                            }
                        );
                    }
                }
            }
        },
    };

    const performanceMonitor = {
        isEnabled: true,
        startTimer(operationId) {
            if (!operationId) {
                return;
            }

            timers.set(operationId, { duration: null, start: now() });
        },
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
    };

    return { fitFileStateManager, performanceMonitor, settingsStateManager };
}

/**
 * Ensures that fit parser state integration has executed once. Subsequent calls
 * reuse the same promise to avoid re-registering identical adapters.
 *
 * @returns {Promise<void>} Initialization guard promise.
 */
async function ensureFitParserStateIntegration() {
    if (fitParserStateIntegrationPromise) {
        return fitParserStateIntegrationPromise;
    }

    fitParserStateIntegrationPromise = (async () => {
        try {
            const fitParser = require("../../fitParser");
            if (
                !fitParser ||
                typeof fitParser.initializeStateManagement !== "function"
            ) {
                return;
            }

            /**
             * @type {{
             *     fitFileStateManager?: any;
             *     settingsStateManager?: any;
             *     performanceMonitor?: any;
             * } | null}
             */
            const override =
                typeof globalThis !== "undefined" &&
                /** @type {any} */ (globalThis).__fitParserStateAdaptersOverride
                    ? /** @type {any} */ (globalThis)
                          .__fitParserStateAdaptersOverride
                    : null;

            const adapters = override || createFitParserStateAdapters();
            fitParser.initializeStateManagement(adapters);

            logWithContext("info", "Fit parser state management initialized");
        } catch (error) {
            logWithContext("warn", "Skipping fit parser state integration", {
                error: /** @type {Error} */ (error)?.message,
            });
        }
    })();

    return fitParserStateIntegrationPromise;
}

module.exports = {
    FIT_PARSER_OPERATION_ID,
    createFitParserStateAdapters,
    ensureFitParserStateIntegration,
};

"use strict";
{
    const { logWithContext } = require("../logging/logWithContext");
    const {
        mainProcessState,
        resolveFitParserSettingsConf,
    } = require("../state/appState");
    const FIT_PARSER_OPERATION_ID = "fitFile:decode";
    let fitParserStateIntegrationPromise = null;
    if (
        typeof process !== "undefined" &&
        process.env &&
        process.env["NODE_ENV"] === "test" &&
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
    const getErrorMessage = (error) =>
        error instanceof Error ? error.message : "Unknown error";
    function isFitParserStateManagers(value) {
        return Boolean(value && typeof value === "object");
    }
    function getFitParserStateAdaptersOverride() {
        if (typeof globalThis === "undefined") {
            return null;
        }
        const candidate = globalThis.__fitParserStateAdaptersOverride;
        return isFitParserStateManagers(candidate) ? candidate : null;
    }
    /**
     * Builds the adapter collection consumed by the fit parser's state
     * integration layer.
     */
    function createFitParserStateAdapters() {
        const timers = new Map();
        const now = () =>
            typeof performance !== "undefined" &&
            performance &&
            typeof performance.now === "function"
                ? performance.now()
                : Date.now();
        const ensureOperationStarted = () => {
            try {
                if (
                    mainProcessState.get(
                        `operations.${FIT_PARSER_OPERATION_ID}`
                    )
                ) {
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
        };
        const getMessageRecordCandidates = (messages) => {
            if ("recordMesgs" in messages) {
                return messages.recordMesgs;
            }
            return "records" in messages ? messages.records : undefined;
        };
        const getArrayLikeLength = (value) => {
            if (!value || typeof value !== "object" || !("length" in value)) {
                return null;
            }
            return typeof value.length === "number"
                ? Number(value.length) || 0
                : null;
        };
        const fitFileStateManager = {
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
                    mainProcessState.completeOperation(
                        FIT_PARSER_OPERATION_ID,
                        {
                            metadata: payload?.metadata || null,
                        }
                    );
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
                            timestamp: Date.now(),
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
                    mainProcessState.failOperation(
                        FIT_PARSER_OPERATION_ID,
                        error
                    );
                } catch (failError) {
                    logWithContext(
                        "warn",
                        "Failed to record fit parser error",
                        {
                            error: getErrorMessage(failError),
                        }
                    );
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
                    logWithContext(
                        "warn",
                        "Failed to update fit parser progress",
                        {
                            error: getErrorMessage(error),
                        }
                    );
                }
            },
        };
        const settingsStateManager = {
            getCategory(category) {
                if (!category) {
                    return null;
                }
                try {
                    const stateValue = mainProcessState.get(
                        `settings.${category}`
                    );
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
                        ...(options && typeof options === "object"
                            ? options
                            : {}),
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
        const performanceMonitor = {
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
     * Ensures that fit parser state integration has executed once. Subsequent
     * calls reuse the same promise to avoid re-registering identical adapters.
     */
    async function ensureFitParserStateIntegration() {
        if (fitParserStateIntegrationPromise) {
            return fitParserStateIntegrationPromise;
        }
        fitParserStateIntegrationPromise = (async () => {
            try {
                const { getFitParserModule } = require("./fitParserFacade");
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
                logWithContext(
                    "info",
                    "Fit parser state management initialized"
                );
            } catch (error) {
                logWithContext(
                    "warn",
                    "Skipping fit parser state integration",
                    {
                        error: getErrorMessage(error),
                    }
                );
            }
        })();
        return fitParserStateIntegrationPromise;
    }
    module.exports = {
        FIT_PARSER_OPERATION_ID,
        createFitParserStateAdapters,
        ensureFitParserStateIntegration,
    };
}

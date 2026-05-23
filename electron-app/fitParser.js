/**
 * Decodes FIT files using Garmin SDK with integrated state management for
 * progress tracking, error handling, and settings persistence through injected
 * state adapters.
 *
 * @version 2.0.0
 *
 * @file FIT File Parser with State Management Integration
 *
 * @author FitFileViewer Development Team
 */

const { Buffer } = require("node:buffer");
/**
 * # ============================= Typedef Section =============================
 *
 * The project (allowJs + checkJs). They intentionally model only the pieces of
 * each object this module relies on so we can progressively enrich them without
 * over‑committing to full shapes up front.
 */

/**
 * @typedef {import("./shared/fit").DecoderOptions} DecoderOptions
 *
 * @typedef {import("./shared/fit").DecoderOptionsValidationResult} DecoderOptionsValidationResult
 *
 * @typedef {import("./shared/fit").FitDecodeErrorPayload} FitDecodeErrorPayload
 *
 * @typedef {import("./shared/fit").FitDecodeMetadata} FitDecodeMetadata
 *
 * @typedef {import("./shared/fit").FitDecodeResult} FitDecodeResult
 *
 * @typedef {import("./shared/fit").FitFieldValue} FitFieldValue
 *
 * @typedef {import("./shared/fit").FitFileLoadedPayload} FitFileLoadedPayload
 *
 * @typedef {import("./shared/fit").FitMessageRow} FitMessageRow
 *
 * @typedef {import("./shared/fit").FitMessages} FitMessages
 *
 * @typedef {import("./shared/fitSdk").FitSdkModule} FitSdkModule
 *
 * @typedef {import("./shared/fitSdk").FitSdkReadResult} FitSdkReadResult
 *
 * @typedef {import("./shared/fitSdk").FitSdkReadOptions & {
 *     filePath?: unknown;
 * }} FitParserReadOptions
 */

/**
 * @typedef {Object} SettingsStateManager
 *
 * @property {(category: string) => Partial<DecoderOptions> | null | undefined} getCategory
 *   Retrieve a settings category
 * @property {(
 *     category: string,
 *     value: Partial<DecoderOptions>,
 *     opts?: { silent?: boolean; source?: string }
 * ) => void} updateCategory
 *   Update a settings category
 */

/**
 * @typedef {Object} FitFileStateManager
 *
 * @property {(progress: number) => void} updateLoadingProgress Update decode
 *   progress percentage
 * @property {(error: Error) => void} handleFileLoadingError Record a loading
 *   error
 * @property {(payload: FitFileLoadedPayload) => void} handleFileLoaded Record
 *   successful load
 * @property {(messages: FitMessages) => number} getRecordCount Derive record
 *   count for metadata
 */

/**
 * @typedef {Object} PerformanceMonitor
 *
 * @property {(id: string) => void} startTimer Start a named timing operation
 * @property {(id: string) => void} endTimer End a named timing operation
 * @property {(id: string) => number | null} getOperationTime Get elapsed ms
 * @property {boolean} [isEnabled] Optional flag for enablement
 */

/**
 * @typedef {Object} DecoderOptionSchemaEntry
 *
 * @property {"boolean"} type Primitive type expected (only boolean currently)
 * @property {boolean} default Default value
 * @property {string} description Human readable description
 */

/**
 * @typedef {Object} UnknownMessageMapping
 *
 * @property {string} name Canonical label to replace unknown_xxx key
 * @property {string[]} fields Ordered field labels for generic mapping path
 */

/**
 * @typedef {Record<string, UnknownMessageMapping>} UnknownMessageMappings
 */

// State management integration
/** @type {SettingsStateManager | null} */
/** @type {FitFileStateManager | null} */
let fitFileStateManager = null,
    /** @type {PerformanceMonitor | null} */
    performanceMonitor = null,
    /** @type {SettingsStateManager | null} */
    settingsStateManager = null;

/**
 * Custom error class for FIT file decoding issues with enhanced metadata for
 * state management
 *
 * @extends Error
 */
class FitDecodeError extends Error {
    /**
     * Create a FIT decode error
     *
     * @param {string} message - Error message
     * @param {FitFieldValue} details - Additional error details
     * @param {FitDecodeMetadata} [metadata] - Optional metadata for state
     *   management
     */
    constructor(message, details, metadata = {}) {
        super(message);
        this.name = "FitDecodeError";
        this.details = details;
        this.metadata = {
            category: "fit_parsing",
            timestamp: new Date().toISOString(),
            ...metadata,
        };
    }

    /**
     * Convert error to JSON for state management
     *
     * @returns {FitDecodeErrorPayload & { name: string; stack?: string }}
     *   Serializable error object
     */
    toJSON() {
        return {
            details: this.details,
            message: this.message,
            metadata: this.metadata,
            name: this.name,
            stack: this.stack,
        };
    }
}

/**
 * Validates the minimal Garmin SDK module surface used by the parser.
 *
 * @param {unknown} value Module candidate.
 *
 * @returns {FitSdkModule} Valid SDK module.
 */
function assertFitSdkModule(value) {
    if (isFitSdkModule(value)) {
        return value;
    }

    throw new TypeError(
        "Garmin FIT SDK module is missing Decoder or Stream.fromBuffer"
    );
}

/**
 * Extracts a stable user-facing message and optional stack from an unknown
 * thrown value.
 *
 * @param {unknown} error Thrown value from parser or integration code
 *
 * @returns {{ message: string; stack: string | null }}
 */
function describeError(error) {
    if (error instanceof Error) {
        const message =
            error.message.length > 0 ? error.message : "Failed to decode file";
        return {
            message,
            stack: typeof error.stack === "string" ? error.stack : null,
        };
    }
    return { message: "Failed to decode file", stack: null };
}

/**
 * Formats FIT SDK detail values for diagnostic strings.
 *
 * @param {FitFieldValue} value Detail value from the SDK.
 *
 * @returns {string} Diagnostic-safe string.
 */
function formatFitFieldValue(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value === null || typeof value !== "object") {
        return String(value);
    }

    return JSON.stringify(value);
}

/**
 * Node 16.0 compatibility wrapper for own-property checks.
 *
 * @param {Record<string, unknown>} record Object to inspect.
 * @param {string} key Property key to test.
 *
 * @returns {boolean}
 */
function hasOwnKey(record, key) {
    // eslint-disable-next-line prefer-object-has-own -- Object.hasOwn requires Node 16.9; package.json still supports Node 16.0.
    return Object.prototype.hasOwnProperty.call(record, key);
}

/**
 * Initialize state management integration for the FIT parser This should be
 * called during application startup to connect the parser to the state system
 *
 * @param {Object} stateManagers - State management instances
 * @param {Object} stateManagers.settingsStateManager - Settings state manager
 *   for decoder options
 * @param {Object} stateManagers.fitFileStateManager - FIT file state manager
 *   for progress tracking
 * @param {Object} stateManagers.performanceMonitor - Performance monitor for
 *   timing operations
 */
/**
 * @param {{
 *     settingsStateManager?: SettingsStateManager;
 *     fitFileStateManager?: FitFileStateManager;
 *     performanceMonitor?: PerformanceMonitor;
 * }} [stateManagers]
 */
function initializeStateManagement(stateManagers = {}) {
    settingsStateManager = stateManagers.settingsStateManager ?? null;
    fitFileStateManager = stateManagers.fitFileStateManager ?? null;
    performanceMonitor = stateManagers.performanceMonitor ?? null;

    writeParserDiagnostic("log", "[FitParser] State management initialized", {
        hasFitFileState: Boolean(fitFileStateManager),
        hasPerformanceMonitor: Boolean(performanceMonitor),
        hasSettings: Boolean(settingsStateManager),
    });
}

/**
 * Checks whether a value exposes the Garmin SDK surface used by this parser.
 *
 * @param {unknown} value Module candidate.
 *
 * @returns {value is FitSdkModule}
 */
function isFitSdkModule(value) {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const candidate = /** @type {{ Decoder?: unknown; Stream?: unknown }} */ (
        value
    );
    if (typeof candidate.Decoder !== "function") {
        return false;
    }

    const { Stream } = candidate;
    if (Stream === null || typeof Stream !== "object") {
        return false;
    }

    return (
        typeof /** @type {{ fromBuffer?: unknown }} */ (Stream).fromBuffer ===
        "function"
    );
}

/**
 * Checks for promise-like values returned by invalid synchronous adapters.
 *
 * @param {unknown} value Adapter return value.
 *
 * @returns {value is PromiseLike<unknown>}
 */
function isThenable(value) {
    return (
        (typeof value === "object" || typeof value === "function") &&
        value !== null &&
        typeof /** @type {{ then?: unknown }} */ (value).then === "function"
    );
}

/**
 * Loads the Garmin FIT SDK, allowing tests to inject the small surface the
 * parser needs.
 *
 * @param {FitSdkModule | null} fitsdk Optional injected SDK module.
 *
 * @returns {Promise<FitSdkModule>} Garmin SDK module surface.
 */
async function loadFitSdk(fitsdk) {
    if (fitsdk) {
        return fitsdk;
    }

    return assertFitSdkModule(await import("@garmin/fitsdk"));
}

/**
 * Copies caller-supplied decoder options into a plain object before merging
 * with persisted defaults.
 *
 * @param {unknown} options Caller-supplied decoder options.
 *
 * @returns {FitParserReadOptions} Plain decoder options.
 */
function normalizeDecoderReadOptions(options) {
    if (
        options === null ||
        options === undefined ||
        typeof options !== "object"
    ) {
        return {};
    }

    return /** @type {FitParserReadOptions} */ (
        Object.fromEntries(Object.entries(options))
    );
}

/**
 * Converts thrown values into Error instances for state-manager boundaries.
 *
 * @param {unknown} error Thrown value from parser or integration code
 *
 * @returns {Error}
 */
function normalizeError(error) {
    if (error instanceof Error) {
        return error;
    }
    if (typeof error === "string") {
        return new Error(error);
    }
    return new Error("Unknown FIT parser error");
}

/**
 * Attaches a rejection observer to an invalid async settings adapter result.
 *
 * @param {PromiseLike<unknown>} updateResult Async adapter result.
 */
function observeAsyncDecoderOptionsUpdate(updateResult) {
    // eslint-disable-next-line promise/prefer-await-to-then -- updateDecoderOptions is intentionally synchronous; this observes an invalid async adapter without changing the public API.
    Promise.resolve(updateResult).catch(
        reportAsyncDecoderOptionsUpdateRejection
    );
}

/**
 * Returns a shallow copy without one dynamic key. This avoids dynamic delete
 * while preserving the legacy object-map behavior.
 *
 * @param {FitMessages} messages Message map to copy.
 * @param {string} omittedKey Key to omit.
 *
 * @returns {FitMessages}
 */
function omitMessageKey(messages, omittedKey) {
    /** @type {FitMessages} */
    const nextMessages = {};
    for (const [key, rows] of Object.entries(messages)) {
        if (key !== omittedKey) {
            nextMessages[key] = rows;
        }
    }
    return nextMessages;
}

/**
 * Logs async adapter rejections after the synchronous parser boundary has
 * already rejected the adapter result.
 *
 * @param {unknown} error Rejection reason.
 */
function reportAsyncDecoderOptionsUpdateRejection(error) {
    writeParserDiagnostic(
        "warn",
        "[FitParser] Async decoder options update rejected after synchronous boundary:",
        error
    );
}

/**
 * Centralizes the current parser diagnostics until this legacy CommonJS module
 * moves onto the shared logging package.
 *
 * @param {"error" | "log" | "warn"} method Console method to preserve.
 * @param {unknown[]} values Values to forward.
 *
 * @returns {void}
 */
function writeParserDiagnostic(method, ...values) {
    // eslint-disable-next-line no-console -- Existing parser diagnostics are part of the tested behavior; keep the console boundary in one place.
    console[method](...values);
}

/**
 * Default decoder options schema for state management validation
 */
/** @type {Record<keyof DecoderOptions, DecoderOptionSchemaEntry>} */
const DECODER_OPTIONS_SCHEMA = {
    applyScaleAndOffset: {
        default: true,
        description: "Apply scale and offset transformations",
        type: "boolean",
    },
    convertDateTimesToDates: {
        default: true,
        description: "Convert timestamps to Date objects",
        type: "boolean",
    },
    convertTypesToStrings: {
        default: true,
        description: "Convert enum types to strings",
        type: "boolean",
    },
    expandComponents: {
        default: true,
        description: "Expand component fields",
        type: "boolean",
    },
    expandSubFields: {
        default: true,
        description: "Expand sub-fields in messages",
        type: "boolean",
    },
    includeUnknownData: {
        default: true,
        description: "Include unknown message types",
        type: "boolean",
    },
    mergeHeartRates: {
        default: true,
        description: "Merge heart rate data from multiple sources",
        type: "boolean",
    },
};

/** @type {(keyof DecoderOptions)[]} */
const DECODER_OPTION_KEYS = [
    "applyScaleAndOffset",
    "convertDateTimesToDates",
    "convertTypesToStrings",
    "expandComponents",
    "expandSubFields",
    "includeUnknownData",
    "mergeHeartRates",
];

/**
 * Get default decoder options
 *
 * @returns {Object} Default decoder options
 */
/**
 * @returns {DecoderOptions}
 */
function getDefaultDecoderOptions() {
    return {
        applyScaleAndOffset: DECODER_OPTIONS_SCHEMA.applyScaleAndOffset.default,
        convertDateTimesToDates:
            DECODER_OPTIONS_SCHEMA.convertDateTimesToDates.default,
        convertTypesToStrings:
            DECODER_OPTIONS_SCHEMA.convertTypesToStrings.default,
        expandComponents: DECODER_OPTIONS_SCHEMA.expandComponents.default,
        expandSubFields: DECODER_OPTIONS_SCHEMA.expandSubFields.default,
        includeUnknownData: DECODER_OPTIONS_SCHEMA.includeUnknownData.default,
        mergeHeartRates: DECODER_OPTIONS_SCHEMA.mergeHeartRates.default,
    };
}

/**
 * Validates decoder options against schema
 *
 * @param {Object} options - Options to validate
 *
 * @returns {Object} Validation result with isValid and errors properties
 */
/**
 * @param {Partial<DecoderOptions> | null | undefined} options
 *
 * @returns {DecoderOptionsValidationResult}
 */
function validateDecoderOptions(options) {
    /** @type {string[]} */
    const errors = [],
        /** @type {DecoderOptions} */
        validatedOptions = { ...getDefaultDecoderOptions() };

    if (options && typeof options === "object") {
        /** @type {Partial<Record<keyof DecoderOptions, unknown>>} */
        const candidateOptions = options;
        for (const key of DECODER_OPTION_KEYS) {
            const schema = DECODER_OPTIONS_SCHEMA[key],
                value = candidateOptions[key];
            if (value !== undefined) {
                if (typeof value === schema.type) {
                    validatedOptions[key] = value;
                } else {
                    errors.push(
                        `${key} must be of type ${schema.type}, got ${typeof value}`
                    );
                }
            }
        }
    }

    return { errors, isValid: errors.length === 0, validatedOptions };
}

// Mapping of unknown FIT message numbers to human-readable names and field labels
/** @type {UnknownMessageMappings} */
const unknownMessageMappings = {
    104: {
        fields: [
            "timestamp",
            "battery_voltage",
            "battery_level",
            "temperature",
            "field_4",
        ],
        name: "Device Status",
    },
    // Add more mappings as needed
};

/**
 * Applies human-readable names and field labels to unknown messages.
 *
 * @param {Object} messages - The decoded FIT messages.
 *
 * @returns {Object} Messages with updated labels for unknown types.
 */
/**
 * @param {FitMessages} messages
 *
 * @returns {FitMessages}
 */
function applyUnknownMessageLabels(messages) {
    /** @type {FitMessages} */
    let updated = { ...messages };
    for (const msgNum of Object.keys(unknownMessageMappings)) {
        const mapping = unknownMessageMappings[msgNum];
        const possibleKeys = [`unknown_${msgNum}`, msgNum];
        for (const key of possibleKeys) {
            if (hasOwnKey(updated, key)) {
                const rows = updated[key];
                if (Array.isArray(rows)) {
                    updated[mapping.name] =
                        msgNum === "104"
                            ? rows.map((row) => ({
                                  battery_level: row[2],
                                  battery_voltage: row[0],
                                  field_4: row[4],
                                  temperature: row[3],
                                  timestamp: row[253],
                              }))
                            : rows.map((row) => {
                                  /** @type {Record<string, FitFieldValue>} */
                                  const labeled = {};
                                  for (const [
                                      idx,
                                      field,
                                  ] of mapping.fields.entries()) {
                                      labeled[field] = row[idx];
                                  }
                                  return labeled;
                              });
                    updated = omitMessageKey(updated, key);
                }
            }
        }
    }
    for (const msgNum of Object.keys(unknownMessageMappings)) {
        const mapping = unknownMessageMappings[msgNum];
        const key = msgNum;
        if (hasOwnKey(updated, key) && hasOwnKey(updated, mapping.name)) {
            updated = omitMessageKey(updated, key);
        }
    }
    return updated;
}

/**
 * Decodes a FIT file buffer using the Garmin FIT SDK with integrated state
 * management.
 *
 * @param {unknown} fileBuffer - The FIT file buffer to decode.
 * @param {unknown} [options] - Optional decoder.read options.
 * @param {FitSdkModule | null} [fitsdk] - Optional fitsdk dependency for
 *   testing/mocking.
 *
 * @returns {Promise<FitDecodeResult>} Decoded messages or error object.
 */
/**
 * @param {unknown} fileBuffer
 * @param {unknown} [options]
 * @param {FitSdkModule | null} [fitsdk] Optional injected sdk for tests.
 *
 * @returns {Promise<FitDecodeResult>}
 */
async function decodeFitFile(fileBuffer, options = {}, fitsdk = null) {
    const operationId = `fitFile_decode_${Date.now()}`;

    // Start performance monitoring if available
    if (performanceMonitor) {
        performanceMonitor.startTimer(operationId);
    }

    // Update FIT file state to indicate decoding started
    reportLoadingProgress(10);

    // Input validation
    const buffer = normalizeDecodeBuffer(fileBuffer);

    try {
        const sdk = await loadFitSdk(fitsdk),
            { Decoder, Stream } = sdk,
            stream = Stream.fromBuffer(buffer),
            decoder = new Decoder(stream);

        // Update progress - SDK loaded
        reportLoadingProgress(30);

        if (!decoder.checkIntegrity()) {
            const integrityErrors = getDecoderIntegrityDetails(decoder),
                msg = `FIT file integrity check failed. Details: ${formatFitFieldValue(integrityErrors)}`;
            writeParserDiagnostic("error", msg);

            const error = new FitDecodeError(msg, integrityErrors);
            reportLoadingError(error);

            throw error;
        }

        // Update progress - Integrity check passed
        reportLoadingProgress(50);

        // Default decoder options from persistent store
        const optionOverrides = normalizeDecoderReadOptions(options),
            persistedOptions = normalizeDecoderReadOptions(
                getPersistedDecoderOptions()
            ),
            /** @type {FitParserReadOptions} */
            readOptions = { ...persistedOptions, ...optionOverrides };

        // Update progress - Starting decode
        reportLoadingProgress(70);

        const { errors, messages } = decoder.read(readOptions);

        if (Array.isArray(errors) && errors.length > 0) {
            const msg = "Decoding errors occurred";
            writeParserDiagnostic("error", msg, errors);

            const error = new FitDecodeError(msg, errors);
            reportLoadingError(error);

            throw error;
        }

        if (!messages || Object.keys(messages).length === 0) {
            const msg =
                "No valid messages decoded, FIT file might be corrupted.";
            writeParserDiagnostic("error", msg);

            const error = new FitDecodeError(msg, null);
            reportLoadingError(error);

            throw error;
        }

        // Update progress - Applying labels
        reportLoadingProgress(90);

        const processedMessages = applyUnknownMessageLabels(messages);

        // Update progress - Complete
        reportFileLoaded(processedMessages, readOptions, operationId);

        writeParserDiagnostic(
            "log",
            "[FitParser] FIT file decoded successfully."
        );

        // End performance monitoring
        if (performanceMonitor) {
            performanceMonitor.endTimer(operationId);
        }

        return processedMessages;
    } catch (error) {
        // End performance monitoring on error
        if (performanceMonitor) {
            performanceMonitor.endTimer(operationId);
        }

        if (error instanceof FitDecodeError) {
            return { details: error.details, error: error.message };
        }
        writeParserDiagnostic(
            "error",
            "[FitParser] Failed to decode file",
            error
        );

        // Update state with generic error
        reportLoadingError(normalizeError(error));

        const errorDescription = describeError(error);
        return {
            details: errorDescription.stack,
            error: errorDescription.message,
        };
    }
}

/**
 * Get current decoder options
 *
 * @returns {Object} Current decoder options
 */
function getCurrentDecoderOptions() {
    return getPersistedDecoderOptions();
}

/**
 * Gets optional SDK integrity details when the concrete Garmin SDK version
 * exposes them.
 *
 * @param {import("./shared/fitSdk").FitSdkDecoder} decoder Decoder instance.
 *
 * @returns {FitFieldValue} Integrity failure details.
 */
function getDecoderIntegrityDetails(decoder) {
    return typeof decoder.getIntegrityErrors === "function"
        ? decoder.getIntegrityErrors()
        : "No additional details available";
}

/**
 * Retrieves persisted decoder options from the injected state management
 * adapter, falling back to defaults when no adapter is configured.
 *
 * @returns {Object} Persisted decoder options with validation
 */
function getPersistedDecoderOptions() {
    const defaults = getDefaultDecoderOptions();

    // Try to get from new state management system first
    if (settingsStateManager) {
        try {
            const decoderSettings =
                    settingsStateManager.getCategory("decoder") ?? {},
                validation = validateDecoderOptions({
                    ...defaults,
                    ...decoderSettings,
                });
            return validation.validatedOptions;
        } catch (error) {
            writeParserDiagnostic(
                "warn",
                "[FitParser] Failed to get decoder options from state manager, falling back to defaults:",
                error
            );
        }
    }

    return defaults;
}

/**
 * Returns the optional source file path carried by decoder options.
 *
 * @param {FitParserReadOptions} readOptions Effective decoder options.
 *
 * @returns {null | string} Source file path for state metadata.
 */
function getReadOptionsFilePath(readOptions) {
    const { filePath } = readOptions;
    return typeof filePath === "string" && filePath.length > 0
        ? filePath
        : null;
}

/**
 * Normalizes supported decode inputs into a Node Buffer.
 *
 * @param {unknown} fileBuffer Input supplied to decodeFitFile.
 *
 * @returns {Buffer} Buffer accepted by Garmin FIT SDK.
 */
function normalizeDecodeBuffer(fileBuffer) {
    if (!(fileBuffer instanceof Buffer) && !(fileBuffer instanceof Uint8Array)) {
        const msg = `Input is not a valid Buffer or Uint8Array. Received type: ${typeof fileBuffer}.`;
        writeParserDiagnostic("error", msg);

        const error = new FitDecodeError(msg, null);
        reportLoadingError(error);
        throw error;
    }

    return Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
}

/**
 * Records a successful decode in state management.
 *
 * @param {FitMessages} processedMessages Messages after unknown-label mapping.
 * @param {Partial<DecoderOptions>} readOptions Effective decoder options.
 * @param {string} operationId Performance operation id.
 */
function reportFileLoaded(processedMessages, readOptions, operationId) {
    if (!fitFileStateManager) {
        return;
    }

    try {
        fitFileStateManager.updateLoadingProgress(100);
        fitFileStateManager.handleFileLoaded(
            {
                messages: processedMessages,
                metadata: {
                    decodingOptions: readOptions,
                    processingTime: performanceMonitor
                        ? performanceMonitor.getOperationTime(operationId)
                        : null,
                    recordCount:
                        fitFileStateManager.getRecordCount(processedMessages),
                },
            },
            {
                filePath: getReadOptionsFilePath(readOptions),
                source: "fitParser.decodeFitFile",
            }
        );
    } catch (error) {
        writeParserDiagnostic(
            "warn",
            "[FitParser] Failed to update success state:",
            error
        );
    }
}

/**
 * Records a decode error in state management, preserving parser behavior if the
 * state layer itself fails.
 *
 * @param {Error} error Error to record.
 */
function reportLoadingError(error) {
    if (!fitFileStateManager) {
        return;
    }

    try {
        fitFileStateManager.handleFileLoadingError(error);
    } catch (stateError) {
        writeParserDiagnostic(
            "warn",
            "[FitParser] Failed to update error state:",
            stateError
        );
    }
}

/**
 * Updates state-manager decode progress without letting UI state failures
 * interrupt FIT decoding.
 *
 * @param {number} progress Progress percentage to report.
 */
function reportLoadingProgress(progress) {
    if (!fitFileStateManager) {
        return;
    }

    try {
        fitFileStateManager.updateLoadingProgress(progress);
    } catch (error) {
        writeParserDiagnostic(
            "warn",
            "[FitParser] Failed to update loading progress:",
            error
        );
    }
}

/**
 * Reset decoder options to defaults
 *
 * @returns {Object} Result with success status
 */
function resetDecoderOptions() {
    const defaults = getDefaultDecoderOptions();
    return updateDecoderOptions(defaults);
}

/**
 * Update decoder options in the state management system with validation
 *
 * @param {Object} newOptions - New decoder options to persist
 *
 * @returns {Object} Result with success status and validation errors
 */
function updateDecoderOptions(newOptions) {
    // Validate options first
    const validation = validateDecoderOptions(newOptions);
    if (!validation.isValid) {
        writeParserDiagnostic(
            "error",
            "[FitParser] Invalid decoder options:",
            validation.errors
        );
        return { errors: validation.errors, success: false };
    }

    if (settingsStateManager) {
        try {
            const updateCategory =
                /** @type {(category: string, value: Partial<DecoderOptions>) => unknown} */ (
                    settingsStateManager.updateCategory
                );
            const updateResult = updateCategory(
                "decoder",
                validation.validatedOptions
            );
            if (isThenable(updateResult)) {
                observeAsyncDecoderOptionsUpdate(updateResult);
                return {
                    errors: [
                        "Settings state manager update must be synchronous",
                    ],
                    success: false,
                };
            }
            writeParserDiagnostic(
                "log",
                "[FitParser] Decoder options updated in state management"
            );
            return { options: validation.validatedOptions, success: true };
        } catch (error) {
            writeParserDiagnostic(
                "warn",
                "[FitParser] Failed to update decoder options in state manager:",
                error
            );
            return {
                errors: ["Failed to update decoder options in state manager"],
                success: false,
            };
        }
    }

    return {
        errors: ["No settings state manager configured"],
        success: false,
    };
}

module.exports = {
    applyUnknownMessageLabels,
    // Core functionality
    decodeFitFile,
    // Schema and constants
    DECODER_OPTIONS_SCHEMA,

    FitDecodeError,

    getCurrentDecoderOptions,
    getDefaultDecoderOptions,
    getPersistedDecoderOptions,
    // State management integration
    initializeStateManagement,
    resetDecoderOptions,
    // Decoder options management
    updateDecoderOptions,

    validateDecoderOptions,
};

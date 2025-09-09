/**
 * @fileoverview FIT File Parser with State Management Integration
 * @description Decodes FIT files using Garmin SDK with integrated state management for progress tracking,
 * error handling, and settings persistence. Supports both new state management system and electron-conf fallback.
 * @author FitFileViewer Development Team
 * @version 2.0.0
 */

/* eslint-env node */
const { Buffer } = require("buffer");
// electron-conf imported dynamically in getConf() to avoid module loading issues in tests

/**
 * ============================= Typedef Section =============================
 * These typedefs provide structure for the JSDoc-based type checking used by
 * the project (allowJs + checkJs). They intentionally model only the pieces
 * of each object this module relies on so we can progressively enrich them
 * without over‑committing to full shapes up front.
 * ==========================================================================
 */

/**
 * @typedef {Object} SettingsStateManager
 * @property {(category: string) => any} getCategory Retrieve a settings category
 * @property {(category: string, value: any, opts?: { silent?: boolean, source?: string }) => void} updateCategory Update a settings category
 */

/**
 * @typedef {Object} FitFileStateManager
 * @property {(progress: number) => void} updateLoadingProgress Update decode progress percentage
 * @property {(error: Error) => void} handleFileLoadingError Record a loading error
 * @property {(payload: { messages: FitMessages, metadata: any }) => void} handleFileLoaded Record successful load
 * @property {(messages: FitMessages) => number} getRecordCount Derive record count for metadata
 */

/**
 * @typedef {Object} PerformanceMonitor
 * @property {(id: string) => void} startTimer Start a named timing operation
 * @property {(id: string) => void} endTimer End a named timing operation
 * @property {(id: string) => (number|null)} getOperationTime Get elapsed ms
 * @property {boolean} [isEnabled] Optional flag for enablement
 */

/**
 * @typedef {Object} DecoderOptionSchemaEntry
 * @property {"boolean"} type Primitive type expected (only boolean currently)
 * @property {boolean} default Default value
 * @property {string} description Human readable description
 */

/**
 * @typedef {Object} DecoderOptions
 * @property {boolean} applyScaleAndOffset
 * @property {boolean} expandSubFields
 * @property {boolean} expandComponents
 * @property {boolean} convertTypesToStrings
 * @property {boolean} convertDateTimesToDates
 * @property {boolean} includeUnknownData
 * @property {boolean} mergeHeartRates
 */

/**
 * @typedef {Object} DecoderOptionsValidationResult
 * @property {boolean} isValid Whether supplied options passed validation
 * @property {string[]} errors Validation messages (empty when valid)
 * @property {DecoderOptions} validatedOptions Sanitized + default‑filled options
 */

/**
 * @typedef {Record<string, any[]|object[]>} FitMessages
 */

/**
 * @typedef {Object} UnknownMessageMapping
 * @property {string} name Canonical label to replace unknown_xxx key
 * @property {string[]} fields Ordered field labels for generic mapping path
 */

/**
 * @typedef {Record<string, UnknownMessageMapping>} UnknownMessageMappings
 */

// State management integration
/** @type {SettingsStateManager|null} */
/** @type {FitFileStateManager|null} */
let fitFileStateManager = null,
/** @type {PerformanceMonitor|null} */
 performanceMonitor = null,
/** @type {SettingsStateManager|null} */
 settingsStateManager = null;

// Fallback to electron-conf for backwards compatibility - lazy initialization
/** @type {any} */
let conf = null;
function getConf() {
    if (!conf) {
        const { Conf } = require('electron-conf');
        conf = new Conf({ name: "settings" });
    }
    return conf;
}

/**
 * Initialize state management integration for the FIT parser
 * This should be called during application startup to connect the parser to the state system
 * @param {Object} stateManagers - State management instances
 * @param {Object} stateManagers.settingsStateManager - Settings state manager for decoder options
 * @param {Object} stateManagers.fitFileStateManager - FIT file state manager for progress tracking
 * @param {Object} stateManagers.performanceMonitor - Performance monitor for timing operations
 */
/**
 * @param {{ settingsStateManager?: SettingsStateManager, fitFileStateManager?: FitFileStateManager, performanceMonitor?: PerformanceMonitor }} [stateManagers]
 */
function initializeStateManagement(stateManagers = {}) {
    settingsStateManager = stateManagers.settingsStateManager || null;
    fitFileStateManager = stateManagers.fitFileStateManager || null;
    performanceMonitor = stateManagers.performanceMonitor || null;

    console.log("[FitParser] State management initialized", {
        hasSettings: Boolean(settingsStateManager),
        hasFitFileState: Boolean(fitFileStateManager),
        hasPerformanceMonitor: Boolean(performanceMonitor),
    });
}
/**
 * Custom error class for FIT file decoding issues with enhanced metadata for state management
 * @extends Error
 */
class FitDecodeError extends Error {
    /**
     * Create a FIT decode error
     * @param {string} message - Error message
     * @param {*} details - Additional error details
     * @param {Object} [metadata] - Optional metadata for state management
     */
    constructor(message, details, metadata = {}) {
        super(message);
        this.name = "FitDecodeError";
        this.details = details;
        this.metadata = {
            timestamp: new Date().toISOString(),
            category: "fit_parsing",
            ...metadata,
        };
    }

    /**
     * Convert error to JSON for state management
     * @returns {Object} Serializable error object
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            details: this.details,
            metadata: this.metadata,
            stack: this.stack,
        };
    }
}

/**
 * Default decoder options schema for state management validation
 */
/** @type {Record<keyof DecoderOptions, DecoderOptionSchemaEntry>} */
const DECODER_OPTIONS_SCHEMA = {
    applyScaleAndOffset: { type: "boolean", default: true, description: "Apply scale and offset transformations" },
    expandSubFields: { type: "boolean", default: true, description: "Expand sub-fields in messages" },
    expandComponents: { type: "boolean", default: true, description: "Expand component fields" },
    convertTypesToStrings: { type: "boolean", default: true, description: "Convert enum types to strings" },
    convertDateTimesToDates: { type: "boolean", default: true, description: "Convert timestamps to Date objects" },
    includeUnknownData: { type: "boolean", default: true, description: "Include unknown message types" },
    mergeHeartRates: { type: "boolean", default: true, description: "Merge heart rate data from multiple sources" },
};

/**
 * Get default decoder options
 * @returns {Object} Default decoder options
 */
/**
 * @returns {DecoderOptions}
 */
function getDefaultDecoderOptions() {
    /** @type {DecoderOptions} */
    const defaults = {
        applyScaleAndOffset: DECODER_OPTIONS_SCHEMA.applyScaleAndOffset.default,
        expandSubFields: DECODER_OPTIONS_SCHEMA.expandSubFields.default,
        expandComponents: DECODER_OPTIONS_SCHEMA.expandComponents.default,
        convertTypesToStrings: DECODER_OPTIONS_SCHEMA.convertTypesToStrings.default,
        convertDateTimesToDates: DECODER_OPTIONS_SCHEMA.convertDateTimesToDates.default,
        includeUnknownData: DECODER_OPTIONS_SCHEMA.includeUnknownData.default,
        mergeHeartRates: DECODER_OPTIONS_SCHEMA.mergeHeartRates.default,
    };
    return defaults;
}

/**
 * Validates decoder options against schema
 * @param {Object} options - Options to validate
 * @returns {Object} Validation result with isValid and errors properties
 */
/**
 * @param {Partial<DecoderOptions>|null|undefined} options
 * @returns {DecoderOptionsValidationResult}
 */
function validateDecoderOptions(options) {
    /** @type {string[]} */
    const errors = [],
    /** @type {DecoderOptions} */
     validatedOptions = { ...getDefaultDecoderOptions() };

    if (options && typeof options === "object") {
        /** @type {(keyof DecoderOptions)[]} */
        const keys = /** @type {any} */ (Object.keys(DECODER_OPTIONS_SCHEMA));
        keys.forEach((key) => {
            const schema = DECODER_OPTIONS_SCHEMA[key],
             value = /** @type {any} */ (options)[key];
            if (value !== undefined) {
                if (typeof value !== schema.type) {
                    errors.push(`${String(key)} must be of type ${schema.type}, got ${typeof value}`);
                } else {
                    validatedOptions[key] = value;
                }
            }
        });
    }

    return { isValid: errors.length === 0, errors, validatedOptions };
}

// Mapping of unknown FIT message numbers to human-readable names and field labels
/** @type {UnknownMessageMappings} */
const unknownMessageMappings = {
    104: {
        name: "Device Status",
        fields: ["timestamp", "battery_voltage", "battery_level", "temperature", "field_4"],
    },
    // Add more mappings as needed
};

/**
 * Applies human-readable names and field labels to unknown messages.
 * @param {Object} messages - The decoded FIT messages.
 * @returns {Object} Messages with updated labels for unknown types.
 */
/**
 * @param {FitMessages} messages
 * @returns {FitMessages}
 */
function applyUnknownMessageLabels(messages) {
    /** @type {FitMessages} */
    const updated = { ...messages };
    Object.keys(unknownMessageMappings).forEach((msgNum) => {
        const mapping = unknownMessageMappings[/** @type {any} */ (msgNum)];
        if (!mapping) {return;} // Safety guard
        const possibleKeys = [`unknown_${msgNum}`, msgNum];
        possibleKeys.forEach((key) => {
            if (Object.hasOwn(updated, key)) {
                const rows = /** @type {any[]} */ (updated[/** @type {any} */ (key)]);
                if (!Array.isArray(rows)) {return;}
                if (msgNum === "104") {
                    updated[mapping.name] = rows.map((row) => {
                        if (!row || typeof row !== "object") {return row;}
                        return {
                            timestamp: row[253],
                            battery_voltage: row[0],
                            battery_level: row[2],
                            temperature: row[3],
                            field_4: row[4],
                        };
                    });
                } else {
                    updated[mapping.name] = rows.map((row) => {
                        if (!row || typeof row !== "object") {return row;}
                        /** @type {Record<string, any>} */
                        const labeled = {};
                        if (mapping && Array.isArray(mapping.fields)) {
                            mapping.fields.forEach((field, idx) => {
                                labeled[field] = row[idx];
                            });
                        }
                        return labeled;
                    });
                }
                delete updated[/** @type {any} */ (key)];
            }
        });
    });
    Object.keys(unknownMessageMappings).forEach((msgNum) => {
        const mapping = unknownMessageMappings[/** @type {any} */ (msgNum)];
        if (!mapping) {return;}
        const key = /** @type {any} */ (msgNum);
        if (
            Object.hasOwn(updated, key) &&
            Object.hasOwn(updated, mapping.name)
        ) {
            delete updated[key];
        }
    });
    return updated;
}

/**
 * Retrieves persisted decoder options from the state management system or fallback to electron-conf.
 * @returns {Object} Persisted decoder options with validation
 */
function getPersistedDecoderOptions() {
    const defaults = getDefaultDecoderOptions();

    // Try to get from new state management system first
    if (settingsStateManager) {
        try {
            const decoderSettings = settingsStateManager.getCategory("decoder") || {},
             validation = validateDecoderOptions({ ...defaults, ...decoderSettings });
            return validation.validatedOptions;
        } catch (error) {
            console.warn(
                "[FitParser] Failed to get decoder options from state manager, falling back to electron-conf:",
                error
            );
        }
    }

    // Fallback to electron-conf
    const storedOptions = /** @type {Partial<DecoderOptions>} */ (getConf().get("decoderOptions", defaults)),
     validation = validateDecoderOptions(storedOptions);
    return validation.validatedOptions;
}

/**
 * Decodes a FIT file buffer using the Garmin FIT SDK with integrated state management.
 * @param {Buffer|Uint8Array} fileBuffer - The FIT file buffer to decode.
 * @param {Object} [options] - Optional decoder.read options.
 * @param {Object} [fitsdk] - Optional fitsdk dependency for testing/mocking.
 * @returns {Promise<Object>} Decoded messages or error object.
 */
/**
 * @param {Buffer|Uint8Array} fileBuffer
 * @param {Partial<DecoderOptions>=} options
 * @param {any=} fitsdk Optional injected sdk for tests (should expose Decoder & Stream)
 * @returns {Promise<FitMessages|{error:string, details:any}>}
 */
async function decodeFitFile(fileBuffer, options = {}, fitsdk) {
    const operationId = `fitFile_decode_${Date.now()}`;

    // Start performance monitoring if available
    if (performanceMonitor) {
        performanceMonitor.startTimer(operationId);
    }

    // Update FIT file state to indicate decoding started
    if (fitFileStateManager) {
        try {
            fitFileStateManager.updateLoadingProgress(10); // Starting decode
        } catch (error) {
            console.warn("[FitParser] Failed to update loading progress:", error);
        }
    }

    // Input validation
    if (!fileBuffer || !(fileBuffer instanceof Buffer || fileBuffer instanceof Uint8Array)) {
        const msg = `Input is not a valid Buffer or Uint8Array. Received type: ${typeof fileBuffer}.`;
        console.error(msg);

        // Update state with error
        if (fitFileStateManager) {
            try {
                fitFileStateManager.handleFileLoadingError(new FitDecodeError(msg, null));
            } catch (error) {
                console.warn("[FitParser] Failed to update error state:", error);
            }
        }

        throw new FitDecodeError(msg, null);
    }

    try {
        /** @type {any} */
        // @ts-ignore - external library lacks bundled types; suppressed locally
        const sdk = fitsdk || (await import("@garmin/fitsdk")),
        // @ts-ignore - typed as any due to missing declaration file
         { Decoder, Stream } = /** @type {any} */ (sdk),
         buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer),
         stream = Stream.fromBuffer(buffer),
         decoder = new Decoder(stream);

        // Update progress - SDK loaded
        if (fitFileStateManager) {
            try {
                fitFileStateManager.updateLoadingProgress(30);
            } catch (error) {
                console.warn("[FitParser] Failed to update loading progress:", error);
            }
        }

        if (!decoder.checkIntegrity()) {
            const integrityErrors =
                typeof decoder.getIntegrityErrors === "function"
                    ? decoder.getIntegrityErrors()
                    : "No additional details available",
             msg = `FIT file integrity check failed. Details: ${integrityErrors}`;
            console.error(msg);

            const error = new FitDecodeError(msg, integrityErrors);
            if (fitFileStateManager) {
                try {
                    fitFileStateManager.handleFileLoadingError(error);
                } catch (stateError) {
                    console.warn("[FitParser] Failed to update error state:", stateError);
                }
            }

            throw error;
        }

        // Update progress - Integrity check passed
        if (fitFileStateManager) {
            try {
                fitFileStateManager.updateLoadingProgress(50);
            } catch (error) {
                console.warn("[FitParser] Failed to update loading progress:", error);
            }
        }

        // Default decoder options from persistent store
        const persistedOptions = getPersistedDecoderOptions(),
         readOptions = { ...persistedOptions, ...options};

        // Update progress - Starting decode
        if (fitFileStateManager) {
            try {
                fitFileStateManager.updateLoadingProgress(70);
            } catch (error) {
                console.warn("[FitParser] Failed to update loading progress:", error);
            }
        }

        const { messages, errors } = decoder.read(readOptions);

        if (errors && errors.length > 0) {
            const msg = "Decoding errors occurred";
            console.error(msg, errors);

            const error = new FitDecodeError(msg, errors);
            if (fitFileStateManager) {
                try {
                    fitFileStateManager.handleFileLoadingError(error);
                } catch (stateError) {
                    console.warn("[FitParser] Failed to update error state:", stateError);
                }
            }

            throw error;
        }

        if (!messages || Object.keys(messages).length === 0) {
            const msg = "No valid messages decoded, FIT file might be corrupted.";
            console.error(msg);

            const error = new FitDecodeError(msg, null);
            if (fitFileStateManager) {
                try {
                    fitFileStateManager.handleFileLoadingError(error);
                } catch (stateError) {
                    console.warn("[FitParser] Failed to update error state:", stateError);
                }
            }

            throw error;
        }

        // Update progress - Applying labels
        if (fitFileStateManager) {
            try {
                fitFileStateManager.updateLoadingProgress(90);
            } catch (error) {
                console.warn("[FitParser] Failed to update loading progress:", error);
            }
        }

        const processedMessages = applyUnknownMessageLabels(messages);

        // Update progress - Complete
        if (fitFileStateManager) {
            try {
                fitFileStateManager.updateLoadingProgress(100);
                fitFileStateManager.handleFileLoaded({
                    messages: processedMessages,
                    metadata: {
                        recordCount: fitFileStateManager.getRecordCount(processedMessages),
                        decodingOptions: readOptions,
                        processingTime: performanceMonitor ? performanceMonitor.getOperationTime(operationId) : null,
                    },
                });
            } catch (error) {
                console.warn("[FitParser] Failed to update success state:", error);
            }
        }

        console.log("[FitParser] FIT file decoded successfully.");

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
            return { error: error.message, details: error.details };
        }
        console.error("[FitParser] Failed to decode file", error);

        // Update state with generic error
        if (fitFileStateManager) {
            try {
                fitFileStateManager.handleFileLoadingError(/** @type {Error} */ (error));
            } catch (stateError) {
                console.warn("[FitParser] Failed to update error state:", stateError);
            }
        }

        const errObj = /** @type {any} */ (error);
        return {
            error: errObj && errObj.message ? errObj.message : "Failed to decode file",
            details: errObj && errObj.stack ? errObj.stack : null,
        };
    }
}

/**
 * Update decoder options in the state management system with validation
 * @param {Object} newOptions - New decoder options to persist
 * @returns {Object} Result with success status and any validation errors
 */
function updateDecoderOptions(newOptions) {
    // Validate options first
    const validation = validateDecoderOptions(newOptions);
    if (!validation.isValid) {
        console.error("[FitParser] Invalid decoder options:", validation.errors);
        return { success: false, errors: validation.errors };
    }

    if (settingsStateManager) {
        try {
            settingsStateManager.updateCategory("decoder", validation.validatedOptions);
            console.log("[FitParser] Decoder options updated in state management");
            return { success: true, options: validation.validatedOptions };
        } catch (error) {
            console.warn(
                "[FitParser] Failed to update decoder options in state manager, falling back to electron-conf:",
                error
            );
            getConf().set("decoderOptions", validation.validatedOptions);
            return { success: true, options: validation.validatedOptions, fallback: true };
        }
    } else {
        // Fallback to electron-conf
        getConf().set("decoderOptions", validation.validatedOptions);
        return { success: true, options: validation.validatedOptions, fallback: true };
    }
}

/**
 * Get current decoder options
 * @returns {Object} Current decoder options
 */
function getCurrentDecoderOptions() {
    return getPersistedDecoderOptions();
}

/**
 * Reset decoder options to defaults
 * @returns {Object} Result with success status
 */
function resetDecoderOptions() {
    const defaults = getDefaultDecoderOptions();
    return updateDecoderOptions(defaults);
}

module.exports = {
    // Core functionality
    decodeFitFile,
    FitDecodeError,
    applyUnknownMessageLabels,

    // State management integration
    initializeStateManagement,

    // Decoder options management
    updateDecoderOptions,
    getCurrentDecoderOptions,
    resetDecoderOptions,
    getPersistedDecoderOptions,
    getDefaultDecoderOptions,
    validateDecoderOptions,

    // Schema and constants
    DECODER_OPTIONS_SCHEMA,
};

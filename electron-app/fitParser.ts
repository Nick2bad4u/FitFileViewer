import { Buffer } from "node:buffer";

import { applyUnknownMessageLabels as labelUnknownMessages } from "./shared/fitUnknownMessageLabels.js";

export { applyUnknownMessageLabels } from "./shared/fitUnknownMessageLabels.js";

type DecoderOptions = import("./shared/fit").DecoderOptions;
type DecoderOptionsValidationResult =
    import("./shared/fit").DecoderOptionsValidationResult;
type FitDecodeMetadata = import("./shared/fit").FitDecodeMetadata;
type FitDecodeResult = import("./shared/fit").FitDecodeResult;
type FitFieldValue = import("./shared/fit").FitFieldValue;
type FitMessages = import("./shared/fit").FitMessages;
type FitSdkDecoder = import("./shared/fitSdk").FitSdkDecoder;
type FitSdkModule = import("./shared/fitSdk").FitSdkModule;
type FitSdkReadOptions = import("./shared/fitSdk").FitSdkReadOptions;
type DecoderOptionSchemaEntry =
    import("./shared/fitParser").DecoderOptionSchemaEntry;
type DecoderOptionsUpdateResult =
    import("./shared/fitParser").DecoderOptionsUpdateResult;
type FitFileStateManager = import("./shared/fitParser").FitFileStateManager;
type FitParserModule = import("./shared/fitParser").FitParserModule;
type FitParserStateManagers =
    import("./shared/fitParser").FitParserStateManagers;
type PerformanceMonitor = import("./shared/fitParser").PerformanceMonitor;
type SettingsStateManager = import("./shared/fitParser").SettingsStateManager;
type SerializedFitDecodeError =
    import("./shared/fitParser").SerializedFitDecodeError;

type FitParserReadOptions = FitSdkReadOptions & {
    filePath?: unknown;
};

// State management integration
let fitFileStateManager: FitFileStateManager | null = null;
let performanceMonitor: null | PerformanceMonitor = null;
let settingsStateManager: null | SettingsStateManager = null;

export class FitDecodeError extends Error {
    details: FitFieldValue;
    metadata: FitDecodeMetadata & { category: string; timestamp: string };

    constructor(
        message: string,
        details: FitFieldValue,
        metadata: FitDecodeMetadata = {}
    ) {
        super(message);
        this.name = "FitDecodeError";
        this.details = details;
        this.metadata = {
            category: "fit_parsing",
            timestamp: new Date().toISOString(),
            ...metadata,
        };
    }

    toJSON(): SerializedFitDecodeError {
        const serialized: SerializedFitDecodeError = {
            details: this.details,
            message: this.message,
            metadata: this.metadata,
            name: "FitDecodeError",
        };
        if (this.stack !== undefined) {
            serialized.stack = this.stack;
        }
        return serialized;
    }
}

function assertFitSdkModule(value: unknown): FitSdkModule {
    const sdkModule = resolveFitSdkModule(value);
    if (sdkModule) {
        return sdkModule;
    }

    throw new TypeError(
        "Garmin FIT SDK module is missing Decoder or Stream.fromBuffer"
    );
}

function describeError(error: unknown): {
    message: string;
    stack: null | string;
} {
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

function formatFitFieldValue(value: FitFieldValue): string {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value === null || typeof value !== "object") {
        return String(value);
    }

    return JSON.stringify(value);
}

export function initializeStateManagement(
    stateManagers: FitParserStateManagers = {}
): void {
    settingsStateManager = stateManagers.settingsStateManager ?? null;
    fitFileStateManager = stateManagers.fitFileStateManager ?? null;
    performanceMonitor = stateManagers.performanceMonitor ?? null;

    writeParserDiagnostic("log", "[FitParser] State management initialized", {
        hasFitFileState: Boolean(fitFileStateManager),
        hasPerformanceMonitor: Boolean(performanceMonitor),
        hasSettings: Boolean(settingsStateManager),
    });
}

function isFitSdkModule(value: unknown): value is FitSdkModule {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const candidate = value as { Decoder?: unknown; Stream?: unknown };
    if (typeof candidate.Decoder !== "function") {
        return false;
    }

    const { Stream } = candidate;
    if (
        Stream === null ||
        (typeof Stream !== "object" && typeof Stream !== "function")
    ) {
        return false;
    }

    return (
        typeof (Stream as { fromBuffer?: unknown }).fromBuffer === "function"
    );
}

function resolveFitSdkModule(value: unknown): FitSdkModule | null {
    if (isFitSdkModule(value)) {
        return value;
    }

    if (value === null || typeof value !== "object") {
        return null;
    }

    const defaultExport = (value as { default?: unknown }).default;
    return isFitSdkModule(defaultExport) ? defaultExport : null;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
    return (
        (typeof value === "object" || typeof value === "function") &&
        value !== null &&
        typeof (value as { then?: unknown }).then === "function"
    );
}

async function loadFitSdk(fitsdk: FitSdkModule | null): Promise<FitSdkModule> {
    if (fitsdk) {
        return fitsdk;
    }

    const fitSdkModuleId = "@garmin/fitsdk";
    return assertFitSdkModule(await import(fitSdkModuleId));
}

function normalizeDecoderReadOptions(options: unknown): FitParserReadOptions {
    if (
        options === null ||
        options === undefined ||
        typeof options !== "object"
    ) {
        return {};
    }

    return Object.fromEntries(Object.entries(options));
}

function normalizeError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }
    if (typeof error === "string") {
        return new Error(error);
    }
    return new Error("Unknown FIT parser error");
}

function observeAsyncDecoderOptionsUpdate(
    updateResult: PromiseLike<unknown>
): void {
    // eslint-disable-next-line promise/prefer-await-to-then -- updateDecoderOptions is intentionally synchronous; this observes an invalid async adapter without changing the public API.
    Promise.resolve(updateResult).catch(
        reportAsyncDecoderOptionsUpdateRejection
    );
}

function reportAsyncDecoderOptionsUpdateRejection(error: unknown): void {
    writeParserDiagnostic(
        "warn",
        "[FitParser] Async decoder options update rejected after synchronous boundary:",
        error
    );
}

function writeParserDiagnostic(
    method: "error" | "log" | "warn",
    ...values: unknown[]
): void {
    // eslint-disable-next-line no-console -- Existing parser diagnostics are part of the tested behavior; keep the console boundary in one place.
    console[method](...values);
}

export const DECODER_OPTIONS_SCHEMA: Record<
    keyof DecoderOptions,
    DecoderOptionSchemaEntry
> = {
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

const DECODER_OPTION_KEYS: (keyof DecoderOptions)[] = [
    "applyScaleAndOffset",
    "convertDateTimesToDates",
    "convertTypesToStrings",
    "expandComponents",
    "expandSubFields",
    "includeUnknownData",
    "mergeHeartRates",
];

export function getDefaultDecoderOptions(): DecoderOptions {
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

export function validateDecoderOptions(
    options: null | Partial<DecoderOptions> | undefined
): DecoderOptionsValidationResult {
    const errors: string[] = [],
        validatedOptions: DecoderOptions = {
            ...getDefaultDecoderOptions(),
        };

    if (options && typeof options === "object") {
        const candidateOptions: Partial<Record<keyof DecoderOptions, unknown>> =
            options;
        for (const key of DECODER_OPTION_KEYS) {
            const schema = DECODER_OPTIONS_SCHEMA[key],
                value = candidateOptions[key];
            if (value !== undefined) {
                if (typeof value === schema.type) {
                    validatedOptions[key] = value as boolean;
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

export async function decodeFitFile(
    fileBuffer: unknown,
    options: unknown = {},
    fitsdk: FitSdkModule | null = null
): Promise<FitDecodeResult> {
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

        const processedMessages = labelUnknownMessages(messages);

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

export function getCurrentDecoderOptions(): DecoderOptions {
    return getPersistedDecoderOptions();
}

function getDecoderIntegrityDetails(decoder: FitSdkDecoder): FitFieldValue {
    return typeof decoder.getIntegrityErrors === "function"
        ? decoder.getIntegrityErrors()
        : "No additional details available";
}

export function getPersistedDecoderOptions(): DecoderOptions {
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

function getReadOptionsFilePath(
    readOptions: FitParserReadOptions
): null | string {
    const { filePath } = readOptions;
    return typeof filePath === "string" && filePath.length > 0
        ? filePath
        : null;
}

function normalizeDecodeBuffer(fileBuffer: unknown): Buffer {
    if (
        !(fileBuffer instanceof Buffer) &&
        !(fileBuffer instanceof Uint8Array)
    ) {
        const msg = `Input is not a valid Buffer or Uint8Array. Received type: ${typeof fileBuffer}.`;
        writeParserDiagnostic("error", msg);

        const error = new FitDecodeError(msg, null);
        reportLoadingError(error);
        throw error;
    }

    return Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
}

function reportFileLoaded(
    processedMessages: FitMessages,
    readOptions: FitParserReadOptions,
    operationId: string
): void {
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

function reportLoadingError(error: Error): void {
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

function reportLoadingProgress(progress: number): void {
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

export function resetDecoderOptions(): DecoderOptionsUpdateResult {
    const defaults = getDefaultDecoderOptions();
    return updateDecoderOptions(defaults);
}

export function updateDecoderOptions(
    newOptions: Partial<DecoderOptions>
): DecoderOptionsUpdateResult {
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
            const updateCategory = settingsStateManager.updateCategory;
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

const fitParserModule: FitParserModule = {
    applyUnknownMessageLabels: labelUnknownMessages,
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

export default fitParserModule;

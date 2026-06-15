import type {
    DecoderOptions,
    DecoderOptionsValidationResult,
    FitDecodeMetadata,
    FitDecodeResult,
    FitFieldValue,
    FitFileLoadedPayload,
    FitMessages,
} from "./fit";
import type { FitSdkModule } from "./fitSdk";

/** Settings adapter surface consumed by the FIT parser. */
export interface SettingsStateManager {
    getCategory: (
        category: string
    ) => Partial<DecoderOptions> | null | undefined;
    /**
     * Persist a category synchronously; async adapters are rejected by the
     * parser.
     */
    updateCategory: (
        category: string,
        value: Partial<DecoderOptions>,
        opts?: { silent?: boolean; source?: string }
    ) => unknown;
}

/** FIT file state adapter surface consumed by the FIT parser. */
export interface FitFileStateManager {
    updateLoadingProgress: (progress: number) => void;
    handleFileLoadingError: (error: Error) => void;
    handleFileLoaded: (
        payload: FitFileLoadedPayload,
        context?: { filePath: null | string; source: string }
    ) => void;
    getRecordCount: (messages: FitMessages) => number;
}

/** Performance timing adapter surface consumed by the FIT parser. */
export interface PerformanceMonitor {
    startTimer: (id: string) => void;
    endTimer: (id: string) => void;
    getOperationTime: (id: string) => null | number;
    isEnabled?: boolean;
}

/** Runtime state adapters that can be wired into the FIT parser. */
export interface FitParserStateManagers {
    settingsStateManager?: SettingsStateManager;
    fitFileStateManager?: FitFileStateManager;
    performanceMonitor?: PerformanceMonitor;
}

/** Decoder option schema entry used by the parser settings contract. */
export interface DecoderOptionSchemaEntry {
    type: "boolean";
    default: boolean;
    description: string;
}

/** Human-readable mapping for Garmin SDK unknown message rows. */
export interface UnknownMessageMapping {
    name: string;
    fields: string[];
}

/** Map from unknown FIT message id to display metadata. */
export type UnknownMessageMappings = Record<string, UnknownMessageMapping>;

/** Metadata carried by serialized FIT decode errors. */
export interface FitParserErrorMetadata extends FitDecodeMetadata {
    category: string;
    timestamp: string;
}

/** JSON-safe representation returned by FitDecodeError.toJSON(). */
export interface SerializedFitDecodeError {
    details: FitFieldValue;
    message: string;
    metadata: FitParserErrorMetadata;
    name: "FitDecodeError";
    stack?: string;
}

/** Successful decoder option update result. */
export interface DecoderOptionsUpdateSuccess {
    options: DecoderOptions;
    success: true;
}

/** Failed decoder option update result. */
export interface DecoderOptionsUpdateFailure {
    errors: string[];
    success: false;
}

/** Decoder option update result returned by parser settings APIs. */
export type DecoderOptionsUpdateResult =
    | DecoderOptionsUpdateFailure
    | DecoderOptionsUpdateSuccess;

/** Constructor surface for the parser's custom decode error. */
export type FitDecodeErrorConstructor = new (
    message: string,
    details: FitFieldValue,
    metadata?: FitDecodeMetadata
) => Error & {
    details: FitFieldValue;
    metadata: FitParserErrorMetadata;
    toJSON: () => SerializedFitDecodeError;
};

/** Complete runtime export surface currently exposed by fitParser.js. */
export interface FitParserModule {
    applyUnknownMessageLabels: (messages: FitMessages) => FitMessages;
    decodeFitFile: (
        fileBuffer: Buffer | Uint8Array,
        options?: Partial<DecoderOptions>,
        fitsdk?: FitSdkModule | null
    ) => Promise<FitDecodeResult>;
    DECODER_OPTIONS_SCHEMA: Record<
        keyof DecoderOptions,
        DecoderOptionSchemaEntry
    >;
    FitDecodeError: FitDecodeErrorConstructor;
    getCurrentDecoderOptions: () => DecoderOptions;
    getDefaultDecoderOptions: () => DecoderOptions;
    getPersistedDecoderOptions: () => DecoderOptions;
    initializeStateManagement: (stateManagers?: FitParserStateManagers) => void;
    resetDecoderOptions: () => DecoderOptionsUpdateResult;
    updateDecoderOptions: (
        newOptions: Partial<DecoderOptions>
    ) => DecoderOptionsUpdateResult;
    validateDecoderOptions: (
        options: Partial<DecoderOptions> | null | undefined
    ) => DecoderOptionsValidationResult;
}

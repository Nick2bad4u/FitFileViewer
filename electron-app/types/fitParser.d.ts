export type SettingsStateManager = {
    /**
     * Retrieve a settings category
     */
    getCategory: (category: string) => any;
    /**
     * Update a settings category
     */
    updateCategory: (
        category: string,
        value: any,
        opts?: {
            silent?: boolean;
            source?: string;
        }
    ) => void;
};
export type FitFileStateManager = {
    /**
     * Update decode progress percentage
     */
    updateLoadingProgress: (progress: number) => void;
    /**
     * Record a loading error
     */
    handleFileLoadingError: (error: Error) => void;
    /**
     * Record successful load
     */
    handleFileLoaded: (payload: {
        messages: FitMessages;
        metadata: any;
    }) => void;
    /**
     * Derive record count for metadata
     */
    getRecordCount: (messages: FitMessages) => number;
};
export type PerformanceMonitor = {
    /**
     * Start a named timing operation
     */
    startTimer: (id: string) => void;
    /**
     * End a named timing operation
     */
    endTimer: (id: string) => void;
    /**
     * Get elapsed ms
     */
    getOperationTime: (id: string) => number | null;
    /**
     * Optional flag for enablement
     */
    isEnabled?: boolean;
};
export type DecoderOptionSchemaEntry = {
    /**
     * Primitive type expected (only boolean currently)
     */
    type: "boolean";
    /**
     * Default value
     */
    default: boolean;
    /**
     * Human readable description
     */
    description: string;
};
export type DecoderOptions = {
    applyScaleAndOffset: boolean;
    expandSubFields: boolean;
    expandComponents: boolean;
    convertTypesToStrings: boolean;
    convertDateTimesToDates: boolean;
    includeUnknownData: boolean;
    mergeHeartRates: boolean;
};
export type DecoderOptionsValidationResult = {
    /**
     * Whether supplied options passed validation
     */
    isValid: boolean;
    /**
     * Validation messages (empty when valid)
     */
    errors: string[];
    /**
     * Sanitized + default‑filled options
     */
    validatedOptions: DecoderOptions;
};
export type FitMessages = Record<string, any[] | object[]>;
export type UnknownMessageMapping = {
    /**
     * Canonical label to replace unknown_xxx key
     */
    name: string;
    /**
     * Ordered field labels for generic mapping path
     */
    fields: string[];
};
export type UnknownMessageMappings = Record<string, UnknownMessageMapping>;
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
export function applyUnknownMessageLabels(messages: FitMessages): FitMessages;
/**
 * Decodes a FIT file buffer using the Garmin FIT SDK with integrated state
 * management.
 *
 * @param {Buffer | Uint8Array} fileBuffer - The FIT file buffer to decode.
 * @param {Object} [options] - Optional decoder.read options.
 * @param {Object} [fitsdk] - Optional fitsdk dependency for testing/mocking.
 *
 * @returns {Promise<Object>} Decoded messages or error object.
 */
/**
 * @param {Buffer | Uint8Array} fileBuffer
 * @param {Partial<DecoderOptions>} [options]
 * @param {any} [fitsdk] Optional injected sdk for tests (should expose Decoder
 *   & Stream)
 *
 * @returns {Promise<FitMessages | { error: string; details: any }>}
 */
export function decodeFitFile(
    fileBuffer: Buffer | Uint8Array,
    options?: Partial<DecoderOptions> | undefined,
    fitsdk?: any | undefined
): Promise<
    | FitMessages
    | {
          error: string;
          details: any;
      }
>;
/**
 * Default decoder options schema for state management validation
 */
/** @type {Record<keyof DecoderOptions, DecoderOptionSchemaEntry>} */
export const DECODER_OPTIONS_SCHEMA: Record<
    keyof DecoderOptions,
    DecoderOptionSchemaEntry
>;
/**
 * Custom error class for FIT file decoding issues with enhanced metadata for
 * state management
 *
 * @extends Error
 */
export class FitDecodeError extends Error {
    /**
     * Create a FIT decode error
     *
     * @param {string} message - Error message
     * @param {any} details - Additional error details
     * @param {Object} [metadata] - Optional metadata for state management
     */
    constructor(message: string, details: any, metadata?: Object);
    details: any;
    metadata: {
        constructor: Function;
        toString(): string;
        toLocaleString(): string;
        valueOf(): Object;
        hasOwnProperty(v: PropertyKey): boolean;
        isPrototypeOf(v: Object): boolean;
        propertyIsEnumerable(v: PropertyKey): boolean;
        category: string;
        timestamp: string;
    };
    /**
     * Convert error to JSON for state management
     *
     * @returns {Object} Serializable error object
     */
    toJSON(): Object;
}
/**
 * Get current decoder options
 *
 * @returns {Object} Current decoder options
 */
export function getCurrentDecoderOptions(): Object;
/**
 * Get default decoder options
 *
 * @returns {Object} Default decoder options
 */
/**
 * @returns {DecoderOptions}
 */
export function getDefaultDecoderOptions(): DecoderOptions;
/**
 * Retrieves persisted decoder options from the state management system or
 * fallback to electron-conf.
 *
 * @returns {Object} Persisted decoder options with validation
 */
export function getPersistedDecoderOptions(): Object;
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
export function initializeStateManagement(stateManagers?: {
    settingsStateManager?: SettingsStateManager;
    fitFileStateManager?: FitFileStateManager;
    performanceMonitor?: PerformanceMonitor;
}): void;
/**
 * Reset decoder options to defaults
 *
 * @returns {Object} Result with success status
 */
export function resetDecoderOptions(): Object;
/**
 * Update decoder options in the state management system with validation
 *
 * @param {Object} newOptions - New decoder options to persist
 *
 * @returns {Object} Result with success status and any validation errors
 */
export function updateDecoderOptions(newOptions: Object): Object;
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
export function validateDecoderOptions(
    options: Partial<DecoderOptions> | null | undefined
): DecoderOptionsValidationResult;
import { Buffer } from "buffer";

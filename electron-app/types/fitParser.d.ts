import type { Buffer } from "node:buffer";
import type {
    DecoderOptions,
    DecoderOptionsValidationResult,
    FitDecodeMetadata,
    FitDecodeResult,
    FitFieldValue,
    FitFileLoadedPayload,
    FitMessages,
} from "../shared/fit";
import type { FitSdkModule } from "../shared/fitSdk";

export type {
    DecoderOptions,
    DecoderOptionsValidationResult,
    FitDecodeMetadata,
    FitDecodeResult,
    FitFieldValue,
    FitFileLoadedPayload,
    FitMessages,
} from "../shared/fit";

export interface SettingsStateManager {
    getCategory: (category: string) => Partial<DecoderOptions> | null | undefined;
    updateCategory: (
        category: string,
        value: Partial<DecoderOptions>,
        opts?: { silent?: boolean; source?: string }
    ) => void;
}

export interface FitFileStateManager {
    updateLoadingProgress: (progress: number) => void;
    handleFileLoadingError: (error: Error) => void;
    handleFileLoaded: (
        payload: FitFileLoadedPayload,
        context?: { filePath: null | string; source: string }
    ) => void;
    getRecordCount: (messages: FitMessages) => number;
}

export interface PerformanceMonitor {
    startTimer: (id: string) => void;
    endTimer: (id: string) => void;
    getOperationTime: (id: string) => null | number;
    isEnabled?: boolean;
}

export interface DecoderOptionSchemaEntry {
    type: "boolean";
    default: boolean;
    description: string;
}

export interface UnknownMessageMapping {
    name: string;
    fields: string[];
}

export type UnknownMessageMappings = Record<string, UnknownMessageMapping>;

export interface FitParserStateManagers {
    settingsStateManager?: SettingsStateManager;
    fitFileStateManager?: FitFileStateManager;
    performanceMonitor?: PerformanceMonitor;
}

export interface FitParserErrorMetadata extends FitDecodeMetadata {
    category: string;
    timestamp: string;
}

export interface SerializedFitDecodeError {
    details: FitFieldValue;
    message: string;
    metadata: FitParserErrorMetadata;
    name: "FitDecodeError";
    stack?: string;
}

export interface DecoderOptionsUpdateSuccess {
    fallback?: true;
    options: DecoderOptions;
    success: true;
}

export interface DecoderOptionsUpdateFailure {
    errors: string[];
    success: false;
}

export type DecoderOptionsUpdateResult =
    | DecoderOptionsUpdateFailure
    | DecoderOptionsUpdateSuccess;

export const DECODER_OPTIONS_SCHEMA: Record<
    keyof DecoderOptions,
    DecoderOptionSchemaEntry
>;

export class FitDecodeError extends Error {
    constructor(
        message: string,
        details: FitFieldValue,
        metadata?: FitDecodeMetadata
    );

    details: FitFieldValue;
    metadata: FitParserErrorMetadata;

    toJSON(): SerializedFitDecodeError;
}

export function applyUnknownMessageLabels(messages: FitMessages): FitMessages;

export function decodeFitFile(
    fileBuffer: Buffer | Uint8Array,
    options?: Partial<DecoderOptions>,
    fitsdk?: FitSdkModule | null
): Promise<FitDecodeResult>;

export function getCurrentDecoderOptions(): DecoderOptions;

export function getDefaultDecoderOptions(): DecoderOptions;

export function getPersistedDecoderOptions(): DecoderOptions;

export function initializeStateManagement(
    stateManagers?: FitParserStateManagers
): void;

export function resetDecoderOptions(): DecoderOptionsUpdateResult;

export function updateDecoderOptions(
    newOptions: Partial<DecoderOptions>
): DecoderOptionsUpdateResult;

export function validateDecoderOptions(
    options: Partial<DecoderOptions> | null | undefined
): DecoderOptionsValidationResult;

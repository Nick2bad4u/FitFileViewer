import type { Buffer } from "node:buffer";
import type {
    DecoderOptions,
    DecoderOptionsValidationResult,
    FitDecodeMetadata,
    FitDecodeResult,
    FitFieldValue,
    FitMessages,
} from "../shared/fit";
import type {
    DecoderOptionSchemaEntry,
    DecoderOptionsUpdateResult,
    FitParserErrorMetadata,
    FitParserModule,
    FitParserStateManagers,
    SerializedFitDecodeError,
} from "../shared/fitParser";
import type { FitSdkModule } from "../shared/fitSdk";

export type {
    DecoderOptions,
    DecoderOptionsValidationResult,
    FitDecodeMetadata,
    FitDecodeResult,
    FitFieldValue,
    FitMessages,
} from "../shared/fit";
export type {
    DecoderOptionSchemaEntry,
    DecoderOptionsUpdateFailure,
    DecoderOptionsUpdateResult,
    DecoderOptionsUpdateSuccess,
    FitDecodeErrorConstructor,
    FitFileStateManager,
    FitParserErrorMetadata,
    FitParserModule,
    FitParserStateManagers,
    PerformanceMonitor,
    SerializedFitDecodeError,
    SettingsStateManager,
    UnknownMessageMapping,
    UnknownMessageMappings,
} from "../shared/fitParser";

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

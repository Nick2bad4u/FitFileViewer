export type FitScalar = boolean | Date | null | number | string;

export type FitFieldValue =
    | FitScalar
    | readonly FitFieldValue[]
    | { readonly [key: string]: FitFieldValue };

export interface FitMessageRow {
    readonly [fieldName: string]: FitFieldValue;
}

export type FitMessages = Record<string, FitMessageRow[]>;

export interface FitDecodeMetadata {
    duration?: number;
    filePath?: string;
    recordCount?: number;
    source?: string;
    timestamp?: string;
}

export interface FitDecodeErrorPayload {
    details: FitFieldValue;
    error: string;
    metadata?: FitDecodeMetadata;
}

export type FitDecodeResult = FitMessages | FitDecodeErrorPayload;

export interface FitFileLoadedPayload {
    messages: FitMessages;
    metadata: FitDecodeMetadata;
}

export interface DecoderOptions {
    applyScaleAndOffset: boolean;
    convertDateTimesToDates: boolean;
    convertTypesToStrings: boolean;
    expandComponents: boolean;
    expandSubFields: boolean;
    includeUnknownData: boolean;
    mergeHeartRates: boolean;
}

export type PartialDecoderOptions = Partial<DecoderOptions>;

export interface DecoderOptionsValidationResult {
    errors: string[];
    isValid: boolean;
    validatedOptions: DecoderOptions;
}

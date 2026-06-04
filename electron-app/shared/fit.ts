/** Primitive value emitted from decoded FIT fields. */
export type FitScalar = boolean | Date | null | number | string;

/** Recursive field value shape used for decoded FIT messages. */
export type FitFieldValue =
    | FitScalar
    | readonly FitFieldValue[]
    | FitFieldObject;

/** Recursive object value emitted from decoded FIT fields. */
export type FitFieldObject = {
    readonly [fieldName in string]: FitFieldValue;
};

/** Decoded FIT message fields keyed by FIT field name. */
export type FitMessageRow = Readonly<Record<string, FitFieldValue>>;

/** Decoded FIT messages grouped by FIT message type. */
export type FitMessages = Record<string, FitMessageRow[]>;

/** Metadata collected while loading or decoding a FIT file. */
export interface FitDecodeMetadata {
    decodingOptions?: PartialDecoderOptions & { filePath?: unknown };
    duration?: number;
    filePath?: string;
    processingTime?: null | number;
    recordCount?: number;
    source?: string;
    timestamp?: string;
}

/** Error payload returned when FIT decoding fails. */
export interface FitDecodeErrorPayload {
    details: FitFieldValue;
    error: string;
    metadata?: FitDecodeMetadata;
}

/** Successful decoded messages or a structured decode failure. */
export type FitDecodeResult = FitMessages | FitDecodeErrorPayload;

/** Payload sent to the renderer after a FIT file has loaded. */
export interface FitFileLoadedPayload {
    messages: FitMessages;
    metadata: FitDecodeMetadata;
}

/** Options passed to the FIT decoder. */
export interface DecoderOptions {
    applyScaleAndOffset: boolean;
    convertDateTimesToDates: boolean;
    convertTypesToStrings: boolean;
    expandComponents: boolean;
    expandSubFields: boolean;
    includeUnknownData: boolean;
    mergeHeartRates: boolean;
}

/** Partial decoder options accepted from user or persisted settings. */
export type PartialDecoderOptions = Partial<DecoderOptions>;

/** Result of normalizing and validating decoder options. */
export interface DecoderOptionsValidationResult {
    errors: string[];
    isValid: boolean;
    validatedOptions: DecoderOptions;
}

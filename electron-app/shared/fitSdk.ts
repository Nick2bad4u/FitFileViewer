import type { FitFieldValue, FitMessages, PartialDecoderOptions } from "./fit";

/** Callback invoked by the Garmin SDK after decoding one message. */
export type FitSdkMessageListener = (
    messageNumber: number,
    message: Record<string, FitFieldValue>
) => void;

/** Callback invoked by the Garmin SDK when it decodes a message definition. */
export type FitSdkMessageDefinitionListener = (
    messageDefinition: Record<string, unknown>
) => void;

/** Callback invoked when developer field metadata is decoded. */
export type FitSdkFieldDescriptionListener = (
    key: string,
    developerDataIdMessage: Record<string, FitFieldValue>,
    fieldDescriptionMessage: Record<string, FitFieldValue>
) => void;

/** Options accepted by the subset of Decoder.read used by FitFileViewer. */
export interface FitSdkReadOptions extends PartialDecoderOptions {
    dataOnly?: boolean;
    decodeMemoGlobs?: boolean;
    fieldDescriptionListener?: FitSdkFieldDescriptionListener | null;
    mesgDefinitionListener?: FitSdkMessageDefinitionListener | null;
    mesgListener?: FitSdkMessageListener | null;
    skipHeader?: boolean;
}

/** Result returned from Garmin SDK Decoder.read. */
export interface FitSdkReadResult {
    errors?: FitFieldValue[] | null;
    messages?: FitMessages | null;
    profileVersion?: null | string;
}

/** Runtime stream object created by the Garmin SDK. */
export interface FitSdkStream {
    readonly bytesRead: number;
    readonly length: number;
    readonly position: number;
}

/** Static factory surface FitFileViewer uses to create SDK streams. */
export interface FitSdkStreamConstructor {
    fromArrayBuffer(arrayBuffer: ArrayBuffer): FitSdkStream;
    fromBuffer(buffer: Buffer | Uint8Array): FitSdkStream;
    fromByteArray(data: readonly number[]): FitSdkStream;
}

/** Decoder instance surface FitFileViewer uses from the Garmin SDK. */
export interface FitSdkDecoder {
    checkIntegrity(): boolean;
    getIntegrityErrors?: () => FitFieldValue;
    isFIT(): boolean;
    read(options?: FitSdkReadOptions): FitSdkReadResult;
}

/** Decoder constructor and static helpers exported by the Garmin SDK. */
export interface FitSdkDecoderConstructor {
    new (stream: FitSdkStream): FitSdkDecoder;
    isFIT(stream: FitSdkStream): boolean;
}

/** Public Garmin SDK module surface used by the FIT parser. */
export interface FitSdkModule {
    Decoder: FitSdkDecoderConstructor;
    Stream: FitSdkStreamConstructor;
}

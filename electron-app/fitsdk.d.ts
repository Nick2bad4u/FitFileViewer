/* Minimal ambient module declaration for @garmin/fitsdk to satisfy TypeScript checker.
 * API surface refined incrementally.
 */

export {}; // ensure this file is treated as a module

declare module "@garmin/fitsdk" {
    interface ReadResult {
        messages: Record<string, any>;
        errors?: any[];
    }
    interface DecoderOptions {
        applyScaleAndOffset?: boolean;
        expandSubFields?: boolean;
        expandComponents?: boolean;
        convertTypesToStrings?: boolean;
        convertDateTimesToDates?: boolean;
        includeUnknownData?: boolean;
        mergeHeartRates?: boolean;
        [key: string]: any;
    }
    class Stream {
        static fromBuffer(buffer: Buffer | Uint8Array): Stream;
    }
    class Decoder {
        constructor(stream: Stream);
        checkIntegrity(): boolean;
        getIntegrityErrors?(): any;
        read(options?: DecoderOptions): ReadResult;
    }
    export { Stream, Decoder };
}

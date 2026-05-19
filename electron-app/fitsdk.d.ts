/* Minimal ambient module declaration for @garmin/fitsdk to satisfy TypeScript checker.
 * API surface refined incrementally.
 */

export {}; // ensure this file is treated as a module

declare module "@garmin/fitsdk" {
    import type {
        FitSdkReadResult,
        PartialDecoderOptions,
    } from "./shared/fit";

    class Stream {
        static fromBuffer(buffer: Buffer | Uint8Array): Stream;
    }
    class Decoder {
        constructor(stream: Stream);
        checkIntegrity(): boolean;
        getIntegrityErrors?(): unknown;
        read(options?: PartialDecoderOptions): FitSdkReadResult;
    }
    export { Stream, Decoder };
}

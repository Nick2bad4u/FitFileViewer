// @vitest-environment node
import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type FileReadPayloadModule = {
    MAX_FIT_FILE_BYTES: number;
    assertFitFileByteLength: (byteLength: number) => void;
    normalizeFileReadResultToArrayBuffer: (data: unknown) => ArrayBuffer;
};

type FitIpcPayloadModule = {
    MAX_FIT_IPC_PAYLOAD_BYTES: number;
    normalizeFitIpcPayloadToBuffer: (data: unknown) => Buffer;
};

const cjsRequire = createRequire(import.meta.url);
const fileReadPayload = cjsRequire(
    "../../../../electron-app/main/ipc/fileReadPayload.js"
) as FileReadPayloadModule;
const fitIpcPayload = cjsRequire(
    "../../../../electron-app/main/ipc/fitIpcPayload.js"
) as FitIpcPayloadModule;

function bytesFromArrayBuffer(buffer: ArrayBuffer): number[] {
    return Array.from(new Uint8Array(buffer));
}

function bytesFromBuffer(buffer: Buffer): number[] {
    return Array.from(buffer);
}

describe("binary IPC payload boundaries", () => {
    it("normalizes file read ArrayBuffer payloads without sharing the source buffer", () => {
        expect.assertions(2);

        const source = Uint8Array.from([
            1,
            2,
            3,
            4,
        ]).buffer;
        const normalized =
            fileReadPayload.normalizeFileReadResultToArrayBuffer(source);

        expect(bytesFromArrayBuffer(normalized)).toStrictEqual([
            1,
            2,
            3,
            4,
        ]);
        expect(normalized).not.toBe(source);
    });

    it("normalizes only the visible bytes from file read typed-array views", () => {
        expect.assertions(1);

        const backingBuffer = Uint8Array.from([
            9,
            8,
            7,
            6,
            5,
        ]).buffer;
        const view = new Uint8Array(backingBuffer, 1, 3);
        const normalized =
            fileReadPayload.normalizeFileReadResultToArrayBuffer(view);

        expect(bytesFromArrayBuffer(normalized)).toStrictEqual([
            8,
            7,
            6,
        ]);
    });

    it("rejects invalid file read payload values", () => {
        expect.assertions(2);

        expect(() =>
            fileReadPayload.normalizeFileReadResultToArrayBuffer("not bytes")
        ).toThrow(Error);
        expect(() =>
            fileReadPayload.normalizeFileReadResultToArrayBuffer("not bytes")
        ).toThrow("Unexpected file read result");
    });

    it("validates file read byte lengths at the IPC boundary", () => {
        expect.assertions(4);

        expect(fileReadPayload.assertFitFileByteLength(0)).toBeUndefined();
        expect(() =>
            fileReadPayload.assertFitFileByteLength(
                fileReadPayload.MAX_FIT_FILE_BYTES + 1
            )
        ).toThrow("File size exceeds 100MB limit");
        expect(() =>
            fileReadPayload.assertFitFileByteLength(Number.POSITIVE_INFINITY)
        ).toThrow(TypeError);
        expect(() => fileReadPayload.assertFitFileByteLength(-1)).toThrow(
            TypeError
        );
    });

    it("normalizes FIT IPC ArrayBuffer payloads to Buffers", () => {
        expect.assertions(2);

        const source = Uint8Array.from([
            16,
            32,
            64,
        ]).buffer;
        const normalized = fitIpcPayload.normalizeFitIpcPayloadToBuffer(source);

        expect(normalized).toBeInstanceOf(Buffer);
        expect(bytesFromBuffer(normalized)).toStrictEqual([
            16,
            32,
            64,
        ]);
    });

    it("normalizes only the visible bytes from FIT IPC typed-array views", () => {
        expect.assertions(1);

        const backingBuffer = Uint8Array.from([
            4,
            3,
            2,
            1,
        ]).buffer;
        const view = new Uint8Array(backingBuffer, 1, 2);
        const normalized = fitIpcPayload.normalizeFitIpcPayloadToBuffer(view);

        expect(bytesFromBuffer(normalized)).toStrictEqual([3, 2]);
    });

    it("rejects invalid FIT IPC payload values", () => {
        expect.assertions(3);

        expect(fitIpcPayload.MAX_FIT_IPC_PAYLOAD_BYTES).toBe(
            fileReadPayload.MAX_FIT_FILE_BYTES
        );
        expect(() =>
            fitIpcPayload.normalizeFitIpcPayloadToBuffer(null)
        ).toThrow(TypeError);
        expect(() =>
            fitIpcPayload.normalizeFitIpcPayloadToBuffer(null)
        ).toThrow("Invalid FIT data: expected ArrayBuffer");
    });
});

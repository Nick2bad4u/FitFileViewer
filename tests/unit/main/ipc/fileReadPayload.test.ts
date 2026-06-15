import { describe, expect, it } from "vitest";
import {
    MAX_FIT_FILE_BYTES,
    assertFitFileByteLength,
    normalizeFileReadResultToArrayBuffer,
} from "../../../../electron-app/main/ipc/fileReadPayload.js";

function createForeignArrayBuffer(bytes: number[]): ArrayBuffer {
    const frame = document.createElement("iframe");
    document.body.append(frame);

    try {
        const foreignUint8Array = frame.contentWindow?.Uint8Array;
        if (!foreignUint8Array) {
            throw new Error("Unable to create foreign ArrayBuffer realm");
        }

        return foreignUint8Array.from(bytes).buffer as ArrayBuffer;
    } finally {
        frame.remove();
    }
}

describe("fileReadPayload", () => {
    it("normalizes Buffer slices without leaking backing bytes", () => {
        expect.assertions(1);

        const source = Buffer.from([
            9,
            1,
            2,
            3,
            8,
        ]);
        const view = source.subarray(1, 4);

        const arrayBuffer = normalizeFileReadResultToArrayBuffer(view);

        expect([...new Uint8Array(arrayBuffer)]).toStrictEqual([
            1,
            2,
            3,
        ]);
    });

    it("copies ArrayBuffer values before returning them", () => {
        expect.assertions(2);

        const source = Uint8Array.from([
            1,
            2,
            3,
        ]).buffer;

        const arrayBuffer = normalizeFileReadResultToArrayBuffer(source);

        expect(arrayBuffer).not.toBe(source);
        expect([...new Uint8Array(arrayBuffer)]).toStrictEqual([
            1,
            2,
            3,
        ]);
    });

    it("accepts ArrayBuffer values from another JavaScript realm", () => {
        expect.assertions(1);

        const source = createForeignArrayBuffer([
            4,
            5,
            6,
        ]);

        const arrayBuffer = normalizeFileReadResultToArrayBuffer(source);

        expect([...new Uint8Array(arrayBuffer)]).toStrictEqual([
            4,
            5,
            6,
        ]);
    });

    it("rejects non-binary file read results", () => {
        expect.assertions(1);

        expect(() => normalizeFileReadResultToArrayBuffer("abc")).toThrow(
            "Unexpected file read result"
        );
    });

    it("rejects oversized file reads", () => {
        expect.assertions(1);

        expect(() => assertFitFileByteLength(MAX_FIT_FILE_BYTES + 1)).toThrow(
            "File size exceeds 100MB limit"
        );
    });
});

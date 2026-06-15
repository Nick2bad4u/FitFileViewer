import { describe, expect, it } from "vitest";
import {
    MAX_FIT_IPC_PAYLOAD_BYTES,
    normalizeFitIpcPayloadToBuffer,
} from "../../../../electron-app/main/ipc/fitIpcPayload.js";

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

describe("fitIpcPayload", () => {
    it("normalizes ArrayBuffer payloads into Node buffers", () => {
        expect.assertions(2);

        const source = Uint8Array.from([
            1,
            2,
            3,
            4,
        ]);

        const buffer = normalizeFitIpcPayloadToBuffer(source.buffer);

        expect({ isBuffer: Buffer.isBuffer(buffer) }).toStrictEqual({
            isBuffer: true,
        });
        expect([...buffer]).toStrictEqual([
            1,
            2,
            3,
            4,
        ]);
    });

    it("normalizes ArrayBuffer payloads from another JavaScript realm", () => {
        expect.assertions(1);

        const source = createForeignArrayBuffer([
            4,
            5,
            6,
        ]);

        const buffer = normalizeFitIpcPayloadToBuffer(source);

        expect([...buffer]).toStrictEqual([
            4,
            5,
            6,
        ]);
    });

    it("normalizes ArrayBufferView payload slices without leaking backing bytes", () => {
        expect.assertions(1);

        const source = Uint8Array.from([
            9,
            1,
            2,
            3,
            8,
        ]);
        const view = new Uint8Array(source.buffer, 1, 3);

        const buffer = normalizeFitIpcPayloadToBuffer(view);

        expect([...buffer]).toStrictEqual([
            1,
            2,
            3,
        ]);
    });

    it("rejects unsupported payload shapes", () => {
        expect.assertions(1);

        expect(() => normalizeFitIpcPayloadToBuffer("not bytes")).toThrow(
            "Invalid FIT data: expected ArrayBuffer"
        );
    });

    it("rejects oversized renderer payloads before decoding", () => {
        expect.assertions(1);

        expect(() =>
            normalizeFitIpcPayloadToBuffer(
                new ArrayBuffer(MAX_FIT_IPC_PAYLOAD_BYTES + 1)
            )
        ).toThrow("File size exceeds 100MB limit");
    });
});

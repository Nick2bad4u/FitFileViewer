import { describe, expect, it } from "vitest";
import { convertArrayBufferToBase64 } from "../../../../../electron-app/utils/formatting/converters/convertArrayBufferToBase64.js";

function bufferFromBytes(bytes: readonly number[]): ArrayBuffer {
    return Uint8Array.from(bytes).buffer;
}

function patternedBuffer(length: number): ArrayBuffer {
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);

    for (let index = 0; index < view.length; index += 1) {
        view[index] = index % 256;
    }

    return buffer;
}

describe(convertArrayBufferToBase64, () => {
    it.each([
        [[], ""],
        [[65], "QQ=="],
        [[65, 66], "QUI="],
        [
            [
                65,
                66,
                67,
            ],
            "QUJD",
        ],
        [
            [
                72,
                101,
                108,
                108,
                111,
            ],
            "SGVsbG8=",
        ],
        [
            [
                0,
                0,
                0,
                0,
            ],
            "AAAAAA==",
        ],
        [
            [
                255,
                255,
                255,
                255,
            ],
            "/////w==",
        ],
        [
            [
                14,
                0x10,
                0x20,
                0,
                0,
                0,
                0,
                0,
                0x2e,
                0x46,
                0x49,
                0x54,
                0,
                0,
            ],
            "DhAgAAAAAAAuRklUAAA=",
        ],
    ])("encodes %j as %s", (bytes, expected) => {
        expect.hasAssertions();

        expect(convertArrayBufferToBase64(bufferFromBytes(bytes))).toBe(
            expected
        );
    });

    it("throws for invalid-input values", () => {
        expect.hasAssertions();

        const cases: Array<[unknown, string]> = [
            [null, "object"],
            [undefined, "undefined"],
            ["not a buffer", "string"],
            [123, "number"],
            [{}, "object"],
            [[], "object"],
            [
                new Uint8Array([
                    1,
                    2,
                    3,
                ]),
                "object",
            ],
        ];

        for (const [value, type] of cases) {
            expect(() =>
                convertArrayBufferToBase64(value as ArrayBuffer)
            ).toThrow(`Expected ArrayBuffer, received ${type}`);
        }
    });

    it("matches browser base64 encoding for text bytes", () => {
        expect.hasAssertions();

        const text = "Hello, World!";
        const bytes = Array.from(text, (character) => character.charCodeAt(0));

        expect(convertArrayBufferToBase64(bufferFromBytes(bytes))).toBe(
            btoa(text)
        );
    });

    it("uses chunked encoding for buffers larger than the 32KB argument limit", () => {
        expect.hasAssertions();

        const buffer = patternedBuffer(0x80_00 + 1000);
        const result = convertArrayBufferToBase64(buffer);

        expect(result).toMatch(/^[A-Za-z0-9+/]*={0,2}$/u);
        expect(result).toHaveLength(Math.ceil(buffer.byteLength / 3) * 4);
        expect(result).toBe(Buffer.from(buffer).toString("base64"));
    });
});

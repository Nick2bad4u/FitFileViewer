import { describe, expect, it } from "vitest";

import {
    getFitFileBufferValidationError,
    MAX_FIT_FILE_BYTES,
} from "../../../../electron-app/utils/files/import/fitFileValidation.js";

describe("fitFileValidation", () => {
    it("rejects non-ArrayBuffer inputs", () => {
        expect.assertions(1);

        expect(getFitFileBufferValidationError(new Uint8Array(1))).toBe(
            "Failed to read file as ArrayBuffer"
        );
    });

    it("rejects empty buffers unless explicitly allowed", () => {
        expect.assertions(2);

        const buffer = new ArrayBuffer(0);

        expect(getFitFileBufferValidationError(buffer)).toBe(
            "Selected file appears to be empty"
        );
        expect(
            getFitFileBufferValidationError(buffer, { allowEmpty: true })
        ).toBeNull();
    });

    it("enforces the FIT file size cap unless disabled", () => {
        expect.assertions(3);

        expect(
            getFitFileBufferValidationError(new ArrayBuffer(MAX_FIT_FILE_BYTES))
        ).toBeNull();

        const oversizedBuffer = new ArrayBuffer(MAX_FIT_FILE_BYTES + 1);

        expect(getFitFileBufferValidationError(oversizedBuffer)).toBe(
            "File size exceeds 100MB limit"
        );
        expect(
            getFitFileBufferValidationError(oversizedBuffer, {
                enforceMaxSize: false,
            })
        ).toBeNull();
    });
});

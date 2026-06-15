import { describe, expect, it } from "vitest";
import {
    isSafeMainStateOperationId,
    isSafeMainStatePath,
    validateMainStateOperationIdInput,
    validateMainStatePathInput,
} from "../../electron-app/shared/mainStatePathPolicy.js";

describe("main-state path policy", () => {
    it("accepts conservative dot paths and operation ids", () => {
        expect.assertions(6);

        expect(validateMainStatePathInput(" loadedFitFilePath ")).toBe(
            "loadedFitFilePath"
        );
        expect(validateMainStatePathInput("operations.fitFile:decode")).toBe(
            "operations.fitFile:decode"
        );
        expect(
            validateMainStatePathInput(undefined, { allowUndefined: true })
        ).toBeUndefined();
        expect(validateMainStateOperationIdInput(" test-op_1 ")).toBe(
            "test-op_1"
        );
        expect(isSafeMainStatePath("metrics.operationTimes")).toBe(true);
        expect(isSafeMainStateOperationId("fitFile_decode_1")).toBe(true);
    });

    it("rejects unsafe or malformed state paths", () => {
        expect.assertions(10);

        for (const value of [
            "",
            "ui..theme",
            "operations.__proto__.polluted",
            "operations.constructor.prototype",
            "operations.bad/value",
            `operations.${"x".repeat(129)}`,
            "operations.\u0000bad",
            "x".repeat(513),
        ]) {
            expect(() => validateMainStatePathInput(value)).toThrow(
                /Invalid main-state path provided|Unsafe main-state path provided/u
            );
        }

        expect(isSafeMainStatePath("operations.__proto__.polluted")).toBe(
            false
        );
        expect(isSafeMainStatePath(null)).toBe(false);
    });

    it("rejects unsafe or malformed operation ids", () => {
        expect.assertions(7);

        for (const value of [
            "",
            "operation.with.dot",
            "__proto__",
            "constructor",
            "bad/id",
            "x".repeat(129),
        ]) {
            expect(() => validateMainStateOperationIdInput(value)).toThrow(
                /Invalid main-state operation id provided|Unsafe main-state operation id provided/u
            );
        }

        expect(isSafeMainStateOperationId("operation.with.dot")).toBe(false);
    });
});

import { describe, expect, it } from "vitest";
import { getErrorInfo } from "../../../electron-app/utils/logging/index.js";

describe(getErrorInfo, () => {
    it("extracts message and stack from native errors", () => {
        expect.hasAssertions();

        const result = getErrorInfo(new TypeError("Invalid FIT payload"));

        expect(result).toEqual({
            message: "Invalid FIT payload",
            stack: expect.stringContaining("TypeError: Invalid FIT payload"),
        });
    });

    it("extracts string message and stack fields from error-like objects", () => {
        expect.hasAssertions();

        expect(
            getErrorInfo({
                message: "ENOENT: no such file or directory",
                stack: "Error: ENOENT\n    at Object.openSync",
                code: "ENOENT",
            })
        ).toEqual({
            message: "ENOENT: no such file or directory",
            stack: "Error: ENOENT\n    at Object.openSync",
        });
    });

    it("falls back to object stringification for missing or non-string messages", () => {
        expect.hasAssertions();

        expect(getErrorInfo({ stack: "Stack without message" })).toEqual({
            message: "[object Object]",
            stack: "Stack without message",
        });

        expect(
            getErrorInfo({
                message: 404,
                stack: { frame: "ignored" },
            })
        ).toEqual({ message: "[object Object]" });
    });

    it("stringifies primitive thrown values", () => {
        expect.hasAssertions();

        const expectedMessages = new Map<unknown, string>([
            ["Simple string error", "Simple string error"],
            [404, "404"],
            [false, "false"],
            [null, "null"],
            [undefined, "undefined"],
            [Symbol("fit-error"), "Symbol(fit-error)"],
        ]);

        for (const [thrownValue, message] of expectedMessages) {
            expect(getErrorInfo(thrownValue)).toEqual({ message });
        }
    });

    it("does not leak unrelated properties into the normalized result", () => {
        expect.hasAssertions();

        const result = getErrorInfo({
            message: "Request failed",
            stack: "Network stack",
            response: { status: 500 },
        });

        expect(Object.keys(result)).toEqual(["message", "stack"]);
    });
});

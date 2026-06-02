import { describe, expect, it } from "vitest";
import { getErrorInfo } from "../../../electron-app/utils/logging/index.js";

describe(getErrorInfo, () => {
    it("extracts message and stack from native errors", () => {
        expect.assertions(1);

        const error = new TypeError("Invalid FIT payload");
        const result = getErrorInfo(error);

        expect(result).toStrictEqual({
            message: "Invalid FIT payload",
            stack: error.stack,
        });
    });

    it("extracts string message and stack fields from error-like objects", () => {
        expect.assertions(1);

        expect(
            getErrorInfo({
                message: "ENOENT: no such file or directory",
                stack: "Error: ENOENT\n    at Object.openSync",
                code: "ENOENT",
            })
        ).toStrictEqual({
            message: "ENOENT: no such file or directory",
            stack: "Error: ENOENT\n    at Object.openSync",
        });
    });

    it("falls back to object stringification for missing or non-string messages", () => {
        expect.assertions(2);

        expect(getErrorInfo({ stack: "Stack without message" })).toStrictEqual({
            message: "[object Object]",
            stack: "Stack without message",
        });

        expect(
            getErrorInfo({
                message: 404,
                stack: { frame: "ignored" },
            })
        ).toStrictEqual({ message: "[object Object]" });
    });

    it("stringifies primitive thrown values", () => {
        expect.assertions(6);

        const expectedMessages = new Map<unknown, string>([
            ["Simple string error", "Simple string error"],
            [404, "404"],
            [false, "false"],
            [null, "null"],
            [undefined, "undefined"],
            [Symbol("fit-error"), "Symbol(fit-error)"],
        ]);

        for (const [thrownValue, message] of expectedMessages) {
            expect(getErrorInfo(thrownValue)).toStrictEqual({ message });
        }
    });

    it("does not leak unrelated properties into the normalized result", () => {
        expect.assertions(1);

        const result = getErrorInfo({
            message: "Request failed",
            stack: "Network stack",
            response: { status: 500 },
        });

        expect(Object.keys(result)).toStrictEqual(["message", "stack"]);
    });
});

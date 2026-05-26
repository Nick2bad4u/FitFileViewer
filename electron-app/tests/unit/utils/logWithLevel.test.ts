import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logWithLevel } from "../../../utils/logging/index.js";

const fixedTimestamp = "2023-01-01T12:00:00.000Z";
const expectedBase = `${fixedTimestamp} [FFV]`;

describe("logWithLevel", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let logSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(fixedTimestamp));

        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete (
            globalThis as typeof globalThis & {
                __vitest_object_keys_allow_throw?: boolean;
            }
        ).__vitest_object_keys_allow_throw;
    });

    it("routes each supported level to the matching console method", () => {
        expect(logWithLevel("info", "Loaded file")).toBeUndefined();
        expect(logWithLevel("warn", "Missing optional field")).toBeUndefined();
        expect(logWithLevel("error", "Failed to parse file")).toBeUndefined();
        expect(logWithLevel("log", "Debug detail")).toBeUndefined();

        expect(infoSpy).toHaveBeenCalledWith(`${expectedBase} Loaded file`);
        expect(warnSpy).toHaveBeenCalledWith(
            `${expectedBase} Missing optional field`
        );
        expect(errorSpy).toHaveBeenCalledWith(
            `${expectedBase} Failed to parse file`
        );
        expect(logSpy).toHaveBeenCalledWith(`${expectedBase} Debug detail`);
    });

    it("falls back to console.log for unknown levels", () => {
        expect(logWithLevel("debug", "Renderer trace")).toBeUndefined();

        expect(logSpy).toHaveBeenCalledWith(`${expectedBase} Renderer trace`);
        expect(infoSpy).not.toHaveBeenCalled();
        expect(warnSpy).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it("logs a shallow-cloned context payload only for non-empty plain objects", () => {
        const context = { fileName: "activity.fit", records: 125 };

        logWithLevel("info", "Parsed FIT file", context);
        logWithLevel("info", "No context");
        logWithLevel("info", "Empty context", {});
        logWithLevel("info", "Array context", [
            1,
            2,
            3,
        ] as never);
        context.records = 250;

        expect(infoSpy).toHaveBeenNthCalledWith(
            1,
            `${expectedBase} Parsed FIT file`,
            {
                fileName: "activity.fit",
                records: 125,
            }
        );
        expect(infoSpy.mock.calls[0]?.[1]).not.toBe(context);
        expect(infoSpy).toHaveBeenNthCalledWith(
            2,
            `${expectedBase} No context`
        );
        expect(infoSpy).toHaveBeenNthCalledWith(
            3,
            `${expectedBase} Empty context`
        );
        expect(infoSpy).toHaveBeenNthCalledWith(
            4,
            `${expectedBase} Array context`
        );
    });

    it("skips context properties whose getters throw", () => {
        const context = { keep: "value" };
        Object.defineProperty(context, "skip", {
            enumerable: true,
            get() {
                throw new Error("getter failed");
            },
        });

        expect(
            logWithLevel("info", "Partial context", context)
        ).toBeUndefined();

        expect(infoSpy).toHaveBeenCalledWith(
            `${expectedBase} Partial context`,
            { keep: "value" }
        );
    });

    it("emits the minimal fallback line when logging setup fails", () => {
        vi.spyOn(Object, "keys").mockImplementationOnce(() => {
            throw new Error("Object.keys failed");
        });

        logWithLevel("info", "Broken context", { key: "value" });

        expect(logSpy).toHaveBeenCalledWith(
            "[FFV][logWithLevel] Logging failure"
        );
        expect(
            (
                globalThis as typeof globalThis & {
                    __vitest_object_keys_allow_throw?: boolean;
                }
            ).__vitest_object_keys_allow_throw
        ).toBe(false);
    });

    it("does not throw when the selected console method fails", () => {
        warnSpy.mockImplementationOnce(() => {
            throw new Error("console.warn failed");
        });

        expect(() => logWithLevel("warn", "Fallback path")).not.toThrow();
        expect(logSpy).toHaveBeenCalledWith(
            "[FFV][logWithLevel] Logging failure"
        );
    });
});

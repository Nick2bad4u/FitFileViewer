import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logWithLevel } from "../../../utils/logging/index.js";

describe("logWithLevel.js - additional branch coverage", () => {
    const originalConsole = { ...console } as any;
    let infoSpy: any, warnSpy: any, errorSpy: any, logSpy: any;

    beforeEach(() => {
        vi.restoreAllMocks();
        infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore original console methods to avoid cross-test pollution
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.log = originalConsole.log;
    });

    it("logs with 'info' level without context payload", () => {
        logWithLevel("info", "hello");
        expect(infoSpy).toHaveBeenCalledTimes(1);
        // Should be called with only the base string when no context
        expect(infoSpy.mock.calls[0].length).toBe(1);
        expect(typeof infoSpy.mock.calls[0][0]).toBe("string");
    });

    it("logs with 'warn' level and shallow-cloned context payload", () => {
        const ctx = { a: 1, b: "x" };
        logWithLevel("warn", "with ctx", ctx);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        // Should be called with base string and cloned context
        expect(warnSpy.mock.calls[0].length).toBe(2);
        expect(warnSpy.mock.calls[0][1]).toEqual(ctx);
        // Ensure not the same reference (shallow clone)
        expect(warnSpy.mock.calls[0][1]).not.toBe(ctx);
    });

    it("logs with 'error' level and ignores array context (not plain object)", () => {
        // Arrays should not be treated as context objects
        logWithLevel("error", "array ctx", [
            1,
            2,
            3,
        ] as any);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy.mock.calls[0].length).toBe(1);
    });

    it("handles context with throwing getter by skipping payload", () => {
        const ctx = Object.create(null);
        Object.defineProperty(ctx, "onlyGetter", {
            enumerable: true,
            get() {
                throw new Error("boom");
            },
        });
        // Only property throws on access -> hasProps = true, hasAny = false -> payload undefined
        logWithLevel("log", "getter throws", ctx);
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy.mock.calls[0].length).toBe(1);
    });

    it("falls back to minimal line when console method throws", () => {
        // Cause inner call to throw to reach outer catch fallback path
        warnSpy.mockImplementation(() => {
            throw new Error("console warn fails");
        });
        logWithLevel("warn", "trigger fallback");
        // Fallback uses console.log with a specific marker
        expect(logSpy).toHaveBeenCalled();
        const joined = logSpy.mock.calls
            .map((c: any[]) => c.join(" "))
            .join("\n");
        expect(joined).toContain("[FFV][logWithLevel] Logging failure");
    });

    it("resets test flag in finally even on success", () => {
        // Ensure the helper sets then resets the flag
        // Start with any state; after call it must be false
        (globalThis as any).__vitest_object_keys_allow_throw = true;
        logWithLevel("info", "finalize flag");
        expect((globalThis as any).__vitest_object_keys_allow_throw).toBe(
            false
        );
    });
});

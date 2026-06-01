import { afterEach, describe, expect, it, vi } from "vitest";

type LoggingIndexModule =
    typeof import("../../../../../electron-app/utils/logging/index.js");

async function fresh(): Promise<LoggingIndexModule> {
    vi.resetModules();
    return import("../../../../../electron-app/utils/logging/index.js");
}

describe("logWithLevel.strict", () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        Reflect.deleteProperty(globalThis, "__vitest_object_keys_allow_throw");
    });

    it("logs at all levels with and without payload", async () => {
        expect.assertions(6);

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-02T03:04:05.006Z"));

        const { logWithLevel } = await fresh();
        const clog = vi.spyOn(console, "log").mockImplementation(() => {});
        const cinfo = vi.spyOn(console, "info").mockImplementation(() => {});
        const cwarn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const cerr = vi.spyOn(console, "error").mockImplementation(() => {});

        expect(logWithLevel("log", "hello")).toBeUndefined();
        expect(clog).toHaveBeenCalledWith(
            "2026-01-02T03:04:05.006Z [FFV] hello"
        );

        logWithLevel("info", "world", { a: 1 });
        expect(cinfo).toHaveBeenCalledWith(
            "2026-01-02T03:04:05.006Z [FFV] world",
            { a: 1 }
        );

        logWithLevel("warn", "w", {}); // empty object -> no payload
        expect(cwarn).toHaveBeenCalledWith("2026-01-02T03:04:05.006Z [FFV] w");

        logWithLevel("error", "e", [1, 2] as unknown as Record<
            string,
            unknown
        >); // array -> not treated as object
        expect(cerr).toHaveBeenCalledWith("2026-01-02T03:04:05.006Z [FFV] e");
        expect(globalThis.__vitest_object_keys_allow_throw).toBe(false);
    });

    it("falls back to minimal line when Object.keys throws", async () => {
        expect.assertions(3);

        const { logWithLevel } = await fresh();
        const baseLog = vi.spyOn(console, "log").mockImplementation(() => {});
        const ctx: Record<string, unknown> = { a: 1 };
        // Make Object.keys throw only for our specific context object
        const originalKeys = Object.keys;
        const keysSpy = vi.spyOn(Object, "keys").mockImplementation((obj) => {
            if (obj === ctx) {
                throw new Error("keys fail");
            }
            return originalKeys(obj);
        });

        expect(logWithLevel("info", "boom", ctx)).toBeUndefined();
        expect(baseLog).toHaveBeenCalledWith(
            "[FFV][logWithLevel] Logging failure"
        );
        expect(globalThis.__vitest_object_keys_allow_throw).toBe(false);

        keysSpy.mockRestore();
    });
});

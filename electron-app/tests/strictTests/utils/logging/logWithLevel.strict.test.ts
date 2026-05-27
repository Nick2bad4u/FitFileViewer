import { afterEach, describe, expect, it, vi } from "vitest";

type LoggingIndexModule = typeof import("../../../../utils/logging/index.js");

async function fresh(): Promise<LoggingIndexModule> {
    vi.resetModules();
    return import("../../../../utils/logging/index.js");
}

describe("logWithLevel.strict", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        Reflect.deleteProperty(globalThis, "__vitest_object_keys_allow_throw");
    });

    it("logs at all levels with and without payload", async () => {
        const { logWithLevel } = await fresh();
        const clog = vi.spyOn(console, "log").mockImplementation(() => {});
        const cinfo = vi.spyOn(console, "info").mockImplementation(() => {});
        const cwarn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const cerr = vi.spyOn(console, "error").mockImplementation(() => {});

        expect(logWithLevel("log", "hello")).toBeUndefined();
        expect(clog).toHaveBeenCalledWith(
            expect.stringContaining("[FFV] hello")
        );

        logWithLevel("info", "world", { a: 1 });
        expect(cinfo).toHaveBeenCalledWith(
            expect.stringContaining("[FFV] world"),
            { a: 1 }
        );

        logWithLevel("warn", "w", {}); // empty object -> no payload
        expect(cwarn).toHaveBeenCalledWith(expect.stringContaining("[FFV] w"));

        logWithLevel("error", "e", [1, 2] as any); // array -> not treated as object
        expect(cerr).toHaveBeenCalledWith(expect.stringContaining("[FFV] e"));
        expect(globalThis.__vitest_object_keys_allow_throw).toBe(false);
    });

    it("falls back to minimal line when Object.keys throws", async () => {
        const { logWithLevel } = await fresh();
        const baseLog = vi.spyOn(console, "log").mockImplementation(() => {});
        const ctx = { a: 1 } as any;
        // Make Object.keys throw only for our specific context object
        const originalKeys = Object.keys;
        const keysSpy = vi.spyOn(Object, "keys").mockImplementation(((
            obj: any
        ) => {
            if (obj === ctx) throw new Error("keys fail");
            return originalKeys(obj as any) as any;
        }) as any);

        expect(logWithLevel("info", "boom", ctx)).toBeUndefined();
        expect(baseLog).toHaveBeenCalledWith(
            "[FFV][logWithLevel] Logging failure"
        );
        expect(globalThis.__vitest_object_keys_allow_throw).toBe(false);

        keysSpy.mockRestore();
    });
});

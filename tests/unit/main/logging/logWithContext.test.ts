import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("logWithContext", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("logs a JSON string context and redacts secrets/tokens", async () => {
        expect.assertions(3);

        const { logWithContext } =
            await import("../../../../electron-app/main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "info").mockReturnValue(undefined);

        logWithContext("info", "hello", {
            ok: "yes",
            token: "abc",
            accessToken: "def",
            tokenUrl: "https://example.com/token",
            clientSecret: "shh",
        });

        expect(spy).toHaveBeenCalledOnce();
        const [msg, ctx] = spy.mock.calls[0];
        expect(String(msg)).toContain(
            "[2020-01-01T00:00:00.000Z] [main.js] hello"
        );
        expect(ctx).toBe(
            '{"ok":"yes","token":"[REDACTED]","accessToken":"[REDACTED]","tokenUrl":"https://example.com/token","clientSecret":"[REDACTED]"}'
        );
    });

    it("stringifies Error objects without throwing", async () => {
        expect.assertions(3);

        const { logWithContext } =
            await import("../../../../electron-app/main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "error").mockReturnValue(undefined);

        logWithContext("error", "boom", { error: new Error("nope") });

        expect(spy).toHaveBeenCalledOnce();
        const [, ctx] = spy.mock.calls[0];
        // We include the stack only in tests; assert the stable parts.
        expect(String(ctx)).toMatch(/"name":"Error"/);
        expect(String(ctx)).toMatch(/"message":"nope"/);
    });

    it("handles circular contexts", async () => {
        expect.assertions(2);

        const { logWithContext } =
            await import("../../../../electron-app/main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "warn").mockReturnValue(undefined);

        const ctx: Record<string, unknown> = {};
        ctx.self = ctx;

        logWithContext("warn", "circ", ctx);

        expect(spy).toHaveBeenCalledOnce();
        const [, json] = spy.mock.calls[0];
        expect(json).toBe('{"self":"[Circular]"}');
    });

    it("falls back to console.log for unknown levels", async () => {
        expect.assertions(3);

        const { logWithContext } =
            await import("../../../../electron-app/main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "log").mockReturnValue(undefined);

        logWithContext("not-a-level", "msg", { key: "value" });

        expect(spy).toHaveBeenCalledOnce();
        const [msg, ctx] = spy.mock.calls[0];
        expect(String(msg)).toBe("[2020-01-01T00:00:00.000Z] [main.js] msg");
        expect(ctx).toBe('{"key":"value"}');
    });

    it("routes supported trace-level messages without dynamic console indexing", async () => {
        expect.assertions(3);

        const { logWithContext } =
            await import("../../../../electron-app/main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "trace").mockReturnValue(undefined);

        logWithContext("trace", "trace msg", { key: "value" });

        expect(spy).toHaveBeenCalledOnce();
        const [msg, ctx] = spy.mock.calls[0];
        expect(String(msg)).toBe(
            "[2020-01-01T00:00:00.000Z] [main.js] trace msg"
        );
        expect(ctx).toBe('{"key":"value"}');
    });
});

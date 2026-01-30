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
        const { logWithContext } =
            await import("../../../../main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "info").mockImplementation(() => void 0);

        logWithContext("info", "hello", {
            ok: "yes",
            token: "abc",
            accessToken: "def",
            tokenUrl: "https://example.com/token",
            clientSecret: "shh",
        });

        expect(spy).toHaveBeenCalledTimes(1);
        const [msg, ctx] = spy.mock.calls[0];
        expect(String(msg)).toContain(
            "[2020-01-01T00:00:00.000Z] [main.js] hello"
        );
        expect(ctx).toBe(
            '{"ok":"yes","token":"[REDACTED]","accessToken":"[REDACTED]","tokenUrl":"https://example.com/token","clientSecret":"[REDACTED]"}'
        );
    });

    it("stringifies Error objects without throwing", async () => {
        const { logWithContext } =
            await import("../../../../main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "error").mockImplementation(() => void 0);

        logWithContext("error", "boom", { error: new Error("nope") });

        expect(spy).toHaveBeenCalledTimes(1);
        const [, ctx] = spy.mock.calls[0];
        // We include the stack only in tests; assert the stable parts.
        expect(String(ctx)).toMatch(/"name":"Error"/);
        expect(String(ctx)).toMatch(/"message":"nope"/);
    });

    it("handles circular contexts", async () => {
        const { logWithContext } =
            await import("../../../../main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "warn").mockImplementation(() => void 0);

        const ctx: Record<string, unknown> = {};
        ctx.self = ctx;

        logWithContext("warn", "circ", ctx);

        expect(spy).toHaveBeenCalledTimes(1);
        const [, json] = spy.mock.calls[0];
        expect(json).toBe('{"self":"[Circular]"}');
    });

    it("falls back to console.log for unknown levels", async () => {
        const { logWithContext } =
            await import("../../../../main/logging/logWithContext.js");
        const spy = vi.spyOn(console, "log").mockImplementation(() => void 0);

        logWithContext("not-a-level", "msg", { key: "value" });

        expect(spy).toHaveBeenCalledTimes(1);
    });
});

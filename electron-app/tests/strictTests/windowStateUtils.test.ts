/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";

describe("windowStateUtils strict tests (pure functions)", () => {
    it("validateWindowState accepts well-formed objects", async () => {
        const mod = await import("../../windowStateUtils.js");
        expect(mod.validateWindowState({ width: 1200, height: 800 })).toBe(true);
        expect(mod.validateWindowState({ width: 800, height: 600, x: 10, y: 20 })).toBe(true);
    });

    it("validateWindowState rejects malformed objects", async () => {
        const mod = await import("../../windowStateUtils.js");
        expect(mod.validateWindowState(null)).toBe(false);
        expect(mod.validateWindowState({})).toBe(false);
        expect(mod.validateWindowState({ width: -1, height: 0 })).toBe(false);
        expect(mod.validateWindowState({ width: 800, height: 600, x: "a" })).toBe(false);
    });

    it("sanitizeWindowState enforces minimum sizes and preserves coordinates", async () => {
        const mod = await import("../../windowStateUtils.js");
        const s1 = mod.sanitizeWindowState({ width: 300, height: 200 });
        expect(s1.width).toBeGreaterThanOrEqual(800);
        expect(s1.height).toBeGreaterThanOrEqual(600);

        const s2 = mod.sanitizeWindowState({ width: 900, height: 700, x: 5, y: 6 } as any);
        expect(s2.width).toBe(900);
        expect(s2.height).toBe(700);
        expect((s2 as any).x).toBe(5);
        expect((s2 as any).y).toBe(6);
    });
});

import { describe, it, vi, beforeEach, expect } from "vitest";
import { logWithLevel } from "../../../utils/logging/index.js";

describe("logWithLevel.js - fallback branch coverage", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("emits minimal fallback when Object.keys throws during payload prep", () => {
        // Force Object.keys to throw exactly once to drive the outer catch path
        const originalKeys = Object.keys;
        const keysSpy = vi.spyOn(Object, "keys").mockImplementation((arg: any) => {
            // Only throw on first call; then restore to avoid side-effects
            keysSpy.mockRestore();
            throw new Error("keys-fail");
        });

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        logWithLevel("info", "message", { a: 1 });

        expect(logSpy).toHaveBeenCalled();
        const calls = (logSpy.mock.calls || []).flat();
        const combined = calls.map((c) => String(c)).join(" ");
        expect(combined.includes("[FFV][logWithLevel] Logging failure")).toBe(true);

        // Ensure Object.keys restored
        expect(Object.keys).toBe(originalKeys);
    });
});

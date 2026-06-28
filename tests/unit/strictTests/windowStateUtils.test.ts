// @vitest-environment node
import { describe, it, expect } from "vitest";

interface WindowStateSnapshot {
    height: number;
    width: number;
    x?: number;
    y?: number;
}

describe("windowStateUtils strict tests (pure functions)", () => {
    it("validateWindowState accepts well-formed objects", async () => {
        expect.assertions(1);

        const mod = await import("../../../electron-app/windowStateUtils.js");
        const validStates = [
            { width: 1200, height: 800 },
            { width: 800, height: 600, x: 10, y: 20 },
        ];

        expect(
            validStates.map((state) => mod.validateWindowState(state))
        ).toStrictEqual([true, true]);
    });

    it("validateWindowState rejects malformed objects", async () => {
        expect.assertions(1);

        const mod = await import("../../../electron-app/windowStateUtils.js");
        const invalidStates = [
            null,
            {},
            { width: -1, height: 0 },
            { width: 800, height: 600, x: "a" },
        ];

        expect(
            invalidStates.map((state) => mod.validateWindowState(state))
        ).toStrictEqual([
            false,
            false,
            false,
            false,
        ]);
    });

    it("sanitizeWindowState enforces minimum sizes and preserves coordinates", async () => {
        expect.assertions(3);

        const mod = await import("../../../electron-app/windowStateUtils.js");
        const s1 = mod.sanitizeWindowState({ width: 300, height: 200 });
        expect(s1.width).toBeGreaterThanOrEqual(800);
        expect(s1.height).toBeGreaterThanOrEqual(600);

        const stateWithCoordinates: WindowStateSnapshot = {
            width: 900,
            height: 700,
            x: 5,
            y: 6,
        };
        const s2 = mod.sanitizeWindowState(stateWithCoordinates);
        expect({
            height: s2.height,
            width: s2.width,
            x: s2.x,
            y: s2.y,
        }).toStrictEqual({
            height: 700,
            width: 900,
            x: 5,
            y: 6,
        });
    });

    it("validateWindow requires a live isDestroyed callback", async () => {
        expect.assertions(1);

        const mod = await import("../../../electron-app/windowStateUtils.js");

        expect(
            [
                null,
                {},
                { isDestroyed: true },
                { isDestroyed: () => true },
                { isDestroyed: () => false },
            ].map((windowCandidate) => mod.validateWindow(windowCandidate))
        ).toStrictEqual([
            false,
            false,
            false,
            false,
            true,
        ]);
    });
});

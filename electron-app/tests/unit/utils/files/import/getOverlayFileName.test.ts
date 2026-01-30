import { describe, it, expect, vi, beforeEach } from "vitest";

// From tests/unit/utils/files/import -> utils/files/import requires going up 5 levels
const SUT = "../../../../../utils/files/import/getOverlayFileName.js";

describe("getOverlayFileName", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("throws on invalid index types", async () => {
        const { getOverlayFileName } = await import(SUT);
        expect(() => getOverlayFileName(-1 as any)).toThrow();
        expect(() => getOverlayFileName(1.2 as any)).toThrow();
        expect(() => getOverlayFileName(NaN as any)).toThrow();
    });

    it("returns empty string when loadedFitFiles is not an array", async () => {
        vi.doMock("../../../../../utils/state/core/stateManager.js", () => ({
            getState: vi.fn(() => ({ nope: true })),
        }));
        const { getOverlayFileName } = await import(SUT);
        expect(getOverlayFileName(0)).toBe("");
    });

    it("returns empty string when item missing or invalid filePath", async () => {
        vi.doMock("../../../../../utils/state/core/stateManager.js", () => ({
            getState: vi.fn(() => [
                {},
                { filePath: 123 },
                { filePath: "   " },
            ]),
        }));
        const { getOverlayFileName } = await import(SUT);
        expect(getOverlayFileName(0)).toBe("");
        expect(getOverlayFileName(1)).toBe("");
        expect(getOverlayFileName(2)).toBe("");
    });

    it("returns filePath when present", async () => {
        vi.doMock("../../../../../utils/state/core/stateManager.js", () => ({
            getState: vi.fn(() => [{ filePath: "C:/data/ride.fit" }]),
        }));
        const { getOverlayFileName } = await import(SUT);
        expect(getOverlayFileName(0)).toBe("C:/data/ride.fit");
    });

    it("handles getState throwing and returns empty string", async () => {
        vi.doMock("../../../../../utils/state/core/stateManager.js", () => ({
            getState: vi.fn(() => {
                throw new Error("boom");
            }),
        }));
        const { getOverlayFileName } = await import(SUT);
        expect(getOverlayFileName(0)).toBe("");
    });
});

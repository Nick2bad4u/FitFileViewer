import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLapNumForIdx } from "../../../electron-app/utils/data/processing/getLapNumForIdx.js";

describe("getLapNumForIdx", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the 1-based lap containing the requested record index", () => {
        const laps = [
            { start_index: 0, end_index: 99 },
            { start_index: 100, end_index: 199 },
            { start_index: 300, end_index: 399 },
        ];

        expect(getLapNumForIdx(0, laps)).toBe(1);
        expect(getLapNumForIdx(99, laps)).toBe(1);
        expect(getLapNumForIdx(100, laps)).toBe(2);
        expect(getLapNumForIdx(150, laps)).toBe(2);
        expect(getLapNumForIdx(250, laps)).toBeNull();
        expect(getLapNumForIdx(350, laps)).toBe(3);
    });

    it("returns the first matching lap for overlapping ranges", () => {
        const laps = [
            { start_index: 0, end_index: 150 },
            { start_index: 100, end_index: 199 },
        ];

        expect(getLapNumForIdx(125, laps)).toBe(1);
    });

    it("warns and returns null for invalid inputs", () => {
        const laps = [{ start_index: 0, end_index: 99 }];

        expect(getLapNumForIdx(-1, laps)).toBeNull();
        expect(getLapNumForIdx(Number.NaN, laps)).toBeNull();
        expect(getLapNumForIdx(50, null)).toBeNull();
        expect(getLapNumForIdx(50, [])).toBeNull();

        expect(warnSpy).toHaveBeenCalledWith(
            "[LapLookup] Invalid index: must be a non-negative finite number, got -1"
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[LapLookup] lapMesgs array is empty"
        );
    });

    it("skips corrupt lap entries without blocking later valid laps", () => {
        const laps = [
            null,
            { end_index: 99 },
            { start_index: -1, end_index: 50 },
            { start_index: 100, end_index: 50 },
            { start_index: 200, end_index: 299 },
        ];

        expect(getLapNumForIdx(250, laps)).toBe(5);

        expect(warnSpy).toHaveBeenCalledWith(
            "[LapLookup] Lap at index 1 missing numeric start_index or end_index:",
            { end_index: 99 }
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[LapLookup] Lap at index 2 has negative indices:",
            { start_index: -1, end_index: 50 }
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[LapLookup] Lap at index 3 has start_index > end_index:",
            { start_index: 100, end_index: 50 }
        );
    });

    it("logs and returns null when lap property access throws", () => {
        const laps = [
            {
                get start_index() {
                    throw new Error("property access failed");
                },
                end_index: 99,
            },
        ];

        expect(getLapNumForIdx(50, laps)).toBeNull();

        expect(errorSpy).toHaveBeenCalledWith(
            "[LapLookup] Error determining lap number for index 50:",
            expect.any(Error)
        );
    });
});

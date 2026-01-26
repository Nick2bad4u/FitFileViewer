import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUnitSymbol } from "../../../utils/data/lookups/getUnitSymbol.js";
import { getChartSetting } from "../../../utils/state/domain/settingsStateManager.js";

vi.mock("../../../utils/state/domain/settingsStateManager.js", () => ({
    getChartSetting: vi.fn(),
}));

describe("getUnitSymbol.js - additional branch coverage", () => {
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    let mockGetChartSetting: any;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockGetChartSetting = vi.mocked(getChartSetting);
        mockGetChartSetting.mockReset();
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    it("falls back when no storage is available", () => {
        mockGetChartSetting.mockReturnValue(undefined);
        const result = getUnitSymbol("distance");
        expect(result).toBe("km");
    });

    it("uses global localStorage when window.localStorage is unavailable", () => {
        mockGetChartSetting.mockReturnValue("miles");
        const result = getUnitSymbol("distance");
        expect(result).toBe("mi");
    });

    it("returns fallback when storage.getItem is not a function", () => {
        mockGetChartSetting.mockReturnValue(undefined);
        const result = getUnitSymbol("distance");
        expect(result).toBe("km");
    });

    it("handles storage.getItem throwing by warning and using fallback", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        mockGetChartSetting.mockImplementation(() => {
            throw new Error("boom");
        });
        const result = getUnitSymbol("temperature");
        expect(result).toBe("°C");
        expect(warnSpy).toHaveBeenCalled();
    });

    it("triggers top-level catch when console.warn throws during validation", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        // Force console.warn to throw when getUnitSymbol validates input
        console.warn = ((..._args: any[]) => {
            throw new Error("warn-fail");
        }) as any;
        const result = getUnitSymbol(null as any);
        expect(result).toBe("");
        expect(errorSpy).toHaveBeenCalled();
    });
});

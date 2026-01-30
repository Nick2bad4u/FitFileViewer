import { describe, it, expect, vi, beforeEach } from "vitest";

const getChartSettingMock = vi.fn();
vi.mock("../../../../../utils/state/domain/settingsStateManager.js", () => ({
    getChartSetting: getChartSettingMock,
}));

// Load module fresh helper using dynamic import for ESM
const MODULE = "../../../../../utils/formatting/formatters/formatTime.js";
async function fresh() {
    vi.resetModules();
    const url = new URL(MODULE, import.meta.url).href;
    return await import(url);
}

describe("formatTime.strict branches", () => {
    beforeEach(() => {
        vi.resetModules();
        getChartSettingMock.mockReset();
    });

    it("returns '0:00' and warns for invalid input", async () => {
        const { formatTime } = await fresh();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(formatTime(NaN as any)).toBe("0:00");
        expect(formatTime(undefined as any)).toBe("0:00");
        expect(formatTime(-5)).toBe("0:00");
        expect(warn).toHaveBeenCalled();
    });

    it("formats seconds as MM:SS and HH:MM:SS", async () => {
        const { formatTime } = await fresh();
        expect(formatTime(59)).toBe("0:59");
        expect(formatTime(61)).toBe("1:01");
        expect(formatTime(3661)).toBe("1:01:01");
    });

    it("uses user units via settings state", async () => {
        getChartSettingMock.mockReturnValue("minutes");
        const { formatTime } = await fresh();
        expect(formatTime(90, true)).toBe("1.5m");
        getChartSettingMock.mockReturnValue("hours");
        expect(formatTime(3600, true)).toBe("1.00h");
    });

    it("uses stored time units when available", async () => {
        getChartSettingMock.mockReturnValue("seconds");
        const { formatTime } = await fresh();
        expect(formatTime(61, true)).toBe("1:01");
    });

    it("logs error and returns fallback when settings access throws", async () => {
        getChartSettingMock.mockImplementation(() => {
            throw new Error("boom");
        });
        const { formatTime } = await fresh();
        const err = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(formatTime(10, true)).toBe("0:00");
        expect(err).toHaveBeenCalled();
    });

    it("logs error and returns fallback when converter throws", async () => {
        vi.resetModules();
        // Mock the converter module to throw
        vi.doMock(
            "../../../../../utils/formatting/converters/convertTimeUnits.js",
            () => ({
                TIME_UNITS: {
                    SECONDS: "seconds",
                    MINUTES: "minutes",
                    HOURS: "hours",
                },
                convertTimeUnits: () => {
                    throw new Error("convert fail");
                },
            })
        );
        const { formatTime } = await fresh();
        const err = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(formatTime(10, true)).toBe("0:00");
        expect(err).toHaveBeenCalled();
    });
});

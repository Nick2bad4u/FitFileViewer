import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type GetChartSettingMock = (key: string) => unknown;

const getChartSettingMock = vi.hoisted(() => vi.fn<GetChartSettingMock>());
vi.mock(
    import("../../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartSetting: getChartSettingMock,
    })
);

async function fresh(): Promise<
    typeof import("../../../../../../electron-app/utils/formatting/formatters/formatTime.js")
> {
    vi.resetModules();
    return await import("../../../../../../electron-app/utils/formatting/formatters/formatTime.js");
}

describe("formatTime.strict branches", () => {
    beforeEach(() => {
        vi.resetModules();
        getChartSettingMock.mockReset();
    });

    afterEach(() => {
        vi.doUnmock(
            "../../../../../../electron-app/utils/formatting/converters/convertTimeUnits.js"
        );
        vi.restoreAllMocks();
    });

    it("returns '0:00' and warns for invalid input", async () => {
        expect.hasAssertions();

        const { formatTime } = await fresh();
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(formatTime(NaN)).toBe("0:00");
        expect(formatTime(undefined)).toBe("0:00");
        expect(formatTime(-5)).toBe("0:00");
        expect(warn).toHaveBeenNthCalledWith(
            1,
            "[formatTime] Invalid seconds value:",
            NaN
        );
        expect(warn).toHaveBeenNthCalledWith(
            2,
            "[formatTime] Invalid seconds value:",
            undefined
        );
        expect(warn).toHaveBeenNthCalledWith(
            3,
            "[formatTime] Negative time value:",
            -5
        );
    });

    it("formats seconds as MM:SS and HH:MM:SS", async () => {
        expect.hasAssertions();

        const { formatTime } = await fresh();
        expect(formatTime(59)).toBe("0:59");
        expect(formatTime(61)).toBe("1:01");
        expect(formatTime(3661)).toBe("1:01:01");
    });

    it("uses user units via settings state", async () => {
        expect.hasAssertions();

        getChartSettingMock.mockReturnValue("minutes");
        const { formatTime } = await fresh();
        expect(formatTime(90, true)).toBe("1.5m");
        getChartSettingMock.mockReturnValue("hours");
        expect(formatTime(3600, true)).toBe("1.00h");
    });

    it("uses stored time units when available", async () => {
        expect.hasAssertions();

        getChartSettingMock.mockReturnValue("seconds");
        const { formatTime } = await fresh();
        expect(formatTime(61, true)).toBe("1:01");
    });

    it("logs error and returns fallback when settings access throws", async () => {
        expect.hasAssertions();

        getChartSettingMock.mockImplementation(() => {
            throw new Error("boom");
        });
        const { formatTime } = await fresh();
        const err = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(formatTime(10, true)).toBe("0:00");
        expect(err).toHaveBeenCalledWith(
            "[formatTime] Time formatting failed:",
            expect.any(Error)
        );
    });

    it("logs error and returns fallback when converter throws", async () => {
        expect.hasAssertions();

        vi.resetModules();
        // Mock the converter module to throw
        vi.doMock(
            import("../../../../../../electron-app/utils/formatting/converters/convertTimeUnits.js"),
            () => ({
                TIME_UNITS: {
                    SECONDS: "seconds",
                    MINUTES: "minutes",
                    HOURS: "hours",
                },
                convertTimeUnits: (): never => {
                    throw new Error("convert fail");
                },
            })
        );
        const { formatTime } = await fresh();
        const err = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(formatTime(10, true)).toBe("0:00");
        expect(err).toHaveBeenCalledWith(
            "[formatTime] Error in convertTimeUnits:",
            expect.any(Error)
        );
        expect(err).toHaveBeenCalledWith(
            "[formatTime] Time formatting failed:",
            expect.any(Error)
        );
    });
});

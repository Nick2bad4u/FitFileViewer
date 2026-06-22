import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockedGetChartSetting = vi.hoisted(() =>
    vi.fn<(key: string) => unknown>()
);
vi.mock(
    import("../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartSetting: mockedGetChartSetting,
    })
);

async function fresh(): Promise<
    typeof import("../../../electron-app/utils/formatting/formatters/formatTime.js")
> {
    vi.resetModules();
    return await import("../../../electron-app/utils/formatting/formatters/formatTime.js");
}

describe("formatTime", () => {
    beforeEach(() => {
        vi.resetModules();
        mockedGetChartSetting.mockReset();
        mockedGetChartSetting.mockReturnValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("formats seconds as clock strings by default", async () => {
        expect.assertions(7);

        const { formatTime } = await fresh();

        expect(formatTime(0)).toBe("0:00");
        expect(formatTime(5)).toBe("0:05");
        expect(formatTime(90)).toBe("1:30");
        expect(formatTime(3599)).toBe("59:59");
        expect(formatTime(3600)).toBe("1:00:00");
        expect(formatTime(3661)).toBe("1:01:01");
        expect(formatTime(90.9)).toBe("1:30");
    });

    it("formats user-unit settings for seconds, minutes, and hours", async () => {
        expect.assertions(5);

        const { formatTime } = await fresh();

        mockedGetChartSetting.mockReturnValue("seconds");
        expect(formatTime(90, true)).toBe("1:30");

        mockedGetChartSetting.mockReturnValue("minutes");
        expect(formatTime(90, true)).toBe("1.5m");

        mockedGetChartSetting.mockReturnValue("hours");
        expect(formatTime(3600, true)).toBe("1.00h");

        mockedGetChartSetting.mockReturnValue("invalid");
        expect(formatTime(91, true)).toBe("1:31");
        expect(mockedGetChartSetting).toHaveBeenCalledWith("timeUnits");
    });

    it("does not read user settings when user units are disabled", async () => {
        expect.assertions(2);

        const { formatTime } = await fresh();

        expect(formatTime(90, false)).toBe("1:30");
        expect(mockedGetChartSetting).not.toHaveBeenCalled();
    });

    it("handles invalid-input values with warnings and the fallback time", async () => {
        expect.assertions(13);

        const { formatTime } = await fresh();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        for (const value of [
            null,
            undefined,
            "60",
            true,
            {},
            [],
            Number.NaN,
            Infinity,
            -60,
            -Infinity,
        ]) {
            expect(formatTime(value)).toBe("0:00");
        }

        expect(warnSpy).toHaveBeenCalledWith(
            "[formatTime] Invalid seconds value:",
            null
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[formatTime] Negative time value:",
            -60
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[formatTime] Invalid seconds value:",
            Infinity
        );
    });

    it("logs and returns the fallback time when formatting fails", async () => {
        expect.assertions(2);

        const { formatTime } = await fresh();
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const floorError = new Error("floor failed");
        vi.spyOn(Math, "floor").mockImplementationOnce(() => {
            throw floorError;
        });

        expect(formatTime(3661)).toBe("0:00");
        expect(errorSpy).toHaveBeenCalledWith(
            "[formatTime] Time formatting failed:",
            floorError
        );
    });
});

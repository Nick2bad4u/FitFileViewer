import { beforeEach, describe, expect, it, vi } from "vitest";
import { getState } from "../../../utils/state/core/stateManager.js";
import { formatTooltipData } from "../../../utils/formatting/display/formatTooltipData.js";

vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
}));

const mockedGetState = vi.mocked(getState);

describe("formatTooltipData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedGetState.mockImplementation((path?: string) => {
            if (path === "globalData") {
                return { fieldDescriptionMesgs: [] };
            }
            return undefined;
        });
    });

    it("formats complete tooltip data with elapsed time and primary metrics", () => {
        const result = formatTooltipData(
            50,
            {
                altitude: 250.5,
                cadence: 85,
                distance: 5000,
                heartRate: 165,
                power: 200,
                speed: 8.33,
                timestamp: new Date("2023-01-01T10:02:03Z"),
            },
            2,
            [{ timestamp: new Date("2023-01-01T10:00:00Z") }]
        );

        expect(result).toContain("<b>Lap:</b> 2");
        expect(result).toContain("<b>Index:</b> 50");
        expect(result).toContain("<b>Time:</b>");
        expect(result).toContain("<b>Elapsed Time:</b> 2 minutes, 3 seconds");
        expect(result).toContain("<b>Distance:</b> 5.00 km / 3.11 mi");
        expect(result).toContain("<b>Alt:</b> 250.5 m / 822 ft");
        expect(result).toContain("<b>HR:</b> 165.0 bpm");
        expect(result).toContain("<b>Speed:</b> 30.0 km/h / 18.6 mph");
        expect(result).toContain("<b>Power:</b> 200.0 W");
        expect(result).toContain("<b>Cadence:</b> 85.0 rpm");
    });

    it("formats auxiliary heart rate and estimated power fallbacks", () => {
        const result = formatTooltipData(
            7,
            {
                auxHeartRate: 151,
                estimatedPower: 199.9,
                timestamp: new Date("2023-01-01T10:00:00Z"),
            },
            1
        );

        expect(result).toContain("<b>Aux HR:</b> 151.0 bpm");
        expect(result).toContain("<b>Est. Power:</b> 200 W");
        expect(result).not.toContain("<b>Power:</b>");
    });

    it("handles invalid-input row data with a fallback message", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        for (const row of [
            null,
            undefined,
            "invalid",
            [],
        ]) {
            expect(formatTooltipData(10, row, 1)).toBe("No data available");
        }

        expect(warnSpy).toHaveBeenCalledWith(
            "[TooltipFormatter] Invalid row data provided"
        );
    });

    it("omits invalid-input metric values while preserving lap and index", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = formatTooltipData(
            "bad-index",
            {
                altitude: Number.NaN,
                cadence: {},
                distance: "bad",
                heartRate: Infinity,
                power: "bad",
                speed: undefined,
            },
            null
        );

        expect(result).toContain("<b>Lap:</b> null");
        expect(result).toContain("<b>Index:</b> bad-index");
        expect(result).not.toContain("<b>Alt:</b>");
        expect(result).not.toContain("<b>HR:</b>");
        expect(result).not.toContain("<b>Speed:</b>");
        expect(result).not.toContain("<b>Power:</b>");
        expect(result).not.toContain("<b>Cadence:</b>");
        expect(warnSpy).toHaveBeenCalledWith(
            "[TooltipFormatter] Invalid altitude: NaN"
        );
    });

    it("logs and returns an error message when formatting throws", () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const row = { heartRate: 150 };
        Object.defineProperty(row, "timestamp", {
            get: () => {
                throw new Error("timestamp getter failed");
            },
        });

        expect(formatTooltipData(5, row, 1)).toBe(
            "Error loading data (Index: 5)"
        );
        expect(errorSpy).toHaveBeenCalledWith(
            "[TooltipFormatter] Error formatting tooltip data: timestamp getter failed"
        );
    });
});

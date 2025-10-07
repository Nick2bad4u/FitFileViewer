import { describe, it, expect, beforeEach, vi } from "vitest";

type FormatTooltipFn = typeof import("../../../utils/formatting/display/formatTooltipData.js")["formatTooltipData"];

vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
}));

describe("formatTooltipData alias support", () => {
    let formatTooltipData: FormatTooltipFn;
    let mockGetState: ReturnType<typeof vi.fn>;

    const invokeFormatter = (
        idx: number,
        row: unknown,
        lapNum: number,
        records?: Array<Record<string, unknown>>
    ) =>
        formatTooltipData(
            idx,
            row as Parameters<FormatTooltipFn>[1],
            lapNum,
            (records ?? undefined) as Parameters<FormatTooltipFn>[3]
        );

    beforeEach(async () => {
        vi.clearAllMocks();

        const module = await import("../../../utils/formatting/display/formatTooltipData.js");
        formatTooltipData = module.formatTooltipData;

        const stateModule = await import("../../../utils/state/core/stateManager.js");
        mockGetState = stateModule.getState as ReturnType<typeof vi.fn>;
        mockGetState.mockReturnValue([]);
    });

    it("formats rows with snake_case metrics", () => {
        const row = {
            timestamp: 1_700_000_000,
            enhanced_altitude: 345.2,
            heart_rate: 142,
            speed_mps: 9.72,
        };

        const result = invokeFormatter(0, row, 5, []);

        expect(result).toContain("<b>Lap:</b> 5");
        expect(result).toContain("<b>Alt:</b> 345.2 m / 1,133 ft");
        expect(result).toContain("<b>HR:</b> 142.0 bpm");
    expect(result).toContain("<b>Speed:</b> 35.0 km/h / 21.7 mph");
    });

    it("pulls fallback metrics when primary row lacks data", () => {
        const row = {
            timestamp: new Date("2024-02-01T08:30:00Z"),
        };

        const fallbackRecords = [
            {
                heart_rate: 130,
                enhanced_speed: 7.5,
                enhanced_altitude: 210.4,
                distance: 12345,
            },
        ];

        const result = invokeFormatter(0, row, 2, fallbackRecords);

        expect(result).toContain("<b>Lap:</b> 2");
        expect(result).toContain("<b>Distance:</b> 12.3 km / 7.7 mi");
        expect(result).toContain("<b>Alt:</b> 210.4 m / 690 ft");
        expect(result).toContain("<b>HR:</b> 130.0 bpm");
        expect(result).toContain("<b>Speed:</b> 27.0 km/h / 16.8 mph");
    });

    it("parses numeric timestamps represented as epoch seconds", () => {
        const row = {
            timestamp: 1_701_234_567,
            distance: 1500,
        };

        const result = invokeFormatter(0, row, 1, []);

        expect(result).toMatch(/Time:/);
        expect(result).not.toMatch(/Invalid Date/);
    });
});

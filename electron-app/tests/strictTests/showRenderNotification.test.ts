/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock renderChartJS state module to control previousChartState
// Ensure the SUT's import specifier and the test's import specifier resolve to the same mocked instance.
const sharedState: { lastRenderTimestamp: number; chartCount: number; fieldsRendered: any[] } = {
    lastRenderTimestamp: 0,
    chartCount: 0,
    fieldsRendered: [] as any[],
};
function factory() {
    return {
        previousChartState: sharedState,
        updatePreviousChartState: vi.fn((chartCount: number, fieldsCount: number, now: number) => {
            sharedState.chartCount = chartCount;
            sharedState.fieldsRendered = new Array(fieldsCount).fill(true) as any[];
            sharedState.lastRenderTimestamp = now;
        }),
    };
}
// Path used by SUT (relative to utils/ui/notifications/showRenderNotification.js)
vi.mock("../../charts/core/renderChartJS.js", () => ({
    previousChartState: sharedState,
    updatePreviousChartState: vi.fn((chartCount: number, fieldsCount: number, now: number) => {
        sharedState.chartCount = chartCount;
        sharedState.fieldsRendered = new Array(fieldsCount).fill(true) as any[];
        sharedState.lastRenderTimestamp = now;
    }),
}));
// Path resolvable from test file location
vi.mock("../../utils/charts/core/renderChartJS.js", () => ({
    previousChartState: sharedState,
    updatePreviousChartState: vi.fn((chartCount: number, fieldsCount: number, now: number) => {
        sharedState.chartCount = chartCount;
        sharedState.fieldsRendered = new Array(fieldsCount).fill(true) as any[];
        sharedState.lastRenderTimestamp = now;
    }),
}));

describe("showRenderNotification strict", () => {
    const nowSpy = vi.spyOn(Date, "now");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    beforeEach(async () => {
        // Reset shared mock state to avoid cross-test leakage
        sharedState.lastRenderTimestamp = 0;
        sharedState.chartCount = 0;
        sharedState.fieldsRendered = [] as any[];

        vi.resetModules();
        logSpy.mockClear();
        nowSpy.mockReset();
    });

    it("shows when time gap exceeds 10s", async () => {
        const { previousChartState } = await import("../../utils/charts/core/renderChartJS.js");
        previousChartState.lastRenderTimestamp = 0;
        nowSpy.mockReturnValue(20_000);
        const mod = await import("../../utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(5, 3)).toBe(true);
    });

    it("shows for significant chart count change or from 0", async () => {
        const { previousChartState } = await import("../../utils/charts/core/renderChartJS.js");
        previousChartState.lastRenderTimestamp = 1_000; // within 10s gate
        previousChartState.chartCount = 0; // from 0 triggers
        nowSpy.mockReturnValue(5_000);
        const mod = await import("../../utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(1, 0)).toBe(true);
    });

    it("shows for significant visible field change (>2)", async () => {
        const { updatePreviousChartState } = await import("../../utils/charts/core/renderChartJS.js");
        // prior state: 5 charts, 3 fields, within 10s window
        updatePreviousChartState(5, 3, 1_000);
        nowSpy.mockReturnValue(5_000);
        const mod = await import("../../utils/ui/notifications/showRenderNotification.js");
        // fields diff = 6 - 3 = 3 (>2)
        expect(mod.showRenderNotification(5, 6)).toBe(true);
    });

    it("shows for significant chart count change (>2) from non-zero", async () => {
        const { updatePreviousChartState } = await import("../../utils/charts/core/renderChartJS.js");
        // prior state: 5 charts, 3 fields, recent render (within 10s)
        updatePreviousChartState(5, 3, 1_000);
        nowSpy.mockReturnValue(5_000);
        const mod = await import("../../utils/ui/notifications/showRenderNotification.js");
        // chart count diff = 9 - 5 = 4 (>2), previous was non-zero
        expect(mod.showRenderNotification(9, 3)).toBe(true);
    });

    it("suppresses for minor re-render and updates state", async () => {
        const mod = await import("../../utils/ui/notifications/showRenderNotification.js");
        // Prime internal state using the SUT itself to avoid module identity mismatch.
        nowSpy.mockReturnValue(1_000);
        void mod.showRenderNotification(5, 3); // initial render to set baseline state

        // Within 10s, minor field change (diff = 1) should be suppressed
        nowSpy.mockReturnValue(5_000);
        expect(mod.showRenderNotification(5, 4)).toBe(false);
        // Verify shared state got updated
        const { previousChartState } = await import("../../utils/charts/core/renderChartJS.js");
        expect(previousChartState.chartCount).toBe(5);
        expect(previousChartState.fieldsRendered.length).toBe(4);
        expect(typeof previousChartState.lastRenderTimestamp).toBe("number");
        expect(previousChartState.lastRenderTimestamp).toBeGreaterThan(0);
    });

    it("suppresses when chartCountDiff is >0 but not significant (<=2) and prev count non-zero", async () => {
        const mod = await import("../../utils/ui/notifications/showRenderNotification.js");
        // Prime baseline via SUT to avoid any module identity mismatch
        nowSpy.mockReturnValue(1_000);
        void mod.showRenderNotification(5, 3);

        nowSpy.mockReturnValue(5_000);
        // chart count diff = 6 - 5 = 1 (<=2) and prev was non-zero; field diff = 4 - 3 = 1
        expect(mod.showRenderNotification(6, 4)).toBe(false);

        const { previousChartState } = await import("../../utils/charts/core/renderChartJS.js");
        // state should still update
        expect(previousChartState.chartCount).toBe(6);
        expect(previousChartState.fieldsRendered.length).toBe(4);
    });
});

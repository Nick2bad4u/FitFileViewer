import { beforeEach, describe, expect, it, vi } from "vitest";

type MutableChartNotificationState = {
    chartCount: number;
    fieldsRendered: unknown[];
    lastRenderTimestamp: number;
};

const importChartNotificationState = async () =>
    import("../../../../../electron-app/utils/charts/core/chartNotificationState.js");

const mutablePreviousChartState = (
    previousChartState: unknown
): MutableChartNotificationState =>
    previousChartState as MutableChartNotificationState;

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartNotificationState.js"),
    () => ({
        previousChartState: {
            chartCount: 0,
            fieldsRendered: [],
            lastRenderTimestamp: 0,
        },
        updatePreviousChartState:
            vi.fn<
                (
                    chartCount: number,
                    fieldCount: number,
                    timestamp: number
                ) => void
            >(),
    })
);

describe("showRenderNotification logic", () => {
    beforeEach(async () => {
        vi.setSystemTime(0);
        const rc = await importChartNotificationState();
        const previousChartState = mutablePreviousChartState(
            rc.previousChartState
        );
        previousChartState.chartCount = 0;
        previousChartState.fieldsRendered = [];
        previousChartState.lastRenderTimestamp = 0;
        vi.mocked(rc.updatePreviousChartState).mockClear();
    });

    it("shows when >10s since last render", async () => {
        expect.hasAssertions();

        const mod =
            await import("../../../../../electron-app/utils/ui/notifications/showRenderNotification.js");
        vi.setSystemTime(20001);
        expect(mod.showRenderNotification(1, 1)).toBe(true);
    });

    it("shows when chart count changes significantly or from 0", async () => {
        expect.hasAssertions();

        const rc = await importChartNotificationState();
        const previousChartState = mutablePreviousChartState(
            rc.previousChartState
        );
        previousChartState.chartCount = 5;
        previousChartState.lastRenderTimestamp = Date.now();
        const mod =
            await import("../../../../../electron-app/utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(8, 1)).toBe(true);
        // from zero
        previousChartState.chartCount = 0;
        previousChartState.lastRenderTimestamp = Date.now();
        expect(mod.showRenderNotification(1, 1)).toBe(true);
    });

    it("does not show for threshold-boundary changes", async () => {
        expect.hasAssertions();

        const rc = await importChartNotificationState();
        const previousChartState = mutablePreviousChartState(
            rc.previousChartState
        );
        previousChartState.chartCount = 3;
        previousChartState.fieldsRendered = [
            1,
            2,
            3,
        ];
        previousChartState.lastRenderTimestamp = Date.now();
        const mod =
            await import("../../../../../electron-app/utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(5, 5)).not.toBe(true);
        expect(rc.updatePreviousChartState).toHaveBeenCalledWith(5, 5, 0);
    });

    it("shows when visible fields change significantly", async () => {
        expect.hasAssertions();

        const rc = await importChartNotificationState();
        const previousChartState = mutablePreviousChartState(
            rc.previousChartState
        );
        previousChartState.chartCount = 3;
        previousChartState.fieldsRendered = [
            1,
            2,
            3,
        ];
        previousChartState.lastRenderTimestamp = Date.now();
        const mod =
            await import("../../../../../electron-app/utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(3, 7)).toBe(true);
    });
});

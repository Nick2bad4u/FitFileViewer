import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/charts/core/chartNotificationState.js", () => ({
    previousChartState: { chartCount: 0, fieldsRendered: [], lastRenderTimestamp: 0 },
    updatePreviousChartState: vi.fn(),
}));

describe("showRenderNotification logic", () => {
    beforeEach(() => {
        vi.setSystemTime(0);
    });

    it("shows when >10s since last render", async () => {
        const mod = await import("../../../../utils/ui/notifications/showRenderNotification.js");
        vi.setSystemTime(20001);
        expect(mod.showRenderNotification(1, 1)).toBe(true);
    });

    it("shows when chart count changes significantly or from 0", async () => {
        const rc = await import("../../../../utils/charts/core/chartNotificationState.js");
        (rc.previousChartState.chartCount as any) = 5;
        (rc.previousChartState.lastRenderTimestamp as any) = Date.now();
        const mod = await import("../../../../utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(8, 1)).toBe(true);
        // from zero
        (rc.previousChartState.chartCount as any) = 0;
        (rc.previousChartState.lastRenderTimestamp as any) = Date.now();
        expect(mod.showRenderNotification(1, 1)).toBe(true);
    });

    it("suppresses for minor changes", async () => {
        const rc = await import("../../../../utils/charts/core/chartNotificationState.js");
        (rc.previousChartState.chartCount as any) = 3;
        (rc.previousChartState.fieldsRendered as any) = [1, 2, 3];
        (rc.previousChartState.lastRenderTimestamp as any) = Date.now();
        const mod = await import("../../../../utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(4, 4)).toBe(false);
    });

    it("shows when visible fields change significantly", async () => {
        const rc = await import("../../../../utils/charts/core/chartNotificationState.js");
        (rc.previousChartState.chartCount as any) = 3;
        (rc.previousChartState.fieldsRendered as any) = [1, 2, 3];
        (rc.previousChartState.lastRenderTimestamp as any) = Date.now();
        const mod = await import("../../../../utils/ui/notifications/showRenderNotification.js");
        expect(mod.showRenderNotification(3, 7)).toBe(true);
    });
});

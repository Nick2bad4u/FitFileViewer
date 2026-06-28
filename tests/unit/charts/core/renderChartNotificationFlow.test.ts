import { describe, expect, it, vi } from "vitest";

import { handleChartRenderNotification } from "../../../../electron-app/utils/charts/core/renderChartNotificationFlow.js";

const activeTabState = vi.hoisted(() => ({
    activeTab: "chart" as unknown,
}));

vi.mock(
    "../../../../electron-app/utils/state/domain/rendererActiveTabState.js",
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import("../../../../electron-app/utils/state/domain/rendererActiveTabState.js")
            >();

        return {
            ...actual,
            getRendererActiveTab: vi.fn(() => activeTabState.activeTab),
        };
    }
);

type ChartStateUpdate = {
    options: unknown;
    path: string;
    value: Record<string, unknown>;
};
type Notification = {
    message: string;
    type: "success";
};

function createDependencies(
    activeTab = "chart",
    updates: ChartStateUpdate[] = [],
    notifications: Notification[] = []
) {
    activeTabState.activeTab = activeTab;

    return {
        isTestRuntime: false,
        notify(message: string, type: "success"): void {
            notifications.push({ message, type });
        },
        showRenderNotification: vi.fn<
            (totalChartsRendered: number, visibleFieldCount: number) => boolean
        >(() => true),
        updateState(
            path: string,
            value: Record<string, unknown>,
            options?: unknown
        ): void {
            updates.push({ options, path, value });
        },
    };
}

describe("handleChartRenderNotification", () => {
    it("writes notification timestamps through the injected clock", () => {
        expect.assertions(6);

        const updates: ChartStateUpdate[] = [];
        const notifications: Notification[] = [];
        const scheduledJobs: Array<{ callback: () => void; delay: number }> =
            [];
        let clockReads = 0;
        const dependencies = createDependencies(
            "chart",
            updates,
            notifications
        );
        const schedule = (callback: () => void, delay: number): void => {
            scheduledJobs.push({ callback, delay });
        };
        const dateNow = (): number => {
            clockReads += 1;
            return 98_765;
        };

        handleChartRenderNotification(dependencies, {
            dateNow,
            schedule,
            totalChartsRendered: 2,
            visibleFieldCount: 4,
        });

        expect(clockReads).toBe(1);
        expect(scheduledJobs).toHaveLength(1);
        expect(scheduledJobs[0]?.delay).toBe(100);
        expect(updates).toStrictEqual([
            {
                options: { merge: true, source: "renderChartsWithData" },
                path: "ui",
                value: {
                    lastNotification: {
                        message: "Rendered 2 charts successfully",
                        timestamp: 98_765,
                        type: "success",
                    },
                },
            },
        ]);

        scheduledJobs[0]?.callback();

        expect(notifications).toStrictEqual([
            {
                message: "Rendered 2 charts successfully",
                type: "success",
            },
        ]);
        expect(dependencies.showRenderNotification).toHaveBeenCalledWith(2, 4);
    });

    it("does not read the clock when notification display is skipped", () => {
        expect.assertions(3);

        const updates: ChartStateUpdate[] = [];
        const notifications: Notification[] = [];
        let clockReads = 0;
        const dependencies = createDependencies("data", updates, notifications);
        const dateNow = (): number => {
            clockReads += 1;
            return 98_765;
        };

        handleChartRenderNotification(dependencies, {
            dateNow,
            totalChartsRendered: 2,
            visibleFieldCount: 4,
        });

        expect(clockReads).toBe(0);
        expect(updates).toStrictEqual([]);
        expect(notifications).toStrictEqual([]);
    });

    it("suppresses notifications for stale chart tab aliases", () => {
        expect.assertions(3);

        const updates: ChartStateUpdate[] = [];
        const notifications: Notification[] = [];
        let clockReads = 0;
        const dependencies = createDependencies(
            "charts",
            updates,
            notifications
        );
        const dateNow = (): number => {
            clockReads += 1;
            return 98_765;
        };

        handleChartRenderNotification(dependencies, {
            dateNow,
            totalChartsRendered: 2,
            visibleFieldCount: 4,
        });

        expect(clockReads).toBe(0);
        expect(updates).toStrictEqual([]);
        expect(notifications).toStrictEqual([]);
    });

    it("does not update notification state when the notification gate declines", () => {
        expect.assertions(3);

        const updates: ChartStateUpdate[] = [];
        const notifications: Notification[] = [];
        let clockReads = 0;
        const dependencies = {
            ...createDependencies("chart", updates, notifications),
            showRenderNotification: () => false,
        };
        const dateNow = (): number => {
            clockReads += 1;
            return 98_765;
        };

        handleChartRenderNotification(dependencies, {
            dateNow,
            totalChartsRendered: 2,
            visibleFieldCount: 4,
        });

        expect(clockReads).toBe(0);
        expect(updates).toStrictEqual([]);
        expect(notifications).toStrictEqual([]);
    });
});

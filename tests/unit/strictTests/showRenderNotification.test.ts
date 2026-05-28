// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

type ShowRenderNotificationModule =
    typeof import("../../../electron-app/utils/ui/notifications/showRenderNotification.js");

const chartStateMock = vi.hoisted(() => ({
    previousChartState: {
        chartCount: 0,
        fieldsRendered: [] as boolean[],
        lastRenderTimestamp: 0,
    },
    updatePreviousChartState: vi.fn<
        (chartCount: number, visibleFields: number, timestamp: number) => void
    >((chartCount, visibleFields, timestamp) => {
        chartStateMock.previousChartState.chartCount = chartCount;
        chartStateMock.previousChartState.fieldsRendered = Array.from(
            { length: visibleFields },
            () => true
        );
        chartStateMock.previousChartState.lastRenderTimestamp = timestamp;
    }),
}));

vi.mock(
    import("../../../electron-app/utils/charts/core/chartNotificationState.js"),
    () => ({
        previousChartState: chartStateMock.previousChartState,
        updatePreviousChartState: chartStateMock.updatePreviousChartState,
    })
);

describe("showRenderNotification strict", () => {
    it("shows when the render gap exceeds ten seconds", async () => {
        expect.assertions(4);

        resetTestState();
        setPreviousState({ lastRenderTimestamp: 0 });
        const { logSpy, nowSpy } = mockTime(20_000);

        try {
            const { showRenderNotification } =
                await importShowRenderNotification();

            expect({
                shouldShow: showRenderNotification(5, 3),
            }).toStrictEqual({ shouldShow: true });
            expect(chartStateMock.previousChartState).toStrictEqual({
                chartCount: 5,
                fieldsRendered: [
                    true,
                    true,
                    true,
                ],
                lastRenderTimestamp: 20_000,
            });
            expect(
                chartStateMock.updatePreviousChartState
            ).toHaveBeenCalledWith(5, 3, 20_000);
            expect(logSpy).toHaveBeenCalledWith(
                "[ChartJS] Showing notification due to time gap since last render"
            );
        } finally {
            logSpy.mockRestore();
            nowSpy.mockRestore();
        }
    });

    it("shows when chart count starts from zero", async () => {
        expect.assertions(2);

        resetTestState();
        setPreviousState({ chartCount: 0, lastRenderTimestamp: 1_000 });
        const { logSpy, nowSpy } = mockTime(5_000);

        try {
            const { showRenderNotification } =
                await importShowRenderNotification();

            expect({
                shouldShow: showRenderNotification(1, 0),
            }).toStrictEqual({ shouldShow: true });
            expect(chartStateMock.previousChartState.chartCount).toBe(1);
        } finally {
            logSpy.mockRestore();
            nowSpy.mockRestore();
        }
    });

    it("shows for significant visible field changes", async () => {
        expect.assertions(2);

        resetTestState();
        setPreviousState({
            chartCount: 5,
            fieldsRendered: [
                true,
                true,
                true,
            ],
            lastRenderTimestamp: 1_000,
        });
        const { logSpy, nowSpy } = mockTime(5_000);

        try {
            const { showRenderNotification } =
                await importShowRenderNotification();

            expect({
                shouldShow: showRenderNotification(5, 6),
            }).toStrictEqual({ shouldShow: true });
            expect(
                chartStateMock.previousChartState.fieldsRendered
            ).toHaveLength(6);
        } finally {
            logSpy.mockRestore();
            nowSpy.mockRestore();
        }
    });

    it("shows for significant chart count changes from nonzero", async () => {
        expect.assertions(2);

        resetTestState();
        setPreviousState({
            chartCount: 5,
            fieldsRendered: [
                true,
                true,
                true,
            ],
            lastRenderTimestamp: 1_000,
        });
        const { logSpy, nowSpy } = mockTime(5_000);

        try {
            const { showRenderNotification } =
                await importShowRenderNotification();

            expect({
                shouldShow: showRenderNotification(9, 3),
            }).toStrictEqual({ shouldShow: true });
            expect(chartStateMock.previousChartState.chartCount).toBe(9);
        } finally {
            logSpy.mockRestore();
            nowSpy.mockRestore();
        }
    });

    it("suppresses minor rerenders but still updates baseline state", async () => {
        expect.assertions(5);

        resetTestState();
        setPreviousState({
            chartCount: 5,
            fieldsRendered: [
                true,
                true,
                true,
            ],
            lastRenderTimestamp: 1_000,
        });
        const { logSpy, nowSpy } = mockTime(5_000);

        try {
            const { showRenderNotification } =
                await importShowRenderNotification();

            const outcome = { shouldShow: showRenderNotification(6, 4) };

            expect(outcome).toStrictEqual({ shouldShow: false });
            expect(outcome).not.toStrictEqual({ shouldShow: true });
            expect(chartStateMock.previousChartState.chartCount).toBe(6);
            expect(
                chartStateMock.previousChartState.fieldsRendered
            ).toHaveLength(4);
            expect(logSpy).toHaveBeenCalledWith(
                "[ChartJS] Suppressing notification - minor re-render detected"
            );
        } finally {
            logSpy.mockRestore();
            nowSpy.mockRestore();
        }
    });
});

async function importShowRenderNotification(): Promise<ShowRenderNotificationModule> {
    return import("../../../electron-app/utils/ui/notifications/showRenderNotification.js");
}

function mockTime(timestamp: number): {
    logSpy: ReturnType<typeof vi.spyOn>;
    nowSpy: ReturnType<typeof vi.spyOn>;
} {
    return {
        logSpy: vi.spyOn(console, "log").mockImplementation(() => {}),
        nowSpy: vi.spyOn(Date, "now").mockReturnValue(timestamp),
    };
}

function resetTestState(): void {
    vi.resetModules();
    chartStateMock.previousChartState.chartCount = 0;
    chartStateMock.previousChartState.fieldsRendered = [];
    chartStateMock.previousChartState.lastRenderTimestamp = 0;
    chartStateMock.updatePreviousChartState.mockClear();
}

function setPreviousState(
    state: Partial<typeof chartStateMock.previousChartState>
): void {
    Object.assign(chartStateMock.previousChartState, state);
}

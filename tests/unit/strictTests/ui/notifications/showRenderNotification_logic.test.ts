import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShowRenderNotificationRuntime } from "../../../../../electron-app/utils/ui/notifications/showRenderNotificationRuntime.js";

type MutableChartNotificationState = {
    chartCount: number;
    fieldsRendered: unknown[];
    lastRenderTimestamp: number;
};

type RenderNotificationScenario = {
    currentChartCount: number;
    currentVisibleFields: number;
    runtime?: ShowRenderNotificationRuntime | undefined;
};

type RenderNotificationDecision = {
    logMessages: string[];
    shouldShow: boolean;
    updateCalls: [
        number,
        number,
        number,
    ][];
};

const importChartNotificationState = async () =>
    import("../../../../../electron-app/utils/charts/core/chartNotificationState.js");

const importShowRenderNotification = async () =>
    import("../../../../../electron-app/utils/ui/notifications/showRenderNotification.js");

const mutablePreviousChartState = (
    previousChartState: unknown
): MutableChartNotificationState =>
    previousChartState as MutableChartNotificationState;

let consoleLogSpy: ReturnType<typeof vi.spyOn>;

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

async function setPreviousChartState({
    chartCount,
    fieldCount,
    lastRenderTimestamp,
}: {
    chartCount: number;
    fieldCount: number;
    lastRenderTimestamp: number;
}): Promise<Awaited<ReturnType<typeof importChartNotificationState>>> {
    const chartNotificationState = await importChartNotificationState();
    const previousChartState = mutablePreviousChartState(
        chartNotificationState.previousChartState
    );
    previousChartState.chartCount = chartCount;
    previousChartState.fieldsRendered = Array.from(
        { length: fieldCount },
        (_, index) => index
    );
    previousChartState.lastRenderTimestamp = lastRenderTimestamp;

    return chartNotificationState;
}

async function collectNotificationDecision({
    currentChartCount,
    currentVisibleFields,
    runtime,
}: RenderNotificationScenario): Promise<RenderNotificationDecision> {
    const chartNotificationState = await importChartNotificationState();
    const { showRenderNotification } = await importShowRenderNotification();

    return {
        shouldShow: showRenderNotification(
            currentChartCount,
            currentVisibleFields,
            runtime
        ),
        logMessages: consoleLogSpy.mock.calls.map(([message]) =>
            String(message)
        ),
        updateCalls: [
            ...vi.mocked(chartNotificationState.updatePreviousChartState).mock
                .calls,
        ],
    };
}

describe("showRenderNotification logic", () => {
    beforeEach(async () => {
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
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

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it("shows when >10s since last render", async () => {
        expect.assertions(1);

        vi.setSystemTime(20001);
        await expect(
            collectNotificationDecision({
                currentChartCount: 1,
                currentVisibleFields: 1,
            })
        ).resolves.toStrictEqual({
            logMessages: [
                "[ChartJS] Showing notification due to time gap since last render",
            ],
            shouldShow: true,
            updateCalls: [
                [
                    1,
                    1,
                    20_001,
                ],
            ],
        });
    });

    it("uses the injected runtime clock for render-decision timestamps", async () => {
        expect.assertions(3);

        const runtime: ShowRenderNotificationRuntime = {
            dateNow: vi.fn(() => Number("45")),
        };
        await setPreviousChartState({
            chartCount: 2,
            fieldCount: 2,
            lastRenderTimestamp: Number("40"),
        });
        const observedNotificationDecision = await collectNotificationDecision({
            currentChartCount: 2,
            currentVisibleFields: 2,
            runtime,
        });

        expect(runtime.dateNow).toHaveBeenCalledOnce();
        expect(observedNotificationDecision.shouldShow).toBe(false);
        expect(observedNotificationDecision.updateCalls).toStrictEqual([
            [
                2,
                2,
                45,
            ],
        ]);
    });

    it("shows when chart count changes significantly or from 0", async () => {
        expect.assertions(2);

        const chartNotificationState = await setPreviousChartState({
            chartCount: 5,
            fieldCount: 1,
            lastRenderTimestamp: Date.now(),
        });
        await expect(
            collectNotificationDecision({
                currentChartCount: 8,
                currentVisibleFields: 1,
            })
        ).resolves.toStrictEqual({
            logMessages: [
                "[ChartJS] Showing notification due to significant chart count change: 5 -> 8",
            ],
            shouldShow: true,
            updateCalls: [
                [
                    8,
                    1,
                    0,
                ],
            ],
        });

        vi.mocked(chartNotificationState.updatePreviousChartState).mockClear();
        consoleLogSpy.mockClear();
        await setPreviousChartState({
            chartCount: 0,
            fieldCount: 1,
            lastRenderTimestamp: Date.now(),
        });
        await expect(
            collectNotificationDecision({
                currentChartCount: 1,
                currentVisibleFields: 1,
            })
        ).resolves.toStrictEqual({
            logMessages: [
                "[ChartJS] Showing notification due to significant chart count change: 0 -> 1",
            ],
            shouldShow: true,
            updateCalls: [
                [
                    1,
                    1,
                    0,
                ],
            ],
        });
    });

    it("does not show for threshold-boundary changes", async () => {
        expect.assertions(3);

        await setPreviousChartState({
            chartCount: 3,
            fieldCount: 3,
            lastRenderTimestamp: Date.now(),
        });
        const observedNotificationDecision = await collectNotificationDecision({
            currentChartCount: 5,
            currentVisibleFields: 5,
        });

        expect(observedNotificationDecision.shouldShow).not.toBe(true);
        expect(observedNotificationDecision.shouldShow).toBe(false);
        expect(observedNotificationDecision).toStrictEqual({
            logMessages: [
                "[ChartJS] Suppressing notification - minor re-render detected",
            ],
            shouldShow: false,
            updateCalls: [
                [
                    5,
                    5,
                    0,
                ],
            ],
        });
    });

    it("shows when visible fields change significantly", async () => {
        expect.assertions(1);

        await setPreviousChartState({
            chartCount: 3,
            fieldCount: 3,
            lastRenderTimestamp: Date.now(),
        });
        await expect(
            collectNotificationDecision({
                currentChartCount: 3,
                currentVisibleFields: 7,
            })
        ).resolves.toStrictEqual({
            logMessages: [
                "[ChartJS] Showing notification due to significant field count change: 3 -> 7",
            ],
            shouldShow: true,
            updateCalls: [
                [
                    3,
                    7,
                    0,
                ],
            ],
        });
    });
});

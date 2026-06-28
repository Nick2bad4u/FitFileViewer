import { afterEach, describe, expect, it, vi } from "vitest";

const getRendererActiveTabMock = vi.hoisted(() =>
    vi.fn<() => unknown>(() => "chart")
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/rendererActiveTabState.js"),
    async (importOriginal) => {
        const actual = await importOriginal();

        return {
            ...actual,
            getRendererActiveTab: getRendererActiveTabMock,
        };
    }
);

import { handleChartRenderNotification } from "../../../../../electron-app/utils/charts/core/renderChartNotificationFlow.js";

describe("handleChartRenderNotification", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        getRendererActiveTabMock.mockReset();
        getRendererActiveTabMock.mockReturnValue("chart");
    });

    it("records the last notification through the typed notification setter", () => {
        expect.assertions(4);

        const notify = vi.fn();
        const schedule = vi.fn<(callback: () => void, delay: number) => void>(
            (callback) => callback()
        );
        const setLastNotification = vi.fn();

        handleChartRenderNotification(
            {
                isTestRuntime: false,
                notify,
                setLastNotification,
                showRenderNotification: () => true,
            },
            {
                dateNow: () => 1234,
                schedule,
                totalChartsRendered: 2,
                visibleFieldCount: 4,
            }
        );

        expect(schedule).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            100
        );
        expect(notify).toHaveBeenCalledExactlyOnceWith(
            "Rendered 2 charts successfully",
            "success"
        );
        expect(setLastNotification).toHaveBeenCalledExactlyOnceWith(
            {
                message: "Rendered 2 charts successfully",
                timestamp: 1234,
                type: "success",
            },
            { source: "renderChartsWithData" }
        );
        expect(getRendererActiveTabMock).toHaveBeenCalledTimes(2);
    });

    it("skips notification state when the chart tab is inactive", () => {
        expect.assertions(4);

        getRendererActiveTabMock.mockReturnValue("map");
        const outcome = {
            notified: false,
            scheduled: false,
            stored: false,
        };
        const notify = vi.fn();
        const schedule = vi.fn(() => {
            outcome.scheduled = true;
        });
        const setLastNotification = vi.fn(() => {
            outcome.stored = true;
        });

        handleChartRenderNotification(
            {
                isTestRuntime: false,
                notify: (...args) => {
                    outcome.notified = true;
                    return notify(...args);
                },
                setLastNotification,
                showRenderNotification: () => true,
            },
            {
                schedule,
                totalChartsRendered: 1,
                visibleFieldCount: 1,
            }
        );

        expect(schedule).not.toHaveBeenCalled();
        expect(notify).not.toHaveBeenCalled();
        expect(setLastNotification).not.toHaveBeenCalled();
        expect(outcome).toStrictEqual({
            notified: false,
            scheduled: false,
            stored: false,
        });
    });
});

import { describe, expect, it, vi } from "vitest";

import { emitChartsRenderedEvent } from "../../../../../electron-app/utils/charts/core/renderChartRenderedEvent.js";

const hasActiveFitChartDataMock = vi.hoisted(() => vi.fn<() => boolean>());

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitChartDataState.js"),
    () => ({
        hasActiveFitChartData: hasActiveFitChartDataMock,
    })
);

describe("emitChartsRenderedEvent", () => {
    it("emits chart render details with typed chart options", () => {
        expect.assertions(3);

        hasActiveFitChartDataMock.mockReturnValue(true);

        const dispatchedEvents: Event[] = [];
        const getChartOptions = vi.fn(() => ({ responsive: true }));

        emitChartsRenderedEvent(
            {
                CustomEventConstructor: CustomEvent,
                doc: {
                    dispatchEvent: (event) => {
                        dispatchedEvents.push(event);
                        return true;
                    },
                } as unknown as Document,
                getChartOptions,
                now: () => 1234,
            },
            {
                renderTime: 250,
                totalChartsRendered: 4,
                visibleFieldCount: 2,
            }
        );

        expect(getChartOptions).toHaveBeenCalledWith();
        expect(dispatchedEvents).toHaveLength(1);
        expect(dispatchedEvents[0]).toMatchObject({
            detail: {
                hasData: true,
                renderTime: 250,
                settings: { responsive: true },
                timestamp: 1234,
                totalRendered: 4,
                visibleFields: 2,
            },
            type: "chartsRendered",
        });
    });
});

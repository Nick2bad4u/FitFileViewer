import { describe, expect, it } from "vitest";

import { getChartStatusIndicatorRuntime } from "../../../../../electron-app/utils/charts/components/chartStatusIndicatorRuntime.js";

describe("getChartStatusIndicatorRuntime", () => {
    it("registers field toggle listeners through an injected runtime scope", () => {
        expect.assertions(2);

        const target = new EventTarget();
        const controller = new AbortController();
        let fieldToggleEvents = 0;
        const listener = (): void => {
            fieldToggleEvents += 1;
        };
        const runtime = getChartStatusIndicatorRuntime({
            addEventListener: target.addEventListener.bind(target),
        });

        runtime.addFieldToggleChangedListener(listener, {
            signal: controller.signal,
        });
        target.dispatchEvent(new Event("fieldToggleChanged"));

        expect(fieldToggleEvents).toBe(1);

        controller.abort();
        target.dispatchEvent(new Event("fieldToggleChanged"));

        expect(fieldToggleEvents).toBe(1);
    });

    it("reads viewport dimensions from an injected runtime scope", () => {
        expect.assertions(1);

        expect(
            getChartStatusIndicatorRuntime({
                innerHeight: 720,
                innerWidth: 1280,
            }).getViewport()
        ).toStrictEqual({
            height: 720,
            width: 1280,
        });
    });

    it("uses zero viewport dimensions when the scope does not provide them", () => {
        expect.assertions(1);

        expect(getChartStatusIndicatorRuntime({}).getViewport()).toStrictEqual({
            height: 0,
            width: 0,
        });
    });
});

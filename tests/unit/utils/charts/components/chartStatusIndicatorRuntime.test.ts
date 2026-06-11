import { describe, expect, it } from "vitest";

import { getChartStatusIndicatorRuntime } from "../../../../../electron-app/utils/charts/components/chartStatusIndicatorRuntime.js";

describe("getChartStatusIndicatorRuntime", () => {
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

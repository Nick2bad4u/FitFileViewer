import { beforeEach, describe, expect, it } from "vitest";

import {
    getMapDataPointFilter,
    getMapDataPointFilterLastResult,
    resetMapDataPointFilterStateForTests,
    setMapDataPointFilter,
    setMapDataPointFilterLastResult,
} from "../../../../electron-app/utils/maps/state/mapDataPointFilterState.js";

describe("mapDataPointFilterState", () => {
    beforeEach(() => {
        resetMapDataPointFilterStateForTests();
    });

    it("stores a copied data-point filter config", () => {
        expect.assertions(2);

        const config = {
            enabled: true,
            metric: "power",
            mode: "topPercent" as const,
            percent: 10,
        };

        setMapDataPointFilter(config);
        config.percent = 20;

        expect(getMapDataPointFilter()).toStrictEqual({
            enabled: true,
            metric: "power",
            mode: "topPercent",
            percent: 10,
        });

        setMapDataPointFilter(null);

        expect(getMapDataPointFilter()).toBeNull();
    });

    it("stores and clears the last filter result", () => {
        expect.assertions(2);

        const result = {
            applied: true,
            metric: "speed",
            percent: 15,
            selectedCount: 3,
            totalCandidates: 20,
        };

        setMapDataPointFilterLastResult(result);

        expect(getMapDataPointFilterLastResult()).toBe(result);

        resetMapDataPointFilterStateForTests();

        expect(getMapDataPointFilterLastResult()).toBeNull();
    });
});

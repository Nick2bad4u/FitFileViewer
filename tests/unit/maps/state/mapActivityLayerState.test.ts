import { beforeEach, describe, expect, it } from "vitest";

import {
    getRegisteredMapActivityLayerGroup,
    getRegisteredMapDataPointMarkers,
    registerMapDataPointMarker,
    resetMapActivityLayerStateForTests,
    resetRegisteredMapDataPointMarkers,
    setRegisteredMapActivityLayerGroup,
} from "../../../../electron-app/utils/maps/state/mapActivityLayerState.js";

describe("mapActivityLayerState", () => {
    beforeEach(() => {
        resetMapActivityLayerStateForTests();
    });

    it("registers and clears the current activity layer group", () => {
        expect.assertions(2);

        const activityLayerGroup = { clearLayers: () => {} };

        setRegisteredMapActivityLayerGroup(activityLayerGroup);

        expect(getRegisteredMapActivityLayerGroup()).toBe(activityLayerGroup);

        resetMapActivityLayerStateForTests();

        expect(getRegisteredMapActivityLayerGroup()).toBeNull();
    });

    it("registers and resets data point markers", () => {
        expect.assertions(2);

        const firstMarker = { bringToFront: () => {} };
        const secondMarker = { bringToFront: () => {} };

        registerMapDataPointMarker(firstMarker);
        registerMapDataPointMarker(secondMarker);

        expect(getRegisteredMapDataPointMarkers()).toStrictEqual([
            firstMarker,
            secondMarker,
        ]);

        resetRegisteredMapDataPointMarkers();

        expect(getRegisteredMapDataPointMarkers()).toStrictEqual([]);
    });
});

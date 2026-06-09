import { describe, expect, it, beforeEach } from "vitest";

import {
    DEFAULT_MAP_MARKER_COUNT,
    getMapMarkerCount,
    resetMapMarkerCount,
    setMapMarkerCount,
} from "../../../../electron-app/utils/maps/state/mapMarkerCountState.js";

describe("mapMarkerCountState", () => {
    beforeEach(() => {
        resetMapMarkerCount();
    });

    it("starts with the default marker count", () => {
        expect.assertions(1);

        expect(getMapMarkerCount()).toBe(DEFAULT_MAP_MARKER_COUNT);
    });

    it("stores supported marker count options", () => {
        expect.assertions(2);

        expect(setMapMarkerCount(200)).toBe(200);
        expect(getMapMarkerCount()).toBe(200);
    });

    it("stores zero as all markers", () => {
        expect.assertions(2);

        expect(setMapMarkerCount(0)).toBe(0);
        expect(getMapMarkerCount()).toBe(0);
    });

    it("falls back to the default for unsupported values", () => {
        expect.assertions(4);

        expect(setMapMarkerCount(999)).toBe(DEFAULT_MAP_MARKER_COUNT);
        expect(setMapMarkerCount(5)).toBe(DEFAULT_MAP_MARKER_COUNT);
        expect(setMapMarkerCount(-1)).toBe(DEFAULT_MAP_MARKER_COUNT);
        expect(setMapMarkerCount(Number.NaN)).toBe(DEFAULT_MAP_MARKER_COUNT);
    });
});

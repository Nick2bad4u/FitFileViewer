import { beforeEach, describe, expect, it } from "vitest";

import {
    clearMainMapPolyline,
    getMainMapPolyline,
    getMainMapPolylineOriginalBounds,
    getOverlayMapPolyline,
    getOverlayMapPolylines,
    registerOverlayMapPolyline,
    resetMapPolylineRegistryForTests,
    resetOverlayMapPolylines,
    setMainMapPolyline,
    setMainMapPolylineOriginalBounds,
} from "../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js";

describe("mapPolylineRegistryState", () => {
    beforeEach(() => {
        resetMapPolylineRegistryForTests();
    });

    it("registers and clears the main map polyline with stored bounds", () => {
        expect.assertions(4);

        const polyline = { options: { color: "#1976d2" } };
        const bounds = { isValid: () => true };

        setMainMapPolyline(polyline);
        setMainMapPolylineOriginalBounds(bounds);

        expect(getMainMapPolyline()).toBe(polyline);
        expect(getMainMapPolylineOriginalBounds()).toBe(bounds);

        clearMainMapPolyline();

        expect(getMainMapPolyline()).toBeNull();
        expect(getMainMapPolylineOriginalBounds()).toBeNull();
    });

    it("registers overlay polylines by numeric or string index", () => {
        expect.assertions(4);

        const firstPolyline = { options: { color: "#1976d2" } };
        const secondPolyline = { options: { color: "#388e3c" } };

        registerOverlayMapPolyline(1, firstPolyline);
        registerOverlayMapPolyline("2", secondPolyline);

        expect(getOverlayMapPolyline(1)).toBe(firstPolyline);
        expect(getOverlayMapPolyline("1")).toBe(firstPolyline);
        expect(getOverlayMapPolyline(2)).toBe(secondPolyline);
        expect(getOverlayMapPolylines()).toStrictEqual({
            "1": firstPolyline,
            "2": secondPolyline,
        });
    });

    it("resets overlay polylines without clearing main polyline state", () => {
        expect.assertions(3);

        const polyline = { options: { color: "#1976d2" } };
        const bounds = { isValid: () => true };
        setMainMapPolyline(polyline);
        setMainMapPolylineOriginalBounds(bounds);
        registerOverlayMapPolyline(1, { options: { color: "#388e3c" } });

        resetOverlayMapPolylines();

        expect(getMainMapPolyline()).toBe(polyline);
        expect(getMainMapPolylineOriginalBounds()).toBe(bounds);
        expect(getOverlayMapPolylines()).toStrictEqual({});
    });
});

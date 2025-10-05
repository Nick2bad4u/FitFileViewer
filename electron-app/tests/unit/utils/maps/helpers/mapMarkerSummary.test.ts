import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { createMarkerSummary, getMarkerPreference } from "../../../../../utils/maps/helpers/mapMarkerSummary.js";

type WindowWithMarkerSummary = typeof globalThis & {
    updateMapMarkerSummary?: ReturnType<typeof vi.fn>;
    mapMarkerCount?: number;
};

describe("mapMarkerSummary", () => {
    const testGlobal = globalThis as WindowWithMarkerSummary;

    beforeEach(() => {
        vi.restoreAllMocks();
        testGlobal.updateMapMarkerSummary = vi.fn();
        testGlobal.mapMarkerCount = 0;
    });

    afterEach(() => {
        delete testGlobal.updateMapMarkerSummary;
        delete testGlobal.mapMarkerCount;
    });

    it("aggregates multiple record calls and emits updates", () => {
        const summary = createMarkerSummary();

        summary.reset();
    expect(testGlobal.updateMapMarkerSummary).toBeDefined();
    expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 0, total: 0 });

        summary.record(120, 40);
    expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 40, total: 120 });

        summary.record(80, 20);
    expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 60, total: 200 });

        summary.reset();
    expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 0, total: 0 });
    });

    it("treats zero rendered markers as rendering all points", () => {
        const summary = createMarkerSummary();
        summary.reset();

        summary.record(50, 0);
    expect(testGlobal.updateMapMarkerSummary!).toHaveBeenLastCalledWith({ rendered: 50, total: 50 });
    });

    it("returns zero marker preference when global setting is invalid", () => {
    testGlobal.mapMarkerCount = "not-a-number" as unknown as number;
        expect(getMarkerPreference()).toBe(0);

        testGlobal.mapMarkerCount = 15;
        expect(getMarkerPreference()).toBe(15);
    });
});

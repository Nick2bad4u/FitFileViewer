import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addSimpleMeasureTool } from "../utils/mapMeasureTool";

describe("addSimpleMeasureTool", () => {
    let map, controlsDiv;
    beforeEach(() => {
        map = {
            on: vi.fn(),
            off: vi.fn(),
            removeLayer: vi.fn(),
            distance: vi.fn(() => 1000),
        };
        controlsDiv = document.createElement("div");
        document.body.appendChild(controlsDiv);
        window.L = {
            marker: vi.fn(() => ({ addTo: vi.fn(() => ({ getElement: vi.fn(() => null) })) })),
            polyline: vi.fn(() => ({ addTo: vi.fn() })),
            latLng: vi.fn((lat, lng) => ({ lat, lng })),
            divIcon: vi.fn(() => ({})),
        };
    });
    afterEach(() => {
        document.body.removeChild(controlsDiv);
        delete window.L;
    });
    it("should add a measure button to controlsDiv", () => {
        addSimpleMeasureTool(map, controlsDiv);
        expect(controlsDiv.querySelector("button")).not.toBeNull();
    });
    it("should not throw when clicking the measure button", () => {
        addSimpleMeasureTool(map, controlsDiv);
        const btn = controlsDiv.querySelector("button");
        expect(() => btn.click()).not.toThrow();
    });
});

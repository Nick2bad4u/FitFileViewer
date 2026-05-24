/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addSimpleMeasureTool } from "../../../utils/maps/controls/mapMeasureTool.js";

describe("mapMeasureTool.js", () => {
    // Mock document and its elements
    /** @type {HTMLElement} */
    let mapDiv;

    /** @type {HTMLElement} */
    let controlsDiv;

    /** @type {any} */
    let mockMap;

    /** @type {HTMLElement[]} */
    let addedLayers = [];

    beforeEach(() => {
        // Create map element
        mapDiv = document.createElement("div");
        mapDiv.id = "leaflet-map";
        document.body.appendChild(mapDiv);

        // Create controls container
        controlsDiv = document.createElement("div");
        controlsDiv.className = "map-controls";
        document.body.appendChild(controlsDiv);

        // Mock Leaflet map
        mockMap = {
            on: vi.fn(),
            off: vi.fn(),
            addLayer: vi.fn((layer) => {
                addedLayers.push(layer);
                return mockMap;
            }),
            removeLayer: vi.fn((layer) => {
                const index = addedLayers.indexOf(layer);
                if (index !== -1) {
                    addedLayers.splice(index, 1);
                }
                return mockMap;
            }),
            distance: vi.fn((p1, p2) => {
                // Simple mock implementation to calculate distance
                const lat1 = p1.lat;
                const lng1 = p1.lng;
                const lat2 = p2.lat;
                const lng2 = p2.lng;

                // Simple Euclidean distance (not real-world, just for testing)
                return (
                    Math.sqrt(
                        Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)
                    ) * 111000
                ); // Rough meters
            }),
        };

        // Mock global Leaflet (L)
        global.L = {
            marker: vi.fn((_latlng, _options) => {
                const marker = {
                    addTo: vi.fn((map) => {
                        map.addLayer(marker);
                        return marker;
                    }),
                    getElement: vi.fn(() => {
                        const el = document.createElement("div");
                        el.className = "leaflet-marker-icon";
                        return el;
                    }),
                };
                return marker;
            }),
            polyline: vi.fn((_points, _options) => {
                const polyline = {
                    addTo: vi.fn((map) => {
                        map.addLayer(polyline);
                        return polyline;
                    }),
                };
                return polyline;
            }),
            latLng: vi.fn((lat, lng) => {
                return { lat, lng };
            }),
            divIcon: vi.fn(({ className, html }) => {
                return { className, html };
            }),
        };

        // Set up fake timers for setTimeout
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Clean up
        if (mapDiv && mapDiv.parentNode) {
            mapDiv.parentNode.removeChild(mapDiv);
        }

        if (controlsDiv && controlsDiv.parentNode) {
            controlsDiv.parentNode.removeChild(controlsDiv);
        }

        addedLayers = [];
        delete global.L;

        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    function getMeasureButton() {
        const button = controlsDiv.querySelector("button.map-action-btn");
        expect(button).toBeInstanceOf(HTMLButtonElement);
        if (!(button instanceof HTMLButtonElement)) {
            throw new Error("Measure button was not rendered");
        }
        return button;
    }

    function getMeasureButtonLabel(button) {
        return button.querySelector("span")?.textContent?.trim();
    }

    it("should add measure button to controls div", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        // Check if button was added
        const button = getMeasureButton();
        expect(getMeasureButtonLabel(button)).toBe("Measure");
        expect(button.title).toContain(
            "Click, then click two points"
        );
    });

    it("should enable measurement mode when button is clicked", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Click the button to enable measurement
        button.click();

        // Check if map.on was called for click event
        expect(mockMap.on).toHaveBeenCalledWith("click", expect.any(Function));

        // Check if button title and content was updated
        expect(button.title).toBe("Cancel measurement mode");
        expect(button.innerHTML).toContain("Cancel");

        // Check if button is temporarily disabled
        expect(button.disabled).toBe(true);

        // Advance timers to enable the button again
        vi.advanceTimersByTime(2000);

        // Button should be enabled again
        expect(button.disabled).toBe(false);
    });

    it("should handle map clicks in measurement mode", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Get the click handler
        const clickHandler = mockMap.on.mock.calls.find(
            /** @param {any} call */ (call) => call[0] === "click"
        )[1];

        // Simulate first point click
        clickHandler({ latlng: { lat: 0, lng: 0 } });

        // Should have added a marker
        expect(global.L.marker).toHaveBeenCalledWith(
            { lat: 0, lng: 0 },
            { draggable: false }
        );
        expect(mockMap.addLayer).toHaveBeenCalled();
        expect(addedLayers).toHaveLength(1);

        // Reset mock counts to distinguish second click calls
        global.L.marker.mockClear();
        mockMap.addLayer.mockClear();

        // Simulate second point click
        clickHandler({ latlng: { lat: 1, lng: 1 } });

        // Should have added another marker
        expect(global.L.marker).toHaveBeenCalledWith(
            { lat: 1, lng: 1 },
            { draggable: false }
        );
        expect(addedLayers).toHaveLength(4);

        // Should have created a polyline and distance label
        expect(global.L.polyline).toHaveBeenCalledWith(
            [
                { lat: 0, lng: 0 },
                { lat: 1, lng: 1 },
            ],
            {
                color: "#222",
                dashArray: "4,6",
                weight: 3,
            }
        );
        expect(global.L.marker).toHaveBeenCalledTimes(2); // One for point and one for label

        // Measurement mode should be disabled after second click
        expect(mockMap.off).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("should clear measurement when clicking twice in measure mode", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Get the click handler
        const clickHandler = mockMap.on.mock.calls.find(
            (call) => call[0] === "click"
        )[1];

        // Add two points to complete a measurement
        clickHandler({ latlng: { lat: 0, lng: 0 } });
        clickHandler({ latlng: { lat: 1, lng: 1 } });

        // Reset mocks for clarity
        mockMap.removeLayer.mockClear();

        // Create a new measurement (which should clear the old one)
        clickHandler({ latlng: { lat: 2, lng: 2 } });

        // Should have cleared previous measurement by removing layers
        expect(mockMap.removeLayer).toHaveBeenCalled();
        expect(addedLayers).toHaveLength(1);
    });

    it("should handle Escape key to cancel measurement", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Get the click handler and make a point
        const clickHandler = mockMap.on.mock.calls.find(
            /** @param {any} call */ (call) => call[0] === "click"
        )[1];
        clickHandler({ latlng: { lat: 0, lng: 0 } });

        // Reset mocks
        mockMap.removeLayer.mockClear();
        mockMap.off.mockClear();

        // Simulate Escape key press
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

        // Should have removed the marker and disabled measurement mode
        expect(mockMap.removeLayer).toHaveBeenCalled();
        expect(mockMap.off).toHaveBeenCalledWith("click", expect.any(Function));

        // Button should be reset
        expect(getMeasureButtonLabel(button)).toBe("Measure");
        expect(addedLayers).toHaveLength(0);
    });

    it("should disable and re-enable measurement mode when button is clicked twice", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Check that mode is enabled
        expect(mockMap.on).toHaveBeenCalledWith("click", expect.any(Function));
        expect(getMeasureButtonLabel(button)).toBe("Cancel");

        // Reset mocks
        mockMap.on.mockClear();
        mockMap.off.mockClear();

        // Skip past the button disable timeout
        vi.advanceTimersByTime(2000);

        // Click again to disable
        button.click();

        // Check that mode is disabled
        expect(mockMap.off).toHaveBeenCalledWith("click", expect.any(Function));
        expect(getMeasureButtonLabel(button)).toBe("Measure");
    });

    it("does not add measurement layers when Leaflet is unavailable", () => {
        delete global.L;
        addSimpleMeasureTool(mockMap, controlsDiv);
        const button = getMeasureButton();

        button.click();
        const clickHandler = mockMap.on.mock.calls.find(
            (call) => call[0] === "click"
        )[1];

        expect(() =>
            clickHandler({ latlng: { lat: 0, lng: 0 } })
        ).not.toThrow();
        expect(addedLayers).toHaveLength(0);
        expect(mockMap.addLayer).not.toHaveBeenCalled();
    });

    it("should remove measurement when clicking the exit button", () => {
        // To properly test the exit button click, we need to enhance our mocking approach

        // Set up a mock implementation for Leaflet's marker that allows us to simulate the exit button click

        // Override the getElement implementation to capture the click handler
        global.L.marker = vi.fn((_latlng, options) => {
            const labelElement = document.createElement("div");
            labelElement.className = "leaflet-marker-icon";
            if (options?.icon?.html instanceof HTMLElement) {
                labelElement.append(options.icon.html);
            }
            const marker = {
                addTo: vi.fn((map) => {
                    map.addLayer(marker);
                    return marker;
                }),
                getElement: vi.fn(() => labelElement),
            };
            return marker;
        });

        // Now initialize the measurement tool and create a measurement
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Get the click handler
        const mapClickHandler = mockMap.on.mock.calls.find(
            /** @param {any} call */ (call) => call[0] === "click"
        )[1];

        // Add two points to complete a measurement
        mapClickHandler({ latlng: { lat: 0, lng: 0 } });
        mapClickHandler({ latlng: { lat: 1, lng: 1 } });

        // Verify that the divIcon was created with the exit button
        expect(global.L.divIcon).toHaveBeenCalled();
        const divIconCall = global.L.divIcon.mock.calls[0][0];
        expect(divIconCall.html).toBeInstanceOf(HTMLElement);
        const exitButton = divIconCall.html.querySelector(".measure-exit-btn");
        expect(exitButton).toBeInstanceOf(HTMLButtonElement);
        if (!(exitButton instanceof HTMLButtonElement)) {
            throw new Error("Measure label exit button was not rendered");
        }

        // Reset mock before testing exit button functionality
        mockMap.removeLayer.mockClear();

        exitButton.click();

        // Now verify that removeLayer was called, indicating measurements were cleared
        expect(mockMap.removeLayer).toHaveBeenCalled();
        expect(addedLayers).toHaveLength(0);
    });
});

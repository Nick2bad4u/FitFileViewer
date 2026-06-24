// @vitest-environment jsdom
/* eslint-disable vitest/require-mock-type-parameters -- Legacy Leaflet mock shape is intentionally broad while this suite is moved to root ownership. */
/* eslint-disable vitest/prefer-expect-assertions -- These interaction tests use helper assertions and variable event flows. */
/* eslint-disable vitest/no-conditional-in-test -- The final DOM narrowing mirrors the user interaction being tested. */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    addSimpleMeasureTool,
    resetMapMeasureToolStateForTests,
} from "../../../../electron-app/utils/maps/controls/mapMeasureTool.js";
import type { MapMeasureToolRuntime } from "../../../../electron-app/utils/maps/controls/mapMeasureToolRuntime.js";
import {
    clearLeafletRuntimeForTests,
    setLeafletRuntime,
} from "../../../../electron-app/utils/maps/core/leafletRuntime.js";

describe("mapMeasureTool.js", () => {
    let mapDiv: HTMLElement;
    let controlsDiv: HTMLElement;
    let mockLeaflet: any;
    let mockMap: any;
    let addedLayers: any[] = [];

    beforeEach(() => {
        resetMapMeasureToolStateForTests();
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

        mockLeaflet = {
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
        setLeafletRuntime(mockLeaflet);

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
        resetMapMeasureToolStateForTests();
        clearLeafletRuntimeForTests();

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

    function getMapClickHandler() {
        const clickHandler = mockMap.on.mock.calls.find(
            (call) => call[0] === "click"
        )?.[1];

        expect(clickHandler).toBeTypeOf("function");
        if (typeof clickHandler !== "function") {
            throw new Error("Map click handler was not registered");
        }

        return clickHandler;
    }

    it("should add measure button to controls div", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        // Check if button was added
        const button = getMeasureButton();
        expect(getMeasureButtonLabel(button)).toBe("Measure");
        expect(button.title).toContain("Click, then click two points");
    });

    it("builds the measure control through an injected runtime", () => {
        const runtime: MapMeasureToolRuntime = {
            addDocumentKeydownListener: vi.fn(),
            clearTimeout: vi.fn((timer) => clearTimeout(timer)),
            createAbortController: vi.fn(() => new AbortController()),
            createElement: vi.fn((tagName) => document.createElement(tagName)),
            createSvgElement: vi.fn((tagName) =>
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    tagName
                )
            ),
            createTextNode: vi.fn((data) => document.createTextNode(data)),
            isHTMLElement: vi.fn(
                (value): value is HTMLElement => value instanceof HTMLElement
            ),
            removeDocumentKeydownListener: vi.fn(),
            setTimeout: vi.fn((callback, delayMs) =>
                setTimeout(callback, delayMs)
            ),
        };

        addSimpleMeasureTool(mockMap, controlsDiv, runtime);

        const button = getMeasureButton();

        expect(runtime.createAbortController).toHaveBeenCalledOnce();
        expect(runtime.createElement).toHaveBeenCalledWith("button");
        expect(runtime.createSvgElement).toHaveBeenCalledWith("svg");
        expect(runtime.addDocumentKeydownListener).toHaveBeenCalledOnce();
        expect(getMeasureButtonLabel(button)).toBe("Measure");
        expect(button.title).toContain("Click, then click two points");
    });

    it("should enable measurement mode when button is clicked", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Click the button to enable measurement
        button.click();

        // Check if map.on was called for click event
        expect(mockMap.on).toHaveBeenCalledWith("click", getMapClickHandler());

        // Check if button title and content was updated
        expect(button.title).toBe("Cancel measurement mode");
        expect(button.innerHTML).toContain("Cancel");

        // Check if button is temporarily disabled
        expect(button).toHaveProperty("disabled", true);

        // Advance timers to enable the button again
        vi.advanceTimersByTime(2000);

        // Button should be enabled again
        expect(button).toHaveProperty("disabled", false);
    });

    it("should handle map clicks in measurement mode", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Get the click handler
        const clickHandler = getMapClickHandler();

        // Simulate first point click
        clickHandler({ latlng: { lat: 0, lng: 0 } });

        // Should have added a marker
        expect(mockLeaflet.marker).toHaveBeenCalledWith(
            { lat: 0, lng: 0 },
            { draggable: false }
        );
        expect(mockMap.addLayer).toHaveBeenCalledOnce();
        expect(addedLayers).toHaveLength(1);

        // Reset mock counts to distinguish second click calls
        mockLeaflet.marker.mockClear();
        mockMap.addLayer.mockClear();

        // Simulate second point click
        clickHandler({ latlng: { lat: 1, lng: 1 } });

        // Should have added another marker
        expect(mockLeaflet.marker).toHaveBeenCalledWith(
            { lat: 1, lng: 1 },
            { draggable: false }
        );
        expect(addedLayers).toHaveLength(4);

        // Should have created a polyline and distance label
        expect(mockLeaflet.polyline).toHaveBeenCalledWith(
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
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(2); // One for point and one for label

        // Measurement mode should be disabled after second click
        expect(mockMap.off).toHaveBeenCalledWith("click", clickHandler);
    });

    it("should clear measurement when clicking twice in measure mode", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Get the click handler
        const clickHandler = getMapClickHandler();

        // Add two points to complete a measurement
        clickHandler({ latlng: { lat: 0, lng: 0 } });
        clickHandler({ latlng: { lat: 1, lng: 1 } });

        // Reset mocks for clarity
        mockMap.removeLayer.mockClear();

        // Create a new measurement (which should clear the old one)
        clickHandler({ latlng: { lat: 2, lng: 2 } });

        // Should have cleared previous measurement by removing layers
        expect(mockMap.removeLayer).toHaveBeenCalledTimes(4);
        expect(addedLayers).toHaveLength(1);
    });

    it("should handle Escape key to cancel measurement", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        expect("__ffvMapMeasureEscapeHandler" in globalThis).toBe(false);

        // Enable measurement mode
        button.click();

        // Get the click handler and make a point
        const clickHandler = getMapClickHandler();
        clickHandler({ latlng: { lat: 0, lng: 0 } });

        // Reset mocks
        mockMap.removeLayer.mockClear();
        mockMap.off.mockClear();

        // Simulate Escape key press
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

        // Should have removed the marker and disabled measurement mode
        expect(mockMap.removeLayer).toHaveBeenCalledOnce();
        expect(mockMap.off).toHaveBeenCalledWith("click", clickHandler);

        // Button should be reset
        expect(getMeasureButtonLabel(button)).toBe("Measure");
        expect(addedLayers).toStrictEqual([]);
    });

    it("should disable and re-enable measurement mode when button is clicked twice", () => {
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Check that mode is enabled
        const clickHandler = getMapClickHandler();
        expect(mockMap.on).toHaveBeenCalledWith("click", clickHandler);
        expect(getMeasureButtonLabel(button)).toBe("Cancel");

        // Reset mocks
        mockMap.on.mockClear();
        mockMap.off.mockClear();

        // Skip past the button disable timeout
        vi.advanceTimersByTime(2000);

        // Click again to disable
        button.click();

        // Check that mode is disabled
        expect(mockMap.off).toHaveBeenCalledWith("click", clickHandler);
        expect(getMeasureButtonLabel(button)).toBe("Measure");
    });

    it("does not add measurement layers when Leaflet is unavailable", () => {
        clearLeafletRuntimeForTests();
        addSimpleMeasureTool(mockMap, controlsDiv);
        const button = getMeasureButton();

        button.click();
        const clickHandler = getMapClickHandler();

        clickHandler({ latlng: { lat: 0, lng: 0 } });

        expect(addedLayers).toStrictEqual([]);
        expect(mockMap.addLayer).not.toHaveBeenCalled();
    });

    it("should remove measurement when clicking the exit button", () => {
        // To properly test the exit button click, we need to enhance our mocking approach

        // Set up a mock implementation for Leaflet's marker that allows us to simulate the exit button click

        // Override the getElement implementation to capture the click handler
        vi.spyOn(mockLeaflet, "marker").mockImplementation(
            (_latlng, options) => {
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
            }
        );

        // Now initialize the measurement tool and create a measurement
        addSimpleMeasureTool(mockMap, controlsDiv);

        const button = getMeasureButton();

        // Enable measurement mode
        button.click();

        // Get the click handler
        const mapClickHandler = getMapClickHandler();

        // Add two points to complete a measurement
        mapClickHandler({ latlng: { lat: 0, lng: 0 } });
        mapClickHandler({ latlng: { lat: 1, lng: 1 } });

        // Verify that the divIcon was created with the exit button
        expect(mockLeaflet.divIcon).toHaveBeenCalledOnce();
        const divIconCall = mockLeaflet.divIcon.mock.calls[0][0];
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
        expect(mockMap.removeLayer).toHaveBeenCalledTimes(4);
        expect(addedLayers).toStrictEqual([]);
    });
});
/* eslint-enable vitest/no-conditional-in-test */
/* eslint-enable vitest/prefer-expect-assertions */
/* eslint-enable vitest/require-mock-type-parameters */

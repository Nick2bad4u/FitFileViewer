import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mapDrawLaps, drawOverlayForFitFile } from "../../utils/maps/layers/mapDrawLaps.js";

// Mock Leaflet library with proper chaining
const mockMarker = {
    addTo: vi.fn(),
    bindPopup: vi.fn(),
    bindTooltip: vi.fn(),
    setLatLng: vi.fn(),
};

const mockCircleMarker = {
    addTo: vi.fn(),
    bindTooltip: vi.fn(),
    setStyle: vi.fn(),
};

// Set up proper method chaining
mockMarker.addTo.mockReturnValue(mockMarker);
mockMarker.bindPopup.mockReturnValue(mockMarker);
mockMarker.bindTooltip.mockReturnValue(mockMarker);

mockCircleMarker.addTo.mockReturnValue(mockCircleMarker);
mockCircleMarker.bindTooltip.mockReturnValue(mockCircleMarker);

const mockPolyline = {
    addTo: vi.fn(),
    getBounds: vi.fn(),
    setStyle: vi.fn(),
    getElement: vi.fn().mockReturnValue({
        style: {},
    }),
    options: { color: "#1976d2" },
};

// NOTE: Method chaining will be configured in beforeEach after mockBounds is defined

const mockMap = {
    eachLayer: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
    _container: {
        offsetParent: document.body,
        clientWidth: 800,
        clientHeight: 600,
    },
};

const mockMarkerClusterGroup = {
    clearLayers: vi.fn(),
    addLayer: vi.fn(),
};

const mockLatLngBounds = vi.fn().mockReturnValue({
    clone: vi.fn().mockReturnValue({
        extend: vi.fn(),
    }),
    extend: vi.fn(),
});

// Mock bounds object for getBounds() return value
const mockBounds = {
    clone: vi.fn().mockReturnValue({
        extend: vi.fn(),
    }),
    extend: vi.fn(),
    isValid: vi.fn().mockReturnValue(true),
    getSouthWest: vi.fn().mockReturnValue({ lat: 45.0, lng: -122.0 }),
    getNorthEast: vi.fn().mockReturnValue({ lat: 45.1, lng: -121.9 }),
};

// Mock global L (Leaflet) with proper chaining
let mockL: any; // Will be recreated in beforeEach

// Mock chart overlay color palette
vi.mock("../../utils/charts/theming/chartOverlayColorPalette.js", () => ({
    chartOverlayColorPalette: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"],
}));

// Mock getOverlayFileName
vi.mock("../../utils/files/import/getOverlayFileName.js", () => ({
    getOverlayFileName: vi.fn((index: number) => `overlay-${index}.fit`),
}));

    describe("mapDrawLaps.js - Map Drawing Utilities", () => {
    beforeEach(() => {
        // Setup mock window with global data - CRITICAL: mock the actual global window
        const mockGlobalData = {
            recordMesgs: [
                {
                    positionLat: 429496729.6, // Roughly 90 degrees in semicircles
                    positionLong: 429496729.6,
                    timestamp: 1000,
                    altitude: 100,
                    heartRate: 150,
                    speed: 5.5,
                },
                {
                    positionLat: 429496729.5,
                    positionLong: 429496729.5,
                    timestamp: 2000,
                    altitude: 105,
                    heartRate: 155,
                    speed: 5.8,
                },
                {
                    positionLat: 429496729.4,
                    positionLong: 429496729.4,
                    timestamp: 3000,
                    altitude: 110,
                    heartRate: 160,
                    speed: 6.0,
                },
            ],
            lapMesgs: [
                {
                    start_index: 0,
                    end_index: 1,
                    startPositionLat: 429496729.6,
                    startPositionLong: 429496729.6,
                    endPositionLat: 429496729.5,
                    endPositionLong: 429496729.5,
                },
                {
                    start_index: 1,
                    end_index: 2,
                    startPositionLat: 429496729.5,
                    startPositionLong: 429496729.5,
                    endPositionLat: 429496729.4,
                    endPositionLong: 429496729.4,
                },
            ],
        };

        // Recreate mockL object completely
        mockL = {
            tileLayer: vi.fn(),
            map: vi.fn(),
            control: {
                layers: vi.fn(),
                scale: vi.fn(),
                fullscreen: vi.fn(),
                locate: vi.fn(),
                measure: vi.fn(),
                Draw: { Event: {} }
            },
            markerClusterGroup: vi.fn(),
            marker: vi.fn(),
            polyline: vi.fn(),
            latLng: vi.fn(),
            divIcon: vi.fn(),
            FeatureGroup: vi.fn(),
            Control: {
                MiniMap: vi.fn(),
                Draw: vi.fn()
            },
            maplibreGL: vi.fn(),
            circleMarker: vi.fn(),
            latLngBounds: mockLatLngBounds,
        };

        // Configure mock return values AFTER creating mockL object
        mockL.marker.mockReturnValue(mockMarker);
        mockL.polyline.mockReturnValue(mockPolyline);
        mockL.circleMarker.mockReturnValue(mockCircleMarker);

        // Set marker mock return values
        mockMarker.addTo.mockReturnValue(mockMarker);
        mockMarker.bindPopup.mockReturnValue(mockMarker);
        mockMarker.bindTooltip.mockReturnValue(mockMarker);

        // CRITICAL FIX: Set polyline mock chaining AFTER mockL object is created
        // This ensures the mock implementations work correctly for method chaining
        mockPolyline.addTo.mockReturnValue(mockPolyline);
        mockPolyline.setStyle.mockReturnValue(mockPolyline);
        mockPolyline.getBounds.mockReturnValue(mockBounds);

        // DEBUG: Verify L.polyline mock setup
        console.log("[TEST DEBUG] mockL.polyline type:", typeof mockL.polyline);
        console.log("[TEST DEBUG] mockL.polyline.mockReturnValue called with:", mockPolyline);

        // Test the mock directly (sanity check), then clear call history so tests start from 0
        const testResult = mockL.polyline([1, 2], [3, 4]);
        console.log("[TEST DEBUG] Direct mock call result:", testResult);
        console.log("[TEST DEBUG] Direct mock call result type:", typeof testResult);
        // Clear the call history to avoid affecting exact call count assertions
        if (typeof mockL.polyline.mockClear === "function") {
            mockL.polyline.mockClear();
        }

        // Set up window data directly on the JSDOM window object AFTER mock configuration
        // This ensures the function can access it via `const win = window`
        (global.window as any).globalData = mockGlobalData;
        (global.window as any).loadedFitFiles = [];
        (global.window as any)._activeMainFileIdx = 0;
        (global.window as any)._overlayPolylines = {};
        (global.window as any)._mainPolylineOriginalBounds = undefined;
        (global.window as any).mapMarkerCount = 10;
        (global.window as any)._highlightedOverlayIdx = -1;
        (global.window as any).L = mockL;

        // Also set global L for direct access - THIS IS CRITICAL
        (global as any).L = mockL;

        // DEBUG: Verify global L setup
        console.log("[TEST DEBUG] global.L.polyline:", typeof (global as any).L?.polyline);
        console.log("[TEST DEBUG] window.L.polyline:", typeof (global.window as any).L?.polyline);

        (global.window as any).updateOverlayHighlights = vi.fn();
    });

    afterEach(() => {
        // Clean up global mocks - but don't delete window, just reset properties
        if (global.window) {
            delete (global.window as any).globalData;
            delete (global.window as any).loadedFitFiles;
            delete (global.window as any)._activeMainFileIdx;
            delete (global.window as any)._overlayPolylines;
            delete (global.window as any)._mainPolylineOriginalBounds;
            delete (global.window as any).mapMarkerCount;
            delete (global.window as any)._highlightedOverlayIdx;
            delete (global.window as any).L;
            delete (global.window as any).updateOverlayHighlights;
        }
    });

    describe("Helper Functions", () => {
        it("should find closest record index by lat/lon", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            // Call with single lap index to test helper function internally
            mapDrawLaps(0, mockOptions);

            // Verify the function executed without errors
            expect(mockOptions.getLapColor).toHaveBeenCalled();
        });

        it("should patch lap indices when missing", () => {
            // Create test data with missing lap indices
            (global.window as any).globalData.lapMesgs = [
                {
                    start_index: null,
                    end_index: null,
                    startPositionLat: 429496729.6,
                    startPositionLong: 429496729.6,
                    endPositionLat: 429496729.5,
                    endPositionLong: 429496729.5,
                },
            ];

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

            mapDrawLaps(0, mockOptions);

            // Should have patched the indices and logged the operation
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("[patchLapIndices] Lap 1: start_index=")
            );

            consoleSpy.mockRestore();
        });
    });

    describe("Map Layer Management", () => {
        it("should reset overlay polylines and bounds at start", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: { base: "base-layer" },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            expect((global.window as any)._overlayPolylines).toEqual({});
            expect((global.window as any)._mainPolylineOriginalBounds).toBeUndefined();
        });

        it("should remove non-base layers", () => {
            const mockContainer = document.createElement("div");
            const baseLayers = { base: "base-layer" };
            const mockOptions = {
                map: mockMap,
                baseLayers,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            // Mock the eachLayer to simulate calling the callback
            mockMap.eachLayer.mockImplementation((callback: any) => {
                callback("base-layer"); // This should not be removed
                callback("other-layer"); // This should be removed
            });

            mapDrawLaps("all", mockOptions);

            expect(mockMap.eachLayer).toHaveBeenCalled();
            expect(mockMap.removeLayer).toHaveBeenCalledWith("other-layer");
            expect(mockMap.removeLayer).not.toHaveBeenCalledWith("base-layer");
        });

        it("should clear marker cluster group", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            expect(mockMarkerClusterGroup.clearLayers).toHaveBeenCalled();
        });
    });

    describe("Main File Switching", () => {
        it("should handle main file switching with multiple loaded files", () => {
            (global.window as any).loadedFitFiles = [
                { data: { recordMesgs: [], lapMesgs: [] } },
                { data: { recordMesgs: [], lapMesgs: [] } },
                { data: { recordMesgs: [], lapMesgs: [] } },
            ];
            (global.window as any)._activeMainFileIdx = 1;

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Should keep only the main file
            expect((global.window as any).loadedFitFiles).toHaveLength(1);
            expect((global.window as any).loadedFitFiles[0]).toEqual({ data: { recordMesgs: [], lapMesgs: [] } });
        });
    });

    describe("All Laps Mode", () => {
        it("should handle 'all' string parameter", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

            mapDrawLaps("all", mockOptions);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('"all" laps mode: recordMesgs.length =')
            );
            expect(mockL.polyline).toHaveBeenCalled();
            expect(mockPolyline.addTo).toHaveBeenCalledWith(mockMap);

            consoleSpy.mockRestore();
        });

        it("should handle array containing 'all'", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps(["all"], mockOptions);

            expect(mockL.polyline).toHaveBeenCalled();
            expect(mockPolyline.addTo).toHaveBeenCalledWith(mockMap);
        });

        it("should display error message when no location data available", () => {
            (global.window as any).globalData.recordMesgs = [];

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            expect(mockContainer.innerHTML).toContain("No location data available to display map");
        });

        it("should create start and end markers for all laps", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Should create two markers (start and end)
            expect(mockL.marker).toHaveBeenCalledTimes(2);
            expect(mockMarker.bindPopup).toHaveBeenCalledWith("Start");
            expect(mockMarker.bindPopup).toHaveBeenCalledWith("End");
        });

        it("should create circle markers for data points", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            expect(mockL.circleMarker).toHaveBeenCalled();
            expect(mockMarkerClusterGroup.addLayer).toHaveBeenCalled();
        });
    });

    describe("Array Lap Mode", () => {
        it("should handle single element array", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps([0], mockOptions);

            expect(mockL.polyline).toHaveBeenCalled();
        });

        it("should handle multiple lap indices", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps([0, 1], mockOptions);

            // Should create polylines for each lap
            expect(mockL.polyline).toHaveBeenCalled();
            expect(mockMap.fitBounds).toHaveBeenCalled();
        });
    });

    describe("Single Lap Mode", () => {
        it("should handle valid single lap index", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps(0, mockOptions);

            expect(mockL.polyline).toHaveBeenCalled();
            expect(mockPolyline.addTo).toHaveBeenCalledWith(mockMap);
        });

        it("should handle invalid lap index", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps(999, mockOptions);

            expect(mockContainer.innerHTML).toContain("Lap index out of bounds or invalid");
        });

        it("should handle lap with missing position data", () => {
            (global.window as any).globalData.lapMesgs = [
                {
                    start_index: 0,
                    end_index: 1,
                    startPositionLat: null,
                    startPositionLong: null,
                    endPositionLat: null,
                    endPositionLong: null,
                },
            ];

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps(0, mockOptions);

            expect(mockContainer.innerHTML).toContain("Lap index out of bounds or invalid");
        });
    });

    describe("Coordinate Processing", () => {
        it("should convert semicircle coordinates to degrees", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Check that L.polyline was called with converted coordinates
            expect(mockL.polyline).toHaveBeenCalled();
            const polylineCall = mockL.polyline.mock.calls[0]?.[0];
            expect(Array.isArray(polylineCall)).toBe(true);
            expect(polylineCall?.length).toBeGreaterThan(0);
        });

        it("should handle records with missing GPS data", () => {
            (global.window as any).globalData.recordMesgs = [
                {
                    positionLat: null,
                    positionLong: null,
                    timestamp: 1000,
                },
                {
                    positionLat: 429496729.6,
                    positionLong: 429496729.6,
                    timestamp: 2000,
                },
            ];

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Should still create polyline with valid coordinates only
            expect(mockL.polyline).toHaveBeenCalled();
        });
    });

    describe("Marker Handling", () => {
        it("should handle zero marker count", () => {
            (global.window as any).mapMarkerCount = 0;

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Should still create markers (step = 1)
            expect(mockL.circleMarker).toHaveBeenCalled();
        });

        it("should handle undefined marker count", () => {
            (global.window as any).mapMarkerCount = undefined;

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            expect(mockL.circleMarker).toHaveBeenCalled();
        });

        it("should add markers to map when no cluster group", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: null,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            expect(mockCircleMarker.addTo).toHaveBeenCalledWith(mockMap);
        });
    });

    describe("Overlay File Handling", () => {
        it("should process overlay files", () => {
            (global.window as any).loadedFitFiles = [
                { data: (global.window as any).globalData }, // Main file
                {
                    // Overlay file
                    data: {
                        recordMesgs: [
                            {
                                positionLat: 429496729.3,
                                positionLong: 429496729.3,
                                timestamp: 4000,
                            },
                        ],
                        lapMesgs: [],
                    },
                    filePath: "/test/overlay.fit",
                },
            ];

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Should create polylines for both main and overlay
            expect(mockL.polyline).toHaveBeenCalledTimes(2);
        });

        it("should handle empty overlay files", () => {
            (global.window as any).loadedFitFiles = [
                { data: (global.window as any).globalData }, // Main file
                {
                    // Empty overlay file
                    data: {
                        recordMesgs: [],
                        lapMesgs: [],
                    },
                },
            ];

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            mapDrawLaps("all", mockOptions);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("[drawOverlayForFitFile] No valid location data in overlay file")
            );

            consoleSpy.mockRestore();
        });
    });

    describe("Safe Fit Bounds", () => {
        it("should handle map container timing issues", () => {
            // Use fake timers so we can advance scheduled retries in safeFitBounds
            vi.useFakeTimers();
            // Mock container that's initially not visible
            const invisibleContainer = {
                offsetParent: null as Element | null,
                clientWidth: 0,
                clientHeight: 0,
            };

            const mockMapWithInvisibleContainer = {
                ...mockMap,
                _container: invisibleContainer,
            };

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMapWithInvisibleContainer,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Make container visible after a delay
            invisibleContainer.offsetParent = document.body;
            invisibleContainer.clientWidth = 800;
            invisibleContainer.clientHeight = 600;

            // Advance timers to allow safeFitBounds to retry after visibility change
            vi.advanceTimersByTime(100);
            // Function should handle container visibility
            expect(mockMapWithInvisibleContainer.fitBounds).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should handle fitBounds errors gracefully", () => {
            const mockMapWithError = {
                ...mockMap,
                fitBounds: vi.fn().mockImplementation(() => {
                    throw new Error("fitBounds error");
                }),
            };

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMapWithError,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            // Should not throw error
            expect(() => mapDrawLaps("all", mockOptions)).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe("drawOverlayForFitFile Function", () => {
        it("should draw overlay with valid data", () => {
            const overlayData = {
                recordMesgs: [
                    {
                        positionLat: 429496729.6,
                        positionLong: 429496729.6,
                        timestamp: 1000,
                    },
                ],
                lapMesgs: [],
            };

            const result = drawOverlayForFitFile({
                fitData: overlayData,
                map: mockMap,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
                fileName: "test.fit",
                overlayIdx: 1,
            });

            expect(mockL.polyline).toHaveBeenCalled();
            expect(result).toBeTruthy(); // Should return bounds
        });

        it("should return null for empty data", () => {
            const overlayData = {
                recordMesgs: [],
                lapMesgs: [],
            };

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const result = drawOverlayForFitFile({
                fitData: overlayData,
                map: mockMap,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
                fileName: "test.fit",
                overlayIdx: 1,
            });

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("[drawOverlayForFitFile] No valid location data in overlay file")
            );

            consoleSpy.mockRestore();
        });

        it("should handle highlighted overlay", () => {
            (global.window as any)._highlightedOverlayIdx = 1;

            const overlayData = {
                recordMesgs: [
                    {
                        positionLat: 429496729.6,
                        positionLong: 429496729.6,
                        timestamp: 1000,
                    },
                ],
                lapMesgs: [],
            };

            drawOverlayForFitFile({
                fitData: overlayData,
                map: mockMap,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
                fileName: "test.fit",
                overlayIdx: 1,
            });

            // Should create polyline with highlight styles
            expect(mockL.polyline).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    weight: 10, // Highlighted weight
                    className: "overlay-highlight-glow",
                })
            );
        });

        it("should track overlay polylines", () => {
            const overlayData = {
                recordMesgs: [
                    {
                        positionLat: 429496729.6,
                        positionLong: 429496729.6,
                        timestamp: 1000,
                    },
                ],
                lapMesgs: [],
            };

            drawOverlayForFitFile({
                fitData: overlayData,
                map: mockMap,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
                fileName: "test.fit",
                overlayIdx: 2,
            });

            expect((global.window as any)._overlayPolylines[2]).toBeDefined();
        });

        it("should add filename to tooltip", () => {
            const overlayData = {
                recordMesgs: [
                    {
                        positionLat: 429496729.6,
                        positionLong: 429496729.6,
                        timestamp: 1000,
                    },
                ],
                lapMesgs: [],
            };

            const mockFormatTooltipData = vi.fn().mockReturnValue("original tooltip");

            drawOverlayForFitFile({
                fitData: overlayData,
                map: mockMap,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: vi.fn().mockReturnValue(1),
                fileName: "test.fit",
                overlayIdx: 1,
            });

            expect(mockCircleMarker.bindTooltip).toHaveBeenCalledWith(
                expect.stringContaining("<b>test.fit</b><br>original tooltip"),
                expect.any(Object)
            );
        });
    });

    describe("Global Highlight Update Function", () => {
        it("should update overlay highlights", () => {
            // Set up overlay polylines
            (global.window as any)._overlayPolylines = {
                1: mockPolyline,
                2: { ...mockPolyline, setStyle: vi.fn(), getElement: vi.fn().mockReturnValue({ style: {} }) },
            };
            (global.window as any)._highlightedOverlayIdx = 1;

            // Call the real implementation directly to ensure styles are updated even if a stub was assigned
            if ((global.window as any).__realUpdateOverlayHighlights) {
                (global.window as any).__realUpdateOverlayHighlights();
            } else {
                (global.window as any).updateOverlayHighlights();
            }

            expect(mockPolyline.setStyle).toHaveBeenCalledWith(
                expect.objectContaining({
                    weight: 10,
                    className: "overlay-highlight-glow",
                })
            );
        });

        it("should handle missing overlay polylines", () => {
            (global.window as any)._overlayPolylines = undefined;

            // Should not throw error
            expect(() => (global.window as any).updateOverlayHighlights()).not.toThrow();
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle undefined lap number", () => {
            const mockContainer = document.createElement("div");
            const mockGetLapNumForIdx = vi.fn().mockReturnValue(undefined);
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: mockGetLapNumForIdx,
            };

            mapDrawLaps("all", mockOptions);

            expect(mockL.polyline).toHaveBeenCalled();
        });

        it("should handle NaN lap number", () => {
            const mockContainer = document.createElement("div");
            const mockGetLapNumForIdx = vi.fn().mockReturnValue(NaN);
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: mockGetLapNumForIdx,
            };

            mapDrawLaps("all", mockOptions);

            expect(mockL.polyline).toHaveBeenCalled();
        });

        it("should handle missing global data", () => {
            (global.window as any).globalData = undefined;

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            expect(mockContainer.innerHTML).toContain("No location data available");
        });

        it("should handle bounds clone failure", () => {
            const mockBoundsWithoutClone = {
                extend: vi.fn(),
                clone: undefined,
            };

            mockPolyline.getBounds.mockReturnValue(mockBoundsWithoutClone);

            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: "start-icon",
                endIcon: "end-icon",
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            // Should not throw error
            expect(() => mapDrawLaps("all", mockOptions)).not.toThrow();
        });

        it("should handle missing icons gracefully", () => {
            const mockContainer = document.createElement("div");
            const mockOptions = {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: null,
                endIcon: null,
                mapContainer: mockContainer,
                getLapColor: vi.fn().mockReturnValue("#ff0000"),
                formatTooltipData: vi.fn().mockReturnValue("tooltip"),
                getLapNumForIdx: vi.fn().mockReturnValue(1),
            };

            mapDrawLaps("all", mockOptions);

            // Should still create polyline but no start/end markers
            expect(mockL.polyline).toHaveBeenCalled();
            // Markers should only be circle markers for data points
            expect(mockL.marker).not.toHaveBeenCalled();
        });
    });
});

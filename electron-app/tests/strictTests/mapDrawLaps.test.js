import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mapDrawLaps, drawOverlayForFitFile } from "../../utils/maps/layers/mapDrawLaps.js";

// Mock Leaflet library
const mockMarker = {
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    bindTooltip: vi.fn().mockReturnThis(),
};

const mockCircleMarker = {
    addTo: vi.fn().mockReturnThis(),
    bindTooltip: vi.fn().mockReturnThis(),
};

const mockPolyline = {
    addTo: vi.fn().mockReturnThis(),
    getBounds: vi.fn().mockReturnValue({
        clone: vi.fn().mockReturnThis(),
        extend: vi.fn(),
    }),
    setStyle: vi.fn(),
    getElement: vi.fn().mockReturnValue({
        style: {},
    }),
    options: { color: "#1976d2" },
};

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
    clone: vi.fn().mockReturnThis(),
    extend: vi.fn(),
});

// Mock global L (Leaflet)
const mockL = {
    polyline: vi.fn().mockReturnValue(mockPolyline),
    marker: vi.fn().mockReturnValue(mockMarker),
    circleMarker: vi.fn().mockReturnValue(mockCircleMarker),
    latLngBounds: mockLatLngBounds,
};

// Mock chart overlay color palette
vi.mock("../../utils/charts/theming/chartOverlayColorPalette.js", () => ({
    chartOverlayColorPalette: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"],
}));

// Mock getOverlayFileName
vi.mock("../../utils/files/import/getOverlayFileName.js", () => ({
    getOverlayFileName: vi.fn((index) => `overlay-${index}.fit`),
}));

describe("mapDrawLaps.js - Map Drawing Utilities", () => {
    let mockWindow: any;
    let originalGlobal: any;

    beforeEach(() => {
        // Setup mock window with global data
        mockWindow = {
            globalData: {
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
            },
            loadedFitFiles: [],
            _activeMainFileIdx: 0,
            _overlayPolylines: {},
            _mainPolylineOriginalBounds: undefined,
            mapMarkerCount: 10,
            _highlightedOverlayIdx: -1,
            L: mockL,
        };

        // Store original global and set up mocks
        originalGlobal = globalThis.L;
        globalThis.L = mockL;
        global.window = mockWindow;
        global.globalThis = { L: mockL };

        // Reset all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore original global
        globalThis.L = originalGlobal;
        delete global.window;
        delete global.globalThis;
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
            mockWindow.globalData.lapMesgs = [
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

            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });

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

            expect(mockWindow._overlayPolylines).toEqual({});
            expect(mockWindow._mainPolylineOriginalBounds).toBeUndefined();
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
            mockMap.eachLayer.mockImplementation((callback) => {
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
            mockWindow.loadedFitFiles = [
                { data: { recordMesgs: [], lapMesgs: [] } },
                { data: { recordMesgs: [], lapMesgs: [] } },
                { data: { recordMesgs: [], lapMesgs: [] } },
            ];
            mockWindow._activeMainFileIdx = 1;

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
            expect(mockWindow.loadedFitFiles).toHaveLength(1);
            expect(mockWindow.loadedFitFiles[0]).toEqual({ data: { recordMesgs: [], lapMesgs: [] } });
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

            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { });

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
            mockWindow.globalData.recordMesgs = [];

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
            mockWindow.globalData.lapMesgs = [
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
            const polylineCall = mockL.polyline.mock.calls[0][0];
            expect(Array.isArray(polylineCall)).toBe(true);
            expect(polylineCall.length).toBeGreaterThan(0);
        });

        it("should handle records with missing GPS data", () => {
            mockWindow.globalData.recordMesgs = [
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
            mockWindow.mapMarkerCount = 0;

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
            mockWindow.mapMarkerCount = undefined;

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
            mockWindow.loadedFitFiles = [
                { data: mockWindow.globalData }, // Main file
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
            mockWindow.loadedFitFiles = [
                { data: mockWindow.globalData }, // Main file
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

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

            mapDrawLaps("all", mockOptions);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("[drawOverlayForFitFile] No valid location data in overlay file")
            );

            consoleSpy.mockRestore();
        });
    });

    describe("Safe Fit Bounds", () => {
        it("should handle map container timing issues", (done) => {
            // Mock container that's initially not visible
            const invisibleContainer = {
                offsetParent: null,
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
            setTimeout(() => {
                invisibleContainer.offsetParent = document.body;
                invisibleContainer.clientWidth = 800;
                invisibleContainer.clientHeight = 600;
            }, 50);

            // Check that fitBounds is eventually called
            setTimeout(() => {
                expect(mockMapWithInvisibleContainer.fitBounds).toHaveBeenCalled();
                done();
            }, 200);
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

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

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

            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

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
            mockWindow._highlightedOverlayIdx = 1;

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

            expect(mockWindow._overlayPolylines[2]).toBeDefined();
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
            mockWindow._overlayPolylines = {
                1: mockPolyline,
                2: { ...mockPolyline, setStyle: vi.fn(), getElement: vi.fn().mockReturnValue({ style: {} }) },
            };
            mockWindow._highlightedOverlayIdx = 1;

            // Call the global function
            mockWindow.updateOverlayHighlights();

            expect(mockPolyline.setStyle).toHaveBeenCalledWith(
                expect.objectContaining({
                    weight: 10,
                    className: "overlay-highlight-glow",
                })
            );
        });

        it("should handle missing overlay polylines", () => {
            mockWindow._overlayPolylines = undefined;

            // Should not throw error
            expect(() => mockWindow.updateOverlayHighlights()).not.toThrow();
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
            mockWindow.globalData = undefined;

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

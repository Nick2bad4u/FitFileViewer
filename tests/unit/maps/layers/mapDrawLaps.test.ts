// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

type MockFunction = (...args: any[]) => any;

function mockFn<T extends MockFunction = MockFunction>(
    implementation?: T
): ReturnType<typeof vi.fn<T>> {
    return implementation ? vi.fn<T>(implementation) : vi.fn<T>();
}

// Mock dependencies
vi.mock(
    import("../../../../electron-app/utils/charts/theming/chartOverlayColorPalette.js"),
    () => ({
        chartOverlayColorPalette: [
            "#ff0000",
            "#00ff00",
            "#0000ff",
        ],
    })
);

vi.mock(
    import("../../../../electron-app/utils/files/import/getOverlayFileName.js"),
    () => ({
        getOverlayFileName: mockFn((filePath: string | undefined) => {
            if (typeof filePath === "string" && filePath) {
                return filePath.split("/").pop();
            }
            return "test.fit";
        }),
    })
);

// Import the module under test
const mapDrawLapsModule =
    await import("../../../../electron-app/utils/maps/layers/mapDrawLaps.js");
const { drawOverlayForFitFile, mapDrawLaps } = mapDrawLapsModule;

declare global {
    interface Window {
        L?: any;
    }
    var _overlayPolylines: any;
    var _mainPolylineOriginalBounds: any;
    var loadedFitFiles: any[];
    var _activeMainFileIdx: number;
    var mapMarkerCount: number;
    var _highlightedOverlayIdx: number;
    var updateOverlayHighlights: any;
}

describe("mapDrawLaps", () => {
    let mockLeaflet: any;
    let mockMap: any;
    let mockPolyline: any;
    let mockMarker: any;
    let mockCircleMarker: any;
    let mockLatLngBounds: any;
    let mockMarkerClusterGroup: any;
    let mockGetLapColor: any;
    let mockFormatTooltipData: any;
    let mockGetLapNumForIdx: any;

    beforeEach(() => {
        // Reset global state
        (globalThis as any).window = globalThis;

        // Mock console methods
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Create mock Leaflet objects
        mockPolyline = {
            addTo: mockFn().mockReturnThis(),
            setStyle: mockFn(),
            getBounds: mockFn().mockReturnValue(mockLatLngBounds),
            getElement: mockFn().mockReturnValue({
                style: {},
            }),
            options: { color: "#1976d2" },
        };

        mockMarker = {
            addTo: mockFn().mockReturnThis(),
            bindTooltip: mockFn().mockReturnThis(),
            bindPopup: mockFn().mockReturnThis(),
        };

        mockCircleMarker = {
            addTo: mockFn().mockReturnThis(),
            bindTooltip: mockFn().mockReturnThis(),
            setStyle: mockFn(),
        };

        mockLatLngBounds = {
            extend: mockFn(),
            clone: mockFn().mockReturnThis(),
            isValid: mockFn().mockReturnValue(true),
        };
        mockPolyline.getBounds.mockReturnValue(mockLatLngBounds);

        mockMarkerClusterGroup = {
            addLayer: mockFn(),
            clearLayers: mockFn(),
        };

        mockMap = {
            addLayer: mockFn(),
            removeLayer: mockFn(),
            eachLayer: mockFn(),
            fitBounds: mockFn(),
            getZoom: mockFn().mockReturnValue(10),
            setView: mockFn(),
            getBounds: mockFn().mockReturnValue(mockLatLngBounds),
            invalidateSize: mockFn(),
            _container: null,
        };

        mockLeaflet = {
            featureGroup: mockFn(() => ({
                addTo: mockFn().mockReturnThis(),
                clearLayers: mockFn(),
            })),
            polyline: mockFn().mockReturnValue(mockPolyline),
            marker: mockFn().mockReturnValue(mockMarker),
            circleMarker: mockFn().mockReturnValue(mockCircleMarker),
            latLngBounds: mockFn().mockReturnValue(mockLatLngBounds),
        };

        // Set up Leaflet global
        (globalThis as any).L = mockLeaflet;
        (globalThis as any).window = globalThis;
        (globalThis as any).window.L = mockLeaflet;

        // Create mock functions
        mockGetLapColor = mockFn().mockReturnValue("#1976d2");
        mockFormatTooltipData = mockFn().mockReturnValue("Test tooltip");
        mockGetLapNumForIdx = mockFn().mockReturnValue(1);

        // Initialize global state
        (globalThis as any)._overlayPolylines = {};
        (globalThis as any)._mainPolylineOriginalBounds = undefined;
        (globalThis as any)._ffvActivityLayerGroup = undefined;
        (globalThis as any).loadedFitFiles = [];
        (globalThis as any)._activeMainFileIdx = 0;
        (globalThis as any).mapMarkerCount = 10;
        (globalThis as any)._highlightedOverlayIdx = -1;
        (globalThis as any).updateOverlayHighlights = mockFn();
    });

    const getPolylineCall = (
        index = 0
    ): [unknown[], Record<string, unknown>] => {
        const call = mockLeaflet.polyline.mock.calls[index];
        if (!call) {
            throw new Error(`Expected polyline call ${index}`);
        }

        return call as [unknown[], Record<string, unknown>];
    };

    const getMarkerCall = (index = 0): [unknown[], Record<string, unknown>] => {
        const call = mockLeaflet.marker.mock.calls[index];
        if (!call) {
            throw new Error(`Expected marker call ${index}`);
        }

        return call as [unknown[], Record<string, unknown>];
    };

    const getCircleMarkerCall = (
        index = 0
    ): [unknown[], Record<string, unknown>] => {
        const call = mockLeaflet.circleMarker.mock.calls[index];
        if (!call) {
            throw new Error(`Expected circle marker call ${index}`);
        }

        return call as [unknown[], Record<string, unknown>];
    };

    describe("drawOverlayForFitFile", () => {
        it("should draw polyline for valid GPS data", () => {
            expect.hasAssertions();

            const mockFitData = {
                recordMesgs: [
                    { positionLat: 473000000, positionLong: -833000000 },
                    { positionLat: 474000000, positionLong: -834000000 },
                    { positionLat: 475000000, positionLong: -835000000 },
                ],
                lapMesgs: [],
            };

            const result = drawOverlayForFitFile({
                map: mockMap,
                fitData: mockFitData,
                overlayIdx: 0,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(3);
            expect(polylineOptions).toMatchObject({ color: "#ff0000" });
            expect(mockPolyline.addTo).toHaveBeenCalledWith(mockMap);
            expect(result).toBe(mockLatLngBounds); // Returns bounds, not polyline
        });

        it("should handle fitData with no GPS data", () => {
            expect.hasAssertions();

            const mockFitData = {
                recordMesgs: [
                    { timestamp: 1640995200 },
                    { timestamp: 1640995260 },
                ],
                lapMesgs: [],
            };

            const result = drawOverlayForFitFile({
                map: mockMap,
                fitData: mockFitData,
                overlayIdx: 0,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect(mockLeaflet.polyline).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it("should handle null/undefined fitData", () => {
            expect.hasAssertions();

            const result1 = drawOverlayForFitFile({
                map: mockMap,
                fitData: { recordMesgs: [], lapMesgs: [] },
                overlayIdx: 0,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect(result1).toBeNull();
            expect(mockLeaflet.polyline).not.toHaveBeenCalled();
        });

        it("should use correct color based on overlayIdx", () => {
            expect.hasAssertions();

            const mockFitData = {
                recordMesgs: [
                    { positionLat: 473000000, positionLong: -833000000 },
                    { positionLat: 474000000, positionLong: -834000000 },
                ],
                lapMesgs: [],
            };

            const result = drawOverlayForFitFile({
                map: mockMap,
                fitData: mockFitData,
                overlayIdx: 2,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect(result).toBe(mockLatLngBounds);
            expect((globalThis as any).window._overlayPolylines).toStrictEqual({
                "2": mockPolyline,
            });
            expect(
                (globalThis as any).window._overlayPolylines
            ).not.toHaveProperty("0");
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(2);
            expect(polylineOptions).toMatchObject({
                color: "#0000ff",
                weight: 4,
            });
        });

        it("should handle fitData with mixed GPS and non-GPS records", () => {
            expect.hasAssertions();

            const mockFitData = {
                recordMesgs: [
                    { timestamp: 1640995200 },
                    { positionLat: 473000000, positionLong: -833000000 },
                    { timestamp: 1640995260 },
                    { positionLat: 474000000, positionLong: -834000000 },
                ],
                lapMesgs: [],
            };

            const result = drawOverlayForFitFile({
                map: mockMap,
                fitData: mockFitData,
                overlayIdx: 0,
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(2);
            expect(polylineOptions).toMatchObject({ color: "#ff0000" });
            expect(result).toBe(mockLatLngBounds); // Returns bounds, not polyline
        });
    });

    describe("mapDrawLaps", () => {
        it("should not clear overlay state (overlays/tool layers persist)", () => {
            expect.hasAssertions();

            (globalThis as any)._overlayPolylines = { existing: "data" };
            (globalThis as any)._mainPolylineOriginalBounds = {
                existing: "bounds",
            };
            (globalThis as any).window._mainPolylineOriginalBounds = {
                existing: "bounds",
            };

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer: document.createElement("div"),
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                mainPolylineBounds: (globalThis as any).window
                    ._mainPolylineOriginalBounds,
                overlayPolylines: (globalThis as any)._overlayPolylines,
            }).toStrictEqual({
                mainPolylineBounds: undefined,
                overlayPolylines: {
                    existing: "data",
                },
            });
        });

        it("should not remove non-activity layers from map", () => {
            expect.hasAssertions();

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            // We no longer bulk-remove layers via map.eachLayer/removeLayer.
            expect(mockMap.removeLayer).not.toHaveBeenCalled();
            expect(mapContainer.textContent).toContain(
                "No location data available to display map."
            );
        });

        it("should handle missing fitFile gracefully", () => {
            expect.hasAssertions();

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect(mockLeaflet.polyline).not.toHaveBeenCalled();
            expect(mapContainer.textContent).toContain("recordMesgs: 0");
            expect(mapContainer.textContent).toContain("lapMesgs: 0");
        });

        it("should use active file from loadedFitFiles when idx differs", () => {
            expect.hasAssertions();

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                mapMessage: mapContainer.textContent,
                overlayPolylineKeys: Object.keys(
                    (globalThis as any)._overlayPolylines
                ),
                polylineCalls: mockLeaflet.polyline.mock.calls.length,
            }).toStrictEqual({
                mapMessage:
                    "No location data available to display map.Lap: 0recordMesgs: 0lapMesgs: 0",
                overlayPolylineKeys: [],
                polylineCalls: 0,
            });
        });

        it("should store overlay polyline when created", () => {
            expect.hasAssertions();

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                mapMessage: mapContainer.textContent,
                overlayPolylineKeys: Object.keys(
                    (globalThis as any)._overlayPolylines
                ),
                polylineCalls: mockLeaflet.polyline.mock.calls.length,
            }).toStrictEqual({
                mapMessage:
                    "No location data available to display map.Lap: 0recordMesgs: 0lapMesgs: 0",
                overlayPolylineKeys: [],
                polylineCalls: 0,
            });
        });

        it("should update overlay highlights when function exists", () => {
            expect.hasAssertions();

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                highlightedOverlayIndex: (globalThis as any)
                    ._highlightedOverlayIdx,
                overlayHighlightType: typeof (globalThis as any)
                    .updateOverlayHighlights,
                overlayPolylineKeys: Object.keys(
                    (globalThis as any)._overlayPolylines
                ),
            }).toStrictEqual({
                highlightedOverlayIndex: -1,
                overlayHighlightType: "function",
                overlayPolylineKeys: [],
            });
        });

        it('should handle lapIdx="all" with valid GPS data', () => {
            expect.hasAssertions();

            // Setup comprehensive mock data for "all" laps scenario
            const mockRecordMesgs = [
                {
                    positionLat: 429496729, // ~20 degrees when converted
                    positionLong: 858993459, // ~40 degrees when converted
                    timestamp: 1000,
                    altitude: 100,
                    heartRate: 150,
                    speed: 5.5,
                },
                {
                    positionLat: 429496730, // ~20.000001 degrees
                    positionLong: 858993460, // ~40.000001 degrees
                    timestamp: 2000,
                    altitude: 101,
                    heartRate: 151,
                    speed: 5.6,
                },
                {
                    positionLat: 429496731, // ~20.000002 degrees
                    positionLong: 858993461, // ~40.000002 degrees
                    timestamp: 3000,
                    altitude: 102,
                    heartRate: 152,
                    speed: 5.7,
                },
            ];

            const mockLapMesgs = [
                {
                    startPositionLat: 429496729,
                    startPositionLong: 858993459,
                    endPositionLat: 429496730,
                    endPositionLong: 858993460,
                },
                {
                    startPositionLat: 429496730,
                    startPositionLong: 858993460,
                    endPositionLat: 429496731,
                    endPositionLong: 858993461,
                },
            ];

            // Setup global data
            (globalThis as any).globalData = {
                recordMesgs: mockRecordMesgs,
                lapMesgs: mockLapMesgs,
            };
            (globalThis as any).mapMarkerCount = 10;

            // Setup map container
            const mapContainer = document.createElement("div");
            document.body.appendChild(mapContainer);
            mapContainer.style.width = "800px";
            mapContainer.style.height = "600px";

            // Setup enhanced mocks
            mockMap._container = mapContainer;
            mockPolyline.getBounds.mockReturnValue(mockLatLngBounds);
            mockLatLngBounds.clone.mockReturnValue(mockLatLngBounds);

            mapDrawLaps("all", {
                map: mockMap,
                baseLayers: { base: mockMap },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            // Verify polyline creation
            const [polylineCoordinates, polylineOptions] = getPolylineCall();
            expect(polylineCoordinates).toHaveLength(3);
            expect(polylineOptions).toMatchObject({ color: "#1976d2" });
            const activityGroup =
                mockLeaflet.featureGroup.mock.results[0]?.value;
            expect(activityGroup).toBe(
                (globalThis as any).window._ffvActivityLayerGroup
            );
            expect(mockPolyline.addTo).toHaveBeenCalledWith(activityGroup);

            // Verify bounds handling
            expect(mockPolyline.getBounds).toHaveBeenCalledWith();
            expect(mockMap.fitBounds).toHaveBeenCalledWith(mockLatLngBounds, {
                padding: [20, 20],
            });
            expect(mockMap.invalidateSize).toHaveBeenCalledWith();

            // Verify marker creation (start/end markers)
            const [markerCoordinates, markerOptions] = getMarkerCall();
            expect(markerCoordinates).toHaveLength(2);
            expect(markerOptions).toMatchObject({ title: "Start" });

            // Verify circle markers for data points
            const [circleCoordinates, circleOptions] = getCircleMarkerCall();
            expect(circleCoordinates).toHaveLength(2);
            expect(circleOptions).toMatchObject({
                color: "#1976d2",
                fillColor: "#fff",
            });

            // Cleanup
            document.body.removeChild(mapContainer);
        });

        it("should handle lapIdx=0 for single lap selection", () => {
            expect.hasAssertions();

            // Setup mock data for single lap testing
            const mockRecordMesgs = [
                {
                    positionLat: 429496729,
                    positionLong: 858993459,
                    timestamp: 1000,
                    altitude: 100,
                    heartRate: 150,
                    speed: 5.5,
                },
                {
                    positionLat: 429496730,
                    positionLong: 858993460,
                    timestamp: 2000,
                    altitude: 101,
                    heartRate: 151,
                    speed: 5.6,
                },
                {
                    positionLat: 429496731,
                    positionLong: 858993461,
                    timestamp: 3000,
                    altitude: 102,
                    heartRate: 152,
                    speed: 5.7,
                },
            ];

            const mockLapMesgs = [
                {
                    startPositionLat: 429496729,
                    startPositionLong: 858993459,
                    endPositionLat: 429496731,
                    endPositionLong: 858993461,
                },
            ];

            (globalThis as any).globalData = {
                recordMesgs: mockRecordMesgs,
                lapMesgs: mockLapMesgs,
            };
            (globalThis as any).mapMarkerCount = 5;

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: { base: mockMap },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            // Verify single lap polyline creation
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(3);
            expect(polylineOptions).toMatchObject({ color: "#1976d2" });
            {
                const activityGroup =
                    mockLeaflet.featureGroup.mock.results[0]?.value;
                expect(activityGroup).toBe(
                    (globalThis as any).window._ffvActivityLayerGroup
                );
                expect(mockPolyline.addTo).toHaveBeenCalledWith(activityGroup);
            }
        });

        it("should handle lapIdx=[0,1] for multi-lap selection", () => {
            expect.hasAssertions();

            // Setup mock data for multi-lap testing
            const mockRecordMesgs = [
                {
                    positionLat: 429496729,
                    positionLong: 858993459,
                    timestamp: 1000,
                    altitude: 100,
                    heartRate: 150,
                    speed: 5.5,
                },
                {
                    positionLat: 429496730,
                    positionLong: 858993460,
                    timestamp: 2000,
                    altitude: 101,
                    heartRate: 151,
                    speed: 5.6,
                },
                {
                    positionLat: 429496731,
                    positionLong: 858993461,
                    timestamp: 3000,
                    altitude: 102,
                    heartRate: 152,
                    speed: 5.7,
                },
                {
                    positionLat: 429496732,
                    positionLong: 858993462,
                    timestamp: 4000,
                    altitude: 103,
                    heartRate: 153,
                    speed: 5.8,
                },
            ];

            const mockLapMesgs = [
                {
                    startPositionLat: 429496729,
                    startPositionLong: 858993459,
                    endPositionLat: 429496730,
                    endPositionLong: 858993460,
                },
                {
                    startPositionLat: 429496730,
                    startPositionLong: 858993460,
                    endPositionLat: 429496732,
                    endPositionLong: 858993462,
                },
            ];

            (globalThis as any).globalData = {
                recordMesgs: mockRecordMesgs,
                lapMesgs: mockLapMesgs,
            };

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps([0, 1], {
                map: mockMap,
                baseLayers: { base: mockMap },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            // Verify multiple polylines created (one for each lap)
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(2);
            expect(polylineOptions).toMatchObject({ color: "#1976d2" });
            {
                const activityGroup =
                    mockLeaflet.featureGroup.mock.results[0]?.value;
                expect(activityGroup).toBe(
                    (globalThis as any).window._ffvActivityLayerGroup
                );
                expect(mockPolyline.addTo).toHaveBeenCalledWith(activityGroup);
            }
        });

        it('should handle lapIdx=["all"] same as string "all"', () => {
            expect.hasAssertions();

            const mockRecordMesgs = [
                {
                    positionLat: 429496729,
                    positionLong: 858993459,
                    timestamp: 1000,
                    altitude: 100,
                    heartRate: 150,
                    speed: 5.5,
                },
            ];

            (globalThis as any).globalData = {
                recordMesgs: mockRecordMesgs,
                lapMesgs: [],
            };

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps(["all"], {
                map: mockMap,
                baseLayers: { base: mockMap },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            // Should behave same as "all" - creating a polyline
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(1);
            expect(polylineOptions).toMatchObject({ dashArray: "6, 8" });
            expect((globalThis as any).window._mainPolyline).toBe(mockPolyline);
            expect((globalThis as any).window._mainPolylineOriginalBounds).toBe(
                mockLatLngBounds
            );
            expect(polylineOptions).toMatchObject({
                dashArray: "6, 8",
                weight: 4,
            });
        });

        it("should handle overlay files with multiple loaded files", () => {
            expect.hasAssertions();

            // Setup main file data
            (globalThis as any).globalData = {
                recordMesgs: [
                    {
                        positionLat: 429496729,
                        positionLong: 858993459,
                        timestamp: 1000,
                        altitude: 100,
                        heartRate: 150,
                        speed: 5.5,
                    },
                ],
                lapMesgs: [],
            };

            // Setup overlay files
            (globalThis as any).loadedFitFiles = [
                {
                    data: { recordMesgs: [], lapMesgs: [] },
                },
                {
                    data: {
                        recordMesgs: [
                            {
                                positionLat: 429496730,
                                positionLong: 858993460,
                                timestamp: 2000,
                                altitude: 101,
                                heartRate: 151,
                                speed: 5.6,
                            },
                        ],
                        lapMesgs: [],
                    },
                    filePath: "overlay1.fit",
                },
            ];

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps("all", {
                map: mockMap,
                baseLayers: { base: mockMap },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            // Verify overlay processing
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(1);
            expect(polylineOptions).toMatchObject({ color: "#1976d2" });
            expect(mockLeaflet.polyline).toHaveBeenCalledTimes(2);
            expect((globalThis as any).window._overlayPolylines).toStrictEqual({
                "1": mockPolyline,
            });
            expect(mockMap.fitBounds).toHaveBeenCalledWith(mockLatLngBounds, {
                padding: [20, 20],
            });
        });

        it("should handle invalid lap index gracefully", () => {
            expect.hasAssertions();

            (globalThis as any).globalData = {
                recordMesgs: [
                    {
                        positionLat: 429496729,
                        positionLong: 858993459,
                        timestamp: 1000,
                        altitude: 100,
                        heartRate: 150,
                        speed: 5.5,
                    },
                ],
                lapMesgs: [],
            };

            const mapContainer = document.createElement("div");

            mapDrawLaps(999, {
                // Invalid lap index
                map: mockMap,
                baseLayers: { base: mockMap },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            // Should fall back to default behavior
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(1);
            expect(polylineOptions).toMatchObject({ color: "#1976d2" });
            expect((globalThis as any).window._mainPolyline).toBe(mockPolyline);
            expect(mapContainer.textContent).not.toContain(
                "Lap index out of bounds or invalid."
            );
        });

        it("should handle missing position data in records", () => {
            expect.hasAssertions();

            (globalThis as any).globalData = {
                recordMesgs: [
                    {
                        timestamp: 1000,
                        altitude: 100,
                        heartRate: 150,
                        speed: 5.5,
                    }, // Missing position
                    {
                        positionLat: 429496729,
                        positionLong: 858993459,
                        timestamp: 2000,
                        altitude: 101,
                        heartRate: 151,
                        speed: 5.6,
                    },
                ],
                lapMesgs: [],
            };

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps("all", {
                map: mockMap,
                baseLayers: { base: mockMap },
                markerClusterGroup: mockMarkerClusterGroup,
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            // Should filter out invalid records and still create polyline
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(1);
            expect(polylineOptions).toMatchObject({ dashArray: "6, 8" });
            expect(mockLeaflet.polyline).toHaveBeenCalledWith(
                [
                    [
                        Number((429496729 / 2 ** 31) * 180),
                        Number((858993459 / 2 ** 31) * 180),
                    ],
                ],
                expect.objectContaining({
                    color: "#1976d2",
                    weight: 4,
                })
            );
            expect(mapContainer.textContent).toBe("");
        });
    });
});

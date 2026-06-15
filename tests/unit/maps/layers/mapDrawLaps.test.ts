// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearLeafletRuntimeForTests,
    setLeafletRuntime,
} from "../../../../electron-app/utils/maps/core/leafletRuntime.js";
import { setActiveFitRawData } from "../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import {
    __resetStateManagerForTests,
    setState,
} from "../../../../electron-app/utils/state/core/stateManager.js";
import { setLoadedFitFiles } from "../../../../electron-app/utils/state/domain/loadedFitFilesState.js";
import {
    resetMapMarkerCount,
    setMapMarkerCount,
} from "../../../../electron-app/utils/maps/state/mapMarkerCountState.js";
import {
    getRegisteredMapActivityLayerGroup,
    getRegisteredMapDataPointMarkers,
    resetMapActivityLayerStateForTests,
} from "../../../../electron-app/utils/maps/state/mapActivityLayerState.js";
import { resetActiveMainMapFileIndexForTests } from "../../../../electron-app/utils/maps/state/mapActiveMainFileState.js";
import { resetMapDataPointFilterStateForTests } from "../../../../electron-app/utils/maps/state/mapDataPointFilterState.js";
import {
    getMainMapPolyline,
    getMainMapPolylineOriginalBounds,
    getOverlayMapPolylines,
    registerOverlayMapPolyline,
    resetMapPolylineRegistryForTests,
    setMainMapPolylineOriginalBounds,
} from "../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js";

type MockFunction = (...args: any[]) => any;
type MapDrawLapsTestGlobal = typeof globalThis & {
    window?: Window & typeof globalThis;
};
type WindowDescriptor = PropertyDescriptor | undefined;

function mockFn<T extends MockFunction = MockFunction>(
    implementation?: T
): ReturnType<typeof vi.fn<T>> {
    return implementation ? vi.fn<T>(implementation) : vi.fn<T>();
}

function setActiveFitTestData(data: Record<string, unknown>): void {
    setActiveFitRawData(data, { source: "test" });
    setState("fitFile.rawData", data, { source: "test.fitFileRawData" });
}

function getMapDrawLapsTestGlobal(): MapDrawLapsTestGlobal {
    return globalThis as unknown as MapDrawLapsTestGlobal;
}

function setTestWindowGlobal(): WindowDescriptor {
    const testGlobal = getMapDrawLapsTestGlobal();
    const previousDescriptor = Object.getOwnPropertyDescriptor(
        testGlobal,
        "window"
    );
    Object.defineProperty(testGlobal, "window", {
        configurable: true,
        value: globalThis as Window & typeof globalThis,
        writable: true,
    });
    return previousDescriptor;
}

function restoreTestWindowGlobal(previousDescriptor: WindowDescriptor): void {
    const testGlobal = getMapDrawLapsTestGlobal();
    if (previousDescriptor) {
        Object.defineProperty(testGlobal, "window", previousDescriptor);
        return;
    }

    Reflect.deleteProperty(testGlobal, "window");
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
const {
    drawOverlayForFitFile,
    getHighlightedOverlayIndex,
    mapDrawLaps,
    setHighlightedOverlayIndex,
} = mapDrawLapsModule;

describe("mapDrawLaps", () => {
    let mockLeaflet: any;
    let mockMap: any;
    let mockPolyline: any;
    let mockMarker: any;
    let mockCircleMarker: any;
    let mockLatLngBounds: any;
    let mockGetLapColor: any;
    let mockFormatTooltipData: any;
    let mockGetLapNumForIdx: any;
    let previousWindowDescriptor: WindowDescriptor;

    beforeEach(() => {
        __resetStateManagerForTests();
        previousWindowDescriptor = setTestWindowGlobal();

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

        setLeafletRuntime(mockLeaflet);

        // Create mock functions
        mockGetLapColor = mockFn().mockReturnValue("#1976d2");
        mockFormatTooltipData = mockFn().mockReturnValue("Test tooltip");
        mockGetLapNumForIdx = mockFn().mockReturnValue(1);

        // Initialize global state
        resetMapPolylineRegistryForTests();
        resetMapActivityLayerStateForTests();
        resetActiveMainMapFileIndexForTests();
        resetMapDataPointFilterStateForTests();
        setMapMarkerCount(10);
        setHighlightedOverlayIndex(null);
    });

    afterEach(() => {
        clearLeafletRuntimeForTests();
        resetMapMarkerCount();
        resetMapPolylineRegistryForTests();
        resetMapActivityLayerStateForTests();
        resetActiveMainMapFileIndexForTests();
        resetMapDataPointFilterStateForTests();
        restoreTestWindowGlobal(previousWindowDescriptor);
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

    function pickOptions(
        options: Record<string, unknown>,
        keys: string[]
    ): Record<string, unknown> {
        return Object.fromEntries(keys.map((key) => [key, options[key]]));
    }

    describe("drawOverlayForFitFile", () => {
        it("should draw polyline for valid GPS data", () => {
            expect.assertions(4);

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
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(3);
            expect(pickOptions(polylineOptions, ["color"])).toStrictEqual({
                color: "#ff0000",
            });
            expect(mockPolyline.addTo).toHaveBeenCalledWith(mockMap);
            expect(result).toBe(mockLatLngBounds); // Returns bounds, not polyline
        });

        it("should handle fitData with no GPS data", () => {
            expect.assertions(2);

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
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect(mockLeaflet.polyline).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it("should draw overlays from raw FIT snake-case GPS data", () => {
            expect.assertions(2);

            const mockFitData = {
                recordMesgs: [
                    { position_lat: 536_870_912, position_long: -536_870_912 },
                    {
                        position_lat: 1_073_741_824,
                        position_long: -1_073_741_824,
                    },
                ],
                lapMesgs: [],
            };

            drawOverlayForFitFile({
                map: mockMap,
                fitData: mockFitData,
                overlayIdx: 0,
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "raw.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            const [coordinates] = getPolylineCall();
            expect(coordinates).toStrictEqual([
                [45, -45],
                [90, -90],
            ]);
            expect(mockPolyline.addTo).toHaveBeenCalledWith(mockMap);
        });

        it("should handle null/undefined fitData", () => {
            expect.assertions(2);

            const result1 = drawOverlayForFitFile({
                map: mockMap,
                fitData: { recordMesgs: [], lapMesgs: [] },
                overlayIdx: 0,
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
            expect.assertions(5);

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
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect(result).toBe(mockLatLngBounds);
            expect(getOverlayMapPolylines()).toStrictEqual({
                "2": mockPolyline,
            });
            expect(getOverlayMapPolylines()).not.toHaveProperty("0");
            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(2);
            expect(
                pickOptions(polylineOptions, ["color", "weight"])
            ).toStrictEqual({
                color: "#0000ff",
                weight: 4,
            });
        });

        it("should handle fitData with mixed GPS and non-GPS records", () => {
            expect.assertions(3);

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
                startIcon: mockMarker,
                endIcon: mockMarker,
                fileName: "test.fit",
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            const [coordinates, polylineOptions] = getPolylineCall();
            expect(coordinates).toHaveLength(2);
            expect(pickOptions(polylineOptions, ["color"])).toStrictEqual({
                color: "#ff0000",
            });
            expect(result).toBe(mockLatLngBounds); // Returns bounds, not polyline
        });
    });

    describe("mapDrawLaps", () => {
        it("should not clear overlay state (overlays/tool layers persist)", () => {
            expect.assertions(1);

            registerOverlayMapPolyline("existing", { existing: "data" });
            setMainMapPolylineOriginalBounds({ existing: "bounds" });

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer: document.createElement("div"),
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                mainPolylineBounds: getMainMapPolylineOriginalBounds(),
                overlayPolylines: getOverlayMapPolylines(),
            }).toStrictEqual({
                mainPolylineBounds: null,
                overlayPolylines: {
                    existing: { existing: "data" },
                },
            });
        });

        it("should not remove non-activity layers from map", () => {
            expect.assertions(2);

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
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
            expect.assertions(3);

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
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
            expect.assertions(1);

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                mapMessage: mapContainer.textContent,
                overlayPolylineKeys: Object.keys(getOverlayMapPolylines()),
                polylineCalls: mockLeaflet.polyline.mock.calls.length,
            }).toStrictEqual({
                mapMessage:
                    "No location data available to display map.Lap: 0recordMesgs: 0lapMesgs: 0",
                overlayPolylineKeys: [],
                polylineCalls: 0,
            });
        });

        it("should store overlay polyline when created", () => {
            expect.assertions(1);

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                mapMessage: mapContainer.textContent,
                overlayPolylineKeys: Object.keys(getOverlayMapPolylines()),
                polylineCalls: mockLeaflet.polyline.mock.calls.length,
            }).toStrictEqual({
                mapMessage:
                    "No location data available to display map.Lap: 0recordMesgs: 0lapMesgs: 0",
                overlayPolylineKeys: [],
                polylineCalls: 0,
            });
        });

        it("keeps overlay highlights in typed module state", () => {
            expect.assertions(1);

            const mapContainer = document.createElement("div");

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: {},
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockFn(),
                formatTooltipData: mockFn(),
                getLapNumForIdx: mockFn(),
            });

            expect({
                highlightedOverlayIndex: getHighlightedOverlayIndex(),
                overlayPolylineKeys: Object.keys(getOverlayMapPolylines()),
            }).toStrictEqual({
                highlightedOverlayIndex: null,
                overlayPolylineKeys: [],
            });
        });

        it('should handle lapIdx="all" with valid GPS data', () => {
            expect.assertions(12);

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
            setActiveFitTestData(
                {
                    recordMesgs: mockRecordMesgs,
                    lapMesgs: mockLapMesgs,
                },
                { source: "test" }
            );
            setMapMarkerCount(10);

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
            expect(pickOptions(polylineOptions, ["color"])).toStrictEqual({
                color: "#1976d2",
            });
            const activityGroup =
                mockLeaflet.featureGroup.mock.results[0]?.value;
            expect(activityGroup).toBe(getRegisteredMapActivityLayerGroup());
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
            expect(pickOptions(markerOptions, ["title"])).toStrictEqual({
                title: "Start",
            });

            // Verify circle markers for data points
            const [circleCoordinates, circleOptions] = getCircleMarkerCall();
            expect(circleCoordinates).toHaveLength(2);
            expect(
                pickOptions(circleOptions, ["color", "fillColor"])
            ).toStrictEqual({
                color: "#1976d2",
                fillColor: "#fff",
            });
            expect(getRegisteredMapDataPointMarkers()).toHaveLength(3);

            // Cleanup
            document.body.removeChild(mapContainer);
        });

        it('should handle lapIdx="all" with raw FIT snake-case GPS data', () => {
            expect.assertions(2);

            setActiveFitTestData(
                {
                    recordMesgs: [
                        {
                            position_lat: 536_870_912,
                            position_long: -536_870_912,
                        },
                        {
                            position_lat: 1_073_741_824,
                            position_long: -1_073_741_824,
                        },
                    ],
                    lapMesgs: [],
                },
                { source: "test" }
            );
            setMapMarkerCount(10);

            const mapContainer = document.createElement("div");
            document.body.append(mapContainer);
            mockMap._container = mapContainer;
            mockPolyline.getBounds.mockReturnValue(mockLatLngBounds);
            mockLatLngBounds.clone.mockReturnValue(mockLatLngBounds);

            mapDrawLaps("all", {
                map: mockMap,
                baseLayers: { base: mockMap },
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            const [polylineCoordinates] = getPolylineCall();
            expect(polylineCoordinates).toStrictEqual([
                [45, -45],
                [90, -90],
            ]);
            expect(mockFormatTooltipData).toHaveBeenCalled();
        });

        it("should render a no-location message when every record lacks valid coordinates", () => {
            expect.assertions(5);

            setActiveFitTestData(
                {
                    recordMesgs: [
                        { altitude: 101 },
                        { positionLat: "invalid" },
                    ],
                    lapMesgs: [{ end_index: 1, start_index: 0 }],
                },
                { source: "test" }
            );
            setMapMarkerCount(0);

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps("all", {
                map: mockMap,
                baseLayers: { base: mockMap },
                startIcon: mockMarker,
                endIcon: mockMarker,
                mapContainer,
                getLapColor: mockGetLapColor,
                formatTooltipData: mockFormatTooltipData,
                getLapNumForIdx: mockGetLapNumForIdx,
            });

            expect(mapContainer.textContent).toContain(
                "No location data available to display map."
            );
            expect(mapContainer.textContent).toContain("recordMesgs: 2");
            expect(mapContainer.textContent).toContain("lapMesgs: 1");
            expect(mockLeaflet.polyline).not.toHaveBeenCalled();
            expect(mockMap.fitBounds).not.toHaveBeenCalled();
        });

        it("should handle lapIdx=0 for single lap selection", () => {
            expect.assertions(4);

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

            setActiveFitTestData(
                {
                    recordMesgs: mockRecordMesgs,
                    lapMesgs: mockLapMesgs,
                },
                { source: "test" }
            );
            setMapMarkerCount(10);

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps(0, {
                map: mockMap,
                baseLayers: { base: mockMap },
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
            expect(pickOptions(polylineOptions, ["color"])).toStrictEqual({
                color: "#1976d2",
            });
            {
                const activityGroup =
                    mockLeaflet.featureGroup.mock.results[0]?.value;
                expect(activityGroup).toBe(
                    getRegisteredMapActivityLayerGroup()
                );
                expect(mockPolyline.addTo).toHaveBeenCalledWith(activityGroup);
            }
        });

        it("should handle lapIdx=[0,1] for multi-lap selection", () => {
            expect.assertions(4);

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

            setActiveFitTestData(
                {
                    recordMesgs: mockRecordMesgs,
                    lapMesgs: mockLapMesgs,
                },
                { source: "test" }
            );

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps([0, 1], {
                map: mockMap,
                baseLayers: { base: mockMap },
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
            expect(pickOptions(polylineOptions, ["color"])).toStrictEqual({
                color: "#1976d2",
            });
            {
                const activityGroup =
                    mockLeaflet.featureGroup.mock.results[0]?.value;
                expect(activityGroup).toBe(
                    getRegisteredMapActivityLayerGroup()
                );
                expect(mockPolyline.addTo).toHaveBeenCalledWith(activityGroup);
            }
        });

        it('should handle lapIdx=["all"] same as string "all"', () => {
            expect.assertions(5);

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

            setActiveFitTestData(
                {
                    recordMesgs: mockRecordMesgs,
                    lapMesgs: [],
                },
                { source: "test" }
            );

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps(["all"], {
                map: mockMap,
                baseLayers: { base: mockMap },
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
            expect(pickOptions(polylineOptions, ["dashArray"])).toStrictEqual({
                dashArray: "6, 8",
            });
            expect(getMainMapPolyline()).toBe(mockPolyline);
            expect(getMainMapPolylineOriginalBounds()).toBe(mockLatLngBounds);
            expect(
                pickOptions(polylineOptions, ["dashArray", "weight"])
            ).toStrictEqual({
                dashArray: "6, 8",
                weight: 4,
            });
        });

        it("should handle overlay files with multiple loaded files", () => {
            expect.assertions(5);

            // Setup main file data
            setActiveFitTestData(
                {
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
                },
                { source: "test" }
            );

            // Setup overlay files
            setLoadedFitFiles(
                [
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
                ],
                "mapDrawLaps.test"
            );

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps("all", {
                map: mockMap,
                baseLayers: { base: mockMap },
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
            expect(pickOptions(polylineOptions, ["color"])).toStrictEqual({
                color: "#1976d2",
            });
            expect(mockLeaflet.polyline).toHaveBeenCalledTimes(2);
            expect(getOverlayMapPolylines()).toStrictEqual({
                "1": mockPolyline,
            });
            expect(mockMap.fitBounds).toHaveBeenCalledWith(mockLatLngBounds, {
                padding: [20, 20],
            });
        });

        it("should handle invalid lap index gracefully", () => {
            expect.assertions(4);

            setActiveFitTestData(
                {
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
                },
                { source: "test" }
            );

            const mapContainer = document.createElement("div");

            mapDrawLaps(999, {
                // Invalid lap index
                map: mockMap,
                baseLayers: { base: mockMap },
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
            expect(pickOptions(polylineOptions, ["color"])).toStrictEqual({
                color: "#1976d2",
            });
            expect(getMainMapPolyline()).toBe(mockPolyline);
            expect(mapContainer.textContent).not.toContain(
                "Lap index out of bounds or invalid."
            );
        });

        it("should handle missing position data in records", () => {
            expect.assertions(4);

            setActiveFitTestData(
                {
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
                },
                { source: "test" }
            );

            const mapContainer = document.createElement("div");
            mockMap._container = mapContainer;

            mapDrawLaps("all", {
                map: mockMap,
                baseLayers: { base: mockMap },
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
            expect(pickOptions(polylineOptions, ["dashArray"])).toStrictEqual({
                dashArray: "6, 8",
            });
            expect({
                coordinates,
                options: pickOptions(polylineOptions, ["color", "weight"]),
            }).toStrictEqual({
                coordinates: [
                    [
                        Number((429496729 / 2 ** 31) * 180),
                        Number((858993459 / 2 ** 31) * 180),
                    ],
                ],
                options: {
                    color: "#1976d2",
                    weight: 4,
                },
            });
            expect(mapContainer.textContent).toBe("");
        });
    });
});

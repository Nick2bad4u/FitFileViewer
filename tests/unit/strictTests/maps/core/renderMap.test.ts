import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearLeafletRuntimeForTests,
    isRegisteredLeafletRuntime,
    registerLeafletRuntime,
} from "../../../../../electron-app/utils/maps/core/leafletRuntime.js";
import { createRegisteredLeafletRuntime } from "../../../../fixtures/leafletRuntime.js";
import {
    getRegisteredLeafletMapInstance,
    resetRegisteredLeafletMapInstanceForTests,
    setRegisteredLeafletMapInstance,
} from "../../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js";
import { resetRegisteredMapPluginControlsForTests } from "../../../../../electron-app/utils/maps/state/mapPluginControlState.js";
import { setActiveFitRawData } from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { setLoadedFitFiles } from "../../../../../electron-app/utils/state/domain/loadedFitFilesState.js";
import { getMapBaseLayer } from "../../../../../electron-app/utils/state/domain/mapBaseLayerState.js";
import {
    __resetStateManagerForTests,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

type DomFactory = () => HTMLElement;
type LeafletMapEvent = {
    readonly name?: string;
};
type EventHandler = (event?: LeafletMapEvent) => void;
type MapEventRegistrar = (
    events: string,
    callback: EventHandler
) => LeafletMapStub;

type LeafletMapStub = {
    getMaxZoom: Mock<() => number>;
    getMinZoom: Mock<() => number>;
    getZoom: Mock<() => number>;
    on: Mock<MapEventRegistrar>;
    remove: Mock<() => void>;
    setZoom: Mock<(zoom: number) => void>;
};

type LeafletControlStub = {
    addTo: Mock<() => void>;
};

type LeafletLayerStub = {
    addTo: Mock<() => LeafletLayerStub>;
    on: Mock<() => LeafletLayerStub>;
    options: Record<string, unknown>;
};

type LeafletGlobalStub = {
    Layer: new () => LeafletLayerStub;
    control: {
        layers: Mock<() => LeafletControlStub>;
        scale: Mock<() => LeafletControlStub>;
    };
    maplibreGL: Mock<() => LeafletLayerStub>;
    map: Mock<() => LeafletMapStub>;
    tileLayer: Mock<() => LeafletLayerStub>;
};

type PowerEstimationButtonOptions = {
    getData: () => unknown;
    onAfterApply: () => void;
};

type BaseLayerLeafletStub = {
    maplibreGL: Mock<() => Record<string, never>>;
    tileLayer: Mock<() => Record<string, never>>;
};

function setActiveFitTestData(data: Record<string, unknown>): void {
    setActiveFitRawData(data, { source: "test" });
    setState("fitFile.rawData", data, { source: "test.fitFileRawData" });
}

const {
    mockCreateTables,
    mockInitializeActiveFileNameMapActions,
    mockInvalidateChartRenderCache,
    mockPowerEstimationButtonOptions,
    mockRenderChartJS,
    mockRenderSummary,
} = vi.hoisted(() => ({
    mockCreateTables: vi.fn<(data: Record<string, unknown>) => void>(),
    mockInitializeActiveFileNameMapActions: vi.fn<() => void>(),
    mockInvalidateChartRenderCache: vi.fn<(reason: string) => void>(),
    mockPowerEstimationButtonOptions: {
        current: null as null | PowerEstimationButtonOptions,
    },
    mockRenderChartJS: vi.fn<() => Promise<boolean>>(() =>
        Promise.resolve(true)
    ),
    mockRenderSummary: vi.fn<(data: Record<string, unknown>) => void>(),
}));

function createButton(id: string): HTMLButtonElement {
    const el = document.createElement("button");
    el.id = id;
    return el;
}

function createDiv(className: string): HTMLDivElement {
    const el = document.createElement("div");
    el.className = className;
    return el;
}

async function waitForMockCall(
    mock: Mock<(...args: unknown[]) => unknown>,
    timeoutMs = 1000
): Promise<void> {
    const start = Date.now();
    while (mock.mock.calls.length === 0) {
        if (Date.now() - start > timeoutMs) {
            throw new Error("Timed out waiting for mock call");
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

// Mock heavy dependencies used inside renderMap
vi.mock(
    import("../../../../../electron-app/utils/maps/controls/mapMeasureTool.js"),
    () => ({
        addSimpleMeasureTool: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/maps/controls/mapLapSelector.js"),
    () => ({
        addLapSelector: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/maps/layers/mapDrawLaps.js"),
    () => ({
        drawOverlayForFitFile: vi.fn<() => void>(),
        getHighlightedOverlayIndex: vi.fn<() => null | number>(() => null),
        mapDrawLaps: vi.fn<() => void>(),
        updateOverlayHighlights: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/theming/specific/updateMapTheme.js"),
    () => ({
        installUpdateMapThemeListeners: vi.fn<() => void>(),
        updateMapTheme: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/maps/layers/mapIcons.js"),
    () => ({
        createEndIcon: vi.fn<() => void>(),
        createStartIcon: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js"),
    () => ({
        createMapThemeToggle: vi.fn<DomFactory>(() =>
            createButton("mock-map-theme-toggle")
        ),
        initializeActiveFileNameMapActions:
            mockInitializeActiveFileNameMapActions,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js"),
    async (orig) => {
        // We defer to actual implementation but ensure it sees a stubbed Leaflet adapter with tileLayer/maplibreGL.
        registerLeafletRuntime(
            createRegisteredLeafletRuntime({
                maplibreGL: vi.fn<() => Record<string, never>>(() => ({})),
                tileLayer: vi.fn<() => Record<string, never>>(() => ({})),
            } satisfies BaseLayerLeafletStub)
        );
        return await (orig as any)();
    }
);
vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js"),
    () => ({
        createMarkerCountSelector: vi.fn<
            (callback?: (count: number) => void) => HTMLDivElement
        >(() => {
            // Do not call the callback immediately; it's meant for user interaction later
            return createDiv("mock-marker-count");
        }),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/rendering/components/createShownFilesList.js"),
    () => ({
        createShownFilesList: vi.fn<() => HTMLDivElement>(() =>
            createDiv("mock-shown-files")
        ),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/rendering/components/createTables.js"),
    () => ({
        createTables: mockCreateTables,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/rendering/core/renderSummary.js"),
    () => ({
        renderSummary: mockRenderSummary,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        invalidateChartRenderCache: mockInvalidateChartRenderCache,
        renderChartJS: mockRenderChartJS,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createAddFitFileToMapButton.js"),
    () => ({
        createAddFitFileToMapButton: vi.fn<DomFactory>(() =>
            createButton("mock-add-fit")
        ),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/files/export/createExportGPXButton.js"),
    () => ({
        createExportGPXButton: vi.fn<DomFactory>(() =>
            createButton("mock-export-gpx")
        ),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/files/export/createPrintButton.js"),
    () => ({
        createPrintButton: vi.fn<DomFactory>(() => createButton("mock-print")),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createElevationProfileButton.js"),
    () => ({
        createElevationProfileButton: vi.fn<DomFactory>(() =>
            createButton("mock-elev-profile")
        ),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createPowerEstimationButton.js"),
    () => ({
        createPowerEstimationButton: vi.fn<
            (options: PowerEstimationButtonOptions) => HTMLButtonElement
        >((options) => {
            mockPowerEstimationButtonOptions.current = options;
            return createButton("mock-power");
        }),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/theming/chartOverlayColorPalette.js"),
    () => ({
        chartOverlayColorPalette: {},
    })
);
vi.mock(
    import("../../../../../electron-app/utils/maps/controls/mapFullscreenControl.js"),
    () => ({
        addFullscreenControl: vi.fn<() => void>(),
    })
);

// Helper to import subject under test after environment prepared
const importSUT = async () => {
    return await import("../../../../../electron-app/utils/maps/core/renderMap.js");
};

function makeLeafletStub() {
    class Layer implements LeafletLayerStub {
        addTo = vi.fn<() => LeafletLayerStub>(() => this);
        on = vi.fn<() => LeafletLayerStub>(() => this);
        options: Record<string, unknown> = {};
    }

    // minimal event hub for map.on(...)
    const handlers: Record<string, EventHandler[]> = {};
    const map: LeafletMapStub = {
        getMinZoom: vi.fn<() => number>(() => 0),
        getMaxZoom: vi.fn<() => number>(() => 20),
        getZoom: vi.fn<() => number>(() => 5),
        setZoom: vi.fn<(zoom: number) => void>(),
        on: vi.fn<MapEventRegistrar>((evt: string, cb: EventHandler) => {
            // Leaflet supports space-delimited multiple events
            evt.split(/\s+/).forEach((name) => {
                (handlers[name] ||= []).push(cb);
            });
            return map;
        }),
        remove: vi.fn<() => void>(),
    };
    const control = {
        layers: vi.fn<() => LeafletControlStub>(() => ({
            addTo: vi.fn<() => void>(),
        })),
        scale: vi.fn<() => LeafletControlStub>(() => ({
            addTo: vi.fn<() => void>(),
        })),
    };
    const L: LeafletGlobalStub = {
        Layer,
        control,
        maplibreGL: vi.fn<() => LeafletLayerStub>(() => new Layer()),
        map: vi.fn<() => LeafletMapStub>(() => map),
        tileLayer: vi.fn<() => LeafletLayerStub>(() => new Layer()),
    };
    return { L, map, handlers };
}

describe("renderMap core", () => {
    beforeEach(() => {
        __resetStateManagerForTests();
        vi.restoreAllMocks();
        clearLeafletRuntimeForTests();
        resetRegisteredLeafletMapInstanceForTests();
        resetRegisteredMapPluginControlsForTests();
        document.body.replaceChildren();

        // Ensure a container exists by default
        const container = document.createElement("div");
        container.id = "content-map";
        document.body.appendChild(container);

        setActiveFitTestData({ recordMesgs: [] });
        setLoadedFitFiles([], "test");
        mockCreateTables.mockReset();
        mockInitializeActiveFileNameMapActions.mockReset();
        mockInvalidateChartRenderCache.mockReset();
        mockRenderChartJS.mockReset();
        mockRenderChartJS.mockResolvedValue(true);
        mockRenderSummary.mockReset();
        mockPowerEstimationButtonOptions.current = null;
    });

    it("returns early when no content-map container", async () => {
        expect.assertions(1);

        document.body.replaceChildren();
        const { renderMap } = await importSUT();
        // Should not throw
        renderMap();
        expect(document.getElementById("leaflet-map")).toBeNull();
    });

    it("rejects array-shaped Leaflet runtime candidates", async () => {
        expect.assertions(4);

        const { L } = makeLeafletStub();
        const malformedRuntime = Object.assign([], L);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const { renderMap } = await importSUT();
        renderMap();

        expect(isRegisteredLeafletRuntime(malformedRuntime)).toBe(false);
        expect(L.map).not.toHaveBeenCalled();
        expect(document.getElementById("leaflet-map")).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            "[renderMap] Leaflet library unavailable; skipping map render."
        );
    });

    it("creates map structure and UI controls, sets up zoom slider and layers button", async () => {
        expect.assertions(12);

        const { L, map, handlers } = makeLeafletStub();
        registerLeafletRuntime(createRegisteredLeafletRuntime(L));

        const { renderMap } = await importSUT();
        renderMap();

        expect(mockInitializeActiveFileNameMapActions).toHaveBeenCalledOnce();

        // DOM pieces created
        const mapDiv = document.getElementById("leaflet-map");
        const controlsDiv = document.getElementById("map-controls");
        expect(mapDiv).toBeInstanceOf(HTMLDivElement);
        expect(controlsDiv).toBeInstanceOf(HTMLDivElement);

        // Custom map type button exists and expands layer control on click
        const btn = document.querySelector<HTMLButtonElement>(
            ".custom-maptype-btn"
        );
        expect(btn).toBeInstanceOf(HTMLButtonElement);
        const button = btn as HTMLButtonElement;

        // Fake a layers control DOM to check expansion then collapse behavior
        const layersPanel = document.createElement("div");
        layersPanel.className = "leaflet-control-layers";
        document.body.appendChild(layersPanel);

        button.click();
        expect(
            layersPanel.classList.contains("leaflet-control-layers-expanded")
        ).toBe(true);

        // Clicking outside collapses it
        document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        expect(
            layersPanel.classList.contains("leaflet-control-layers-expanded")
        ).toBe(false);

        // Zoom slider exists and reflects current zoom
        const slider =
            document.querySelector<HTMLInputElement>("#zoom-slider-input");
        const label = document.querySelector<HTMLElement>(
            "#zoom-slider-current"
        );
        expect(slider).toBeInstanceOf(HTMLInputElement);
        expect(label).toBeInstanceOf(HTMLElement);
        const sliderInput = slider as HTMLInputElement;
        expect(Number(slider.value)).toBe(
            Math.round(
                ((map.getZoom() - map.getMinZoom()) /
                    (map.getMaxZoom() - map.getMinZoom())) *
                    100
            )
        );

        // Change slider -> map.setZoom called on change
        sliderInput.value = "50";
        sliderInput.dispatchEvent(new Event("change", { bubbles: true }));
        // 50% of 0..20 -> 10
        expect(map.setZoom).toHaveBeenCalledWith(10);

        // Simulate map zoom event updating slider back
        const zoomEndHandlers = handlers.zoomend;
        expect(zoomEndHandlers).not.toHaveLength(0);
        for (const callback of zoomEndHandlers) {
            callback();
        }
        expect(sliderInput.value).toBe(
            String(
                Math.round(
                    ((map.getZoom() - map.getMinZoom()) /
                        (map.getMaxZoom() - map.getMinZoom())) *
                        100
                )
            )
        );
    });

    it("persists base-layer changes through map base-layer state", async () => {
        expect.assertions(3);

        const { L, handlers } = makeLeafletStub();
        registerLeafletRuntime(createRegisteredLeafletRuntime(L));

        const { renderMap } = await importSUT();
        renderMap();

        expect(document.getElementById("leaflet-map")).toBeInstanceOf(
            HTMLDivElement
        );

        const baseLayerChangeHandlers = handlers.baselayerchange;
        expect(baseLayerChangeHandlers).not.toHaveLength(0);
        for (const callback of baseLayerChangeHandlers) {
            callback({ name: "Satellite (Esri World Imagery)" });
        }

        expect(getMapBaseLayer()).toBe("Esri_WorldImagery");
    });

    it("removes previous map instance and children to avoid stale state", async () => {
        expect.assertions(3);

        const { L, map } = makeLeafletStub();
        registerLeafletRuntime(createRegisteredLeafletRuntime(L));
        const { renderMap } = await importSUT();

        const container = document.getElementById("content-map")!;
        const child = document.createElement("div");
        container.appendChild(child);

        // Seed previous map instance
        const previousMap = { remove: vi.fn<() => void>() };
        setRegisteredLeafletMapInstance(previousMap);

        renderMap();

        // Previous instance removed and container cleared then repopulated
        expect(previousMap.remove).toHaveBeenCalledOnce();
        expect(getRegisteredLeafletMapInstance()).toBe(map);
        expect((container.firstChild as HTMLElement).id).toBe("leaflet-map");
    });

    it("refreshes charts, summary, and tables through typed imports after estimated power changes", async () => {
        expect.assertions(6);

        const { L } = makeLeafletStub();
        registerLeafletRuntime(createRegisteredLeafletRuntime(L));
        const data = {
            recordMesgs: [{ enhancedSpeed: 6, timestamp: 1 }],
            sessionMesgs: [{ sport: "cycling" }],
        };
        setActiveFitTestData(data);

        const { renderMap } = await importSUT();
        renderMap();

        expect(mockPowerEstimationButtonOptions.current).not.toBeNull();
        expect(mockPowerEstimationButtonOptions.current?.getData()).toEqual({
            recordMesgs: data.recordMesgs,
            sessionMesgs: data.sessionMesgs,
        });

        mockPowerEstimationButtonOptions.current?.onAfterApply();

        await waitForMockCall(mockInvalidateChartRenderCache);
        expect(mockInvalidateChartRenderCache).toHaveBeenCalledWith(
            "estimated-power-updated"
        );
        expect(mockRenderChartJS).toHaveBeenCalledWith();
        expect(mockRenderSummary).toHaveBeenCalledWith(data);
        expect(mockCreateTables).toHaveBeenCalledWith(data);
    });
});

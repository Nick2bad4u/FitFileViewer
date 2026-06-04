import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type DomFactory = () => HTMLElement;
type EventHandler = () => void;
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

type LeafletGlobalStub = {
    control: {
        layers: Mock<() => LeafletControlStub>;
        scale: Mock<() => LeafletControlStub>;
    };
    map: Mock<() => LeafletMapStub>;
};

type BaseLayerLeafletStub = {
    maplibreGL: Mock<() => Record<string, never>>;
    tileLayer: Mock<() => Record<string, never>>;
};

type RenderMapWindow = Window & {
    _leafletMapInstance: LeafletMapStub | null;
    _overlayPolylines: Record<string, unknown>;
    globalData: { recordMesgs: unknown[] };
    loadedFitFiles: unknown[];
};

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
        mapDrawLaps: vi.fn<() => void>(),
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
    })
);
vi.mock(
    import("../../../../../electron-app/utils/maps/layers/mapBaseLayers.js"),
    async (orig) => {
        // We defer to actual implementation but ensure it sees a stubbed global L with tileLayer/maplibreGL
        const g = globalThis as typeof globalThis & {
            L?: BaseLayerLeafletStub;
        };
        if (!g.L) {
            g.L = {
                maplibreGL: vi.fn<() => Record<string, never>>(() => ({})),
                tileLayer: vi.fn<() => Record<string, never>>(() => ({})),
            };
        }
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
        map: vi.fn<() => LeafletMapStub>(() => map),
        control,
    };
    return { L, map, handlers };
}

describe("renderMap core", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        document.body.replaceChildren();

        // Ensure a container exists by default
        const container = document.createElement("div");
        container.id = "content-map";
        document.body.appendChild(container);

        // Reset window extensions used by the module
        const w = window as RenderMapWindow;
        w.globalData = { recordMesgs: [] };
        w._overlayPolylines = {};
        w._leafletMapInstance = null;
        w.loadedFitFiles = [];
    });

    it("returns early when no content-map container", async () => {
        expect.assertions(1);

        document.body.replaceChildren();
        const { renderMap } = await importSUT();
        // Should not throw
        renderMap();
        expect(document.getElementById("leaflet-map")).toBeNull();
    });

    it("creates map structure and UI controls, sets up zoom slider and layers button", async () => {
        expect.assertions(11);

        const { L, map, handlers } = makeLeafletStub();
        (globalThis as typeof globalThis & { L?: LeafletGlobalStub }).L = L;

        const { renderMap } = await importSUT();
        renderMap();

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

    it("removes previous map instance and children to avoid stale state", async () => {
        expect.assertions(3);

        const { L, map } = makeLeafletStub();
        (globalThis as typeof globalThis & { L?: LeafletGlobalStub }).L = L;
        const { renderMap } = await importSUT();

        const container = document.getElementById("content-map")!;
        const child = document.createElement("div");
        container.appendChild(child);

        // Seed previous map instance
        const previousMap = { remove: vi.fn<() => void>() };
        (window as RenderMapWindow)._leafletMapInstance = previousMap;

        renderMap();

        // Previous instance removed and container cleared then repopulated
        expect(previousMap.remove).toHaveBeenCalledOnce();
        expect((window as RenderMapWindow)._leafletMapInstance).toBe(map);
        expect((container.firstChild as HTMLElement).id).toBe("leaflet-map");
    });
});

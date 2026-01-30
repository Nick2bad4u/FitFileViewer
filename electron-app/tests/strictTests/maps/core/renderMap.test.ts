import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock heavy dependencies used inside renderMap
vi.mock("../../../../utils/maps/controls/mapMeasureTool.js", () => ({
    addSimpleMeasureTool: vi.fn(),
}));
vi.mock("../../../../utils/maps/controls/mapLapSelector.js", () => ({
    addLapSelector: vi.fn(),
}));
vi.mock("../../../../utils/maps/layers/mapDrawLaps.js", () => ({
    mapDrawLaps: vi.fn(),
    drawOverlayForFitFile: vi.fn(),
}));
vi.mock("../../../../utils/theming/specific/updateMapTheme.js", () => ({
    installUpdateMapThemeListeners: vi.fn(),
    updateMapTheme: vi.fn(),
}));
vi.mock("../../../../utils/maps/layers/mapIcons.js", () => ({
    createEndIcon: vi.fn(),
    createStartIcon: vi.fn(),
}));
vi.mock("../../../../utils/maps/controls/mapActionButtons.js", () => ({
    createMapThemeToggle: vi.fn(() => {
        const el = document.createElement("button");
        el.id = "mock-map-theme-toggle";
        return el;
    }),
}));
vi.mock("../../../../utils/maps/layers/mapBaseLayers.js", async (orig) => {
    // We defer to actual implementation but ensure it sees a stubbed global L with tileLayer/maplibreGL
    const g: any = globalThis as any;
    if (!g.L) {
        g.L = {
            tileLayer: vi.fn(() => ({})),
            maplibreGL: vi.fn(() => ({})),
        };
    }
    const actual = await (orig as any)();
    return actual;
});
vi.mock("../../../../utils/ui/controls/createMarkerCountSelector.js", () => ({
    createMarkerCountSelector: vi.fn((_cb?: Function) => {
        const el = document.createElement("div");
        el.className = "mock-marker-count";
        // Do not call the callback immediately; it's meant for user interaction later
        return el;
    }),
}));
vi.mock(
    "../../../../utils/rendering/components/createShownFilesList.js",
    () => ({
        createShownFilesList: vi.fn(() => {
            const el = document.createElement("div");
            el.className = "mock-shown-files";
            return el;
        }),
    })
);
vi.mock("../../../../utils/ui/controls/createAddFitFileToMapButton.js", () => ({
    createAddFitFileToMapButton: vi.fn(() => {
        const el = document.createElement("button");
        el.id = "mock-add-fit";
        return el;
    }),
}));
vi.mock("../../../../utils/files/export/createExportGPXButton.js", () => ({
    createExportGPXButton: vi.fn(() => {
        const el = document.createElement("button");
        el.id = "mock-export-gpx";
        return el;
    }),
}));
vi.mock("../../../../utils/files/export/createPrintButton.js", () => ({
    createPrintButton: vi.fn(() => {
        const el = document.createElement("button");
        el.id = "mock-print";
        return el;
    }),
}));
vi.mock(
    "../../../../utils/ui/controls/createElevationProfileButton.js",
    () => ({
        createElevationProfileButton: vi.fn(() => {
            const el = document.createElement("button");
            el.id = "mock-elev-profile";
            return el;
        }),
    })
);
vi.mock("../../../../utils/charts/theming/chartOverlayColorPalette.js", () => ({
    chartOverlayColorPalette: {},
}));
vi.mock(
    "../../../../utils/ui/controls/createElevationProfileButton.js",
    () => ({
        createElevationProfileButton: vi.fn(),
    })
);
vi.mock("../../../../utils/maps/controls/mapFullscreenControl.js", () => ({
    addFullscreenControl: vi.fn(),
}));

// Helper to import subject under test after environment prepared
const importSUT = async () => {
    const mod = await import("../../../../utils/maps/core/renderMap.js");
    return mod;
};

function makeLeafletStub() {
    // minimal event hub for map.on(...)
    const handlers: Record<string, Function[]> = {};
    const map = {
        getMinZoom: vi.fn(() => 0),
        getMaxZoom: vi.fn(() => 20),
        getZoom: vi.fn(() => 5),
        setZoom: vi.fn(),
        on: vi.fn((evt: string, cb: Function) => {
            // Leaflet supports space-delimited multiple events
            evt.split(/\s+/).forEach((name) => {
                (handlers[name] ||= []).push(cb);
            });
            return map;
        }),
        remove: vi.fn(),
    } as any;
    const control = {
        layers: vi.fn(() => ({ addTo: vi.fn() })),
        scale: vi.fn(() => ({ addTo: vi.fn() })),
    };
    const L = {
        map: vi.fn(() => map),
        control,
    } as any;
    return { L, map, handlers };
}

describe("renderMap core", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = "";

        // Ensure a container exists by default
        const container = document.createElement("div");
        container.id = "content-map";
        document.body.appendChild(container);

        // Reset window extensions used by the module
        const w: any = window as any;
        w.globalData = { recordMesgs: [] };
        w._overlayPolylines = {};
        w._leafletMapInstance = null;
        w.loadedFitFiles = [];
    });

    it("returns early when no content-map container", async () => {
        document.body.innerHTML = "";
        const { renderMap } = await importSUT();
        // Should not throw
        renderMap();
        expect(document.getElementById("leaflet-map")).toBeNull();
    });

    it("creates map structure and UI controls, sets up zoom slider and layers button", async () => {
        const { L, map, handlers } = makeLeafletStub();
        (globalThis as any).L = L;
        // Ensure elevation profile button factory returns a DOM node
        const elevMod =
            await import("../../../../utils/ui/controls/createElevationProfileButton.js");
        vi.spyOn(
            elevMod as any,
            "createElevationProfileButton"
        ).mockImplementation(() => {
            const el = document.createElement("button");
            el.id = "spy-elev-profile";
            return el as any;
        });

        const { renderMap } = await importSUT();
        renderMap();

        // DOM pieces created
        const mapDiv = document.getElementById("leaflet-map");
        const controlsDiv = document.getElementById("map-controls");
        expect(mapDiv).toBeTruthy();
        expect(controlsDiv).toBeTruthy();

        // Custom map type button exists and expands layer control on click
        const btn = document.querySelector(
            ".custom-maptype-btn"
        ) as HTMLDivElement;
        expect(btn).toBeTruthy();

        // Fake a layers control DOM to check expansion then collapse behavior
        const layersPanel = document.createElement("div");
        layersPanel.className = "leaflet-control-layers";
        document.body.appendChild(layersPanel);

        btn.click();
        expect(
            layersPanel.classList.contains("leaflet-control-layers-expanded")
        ).toBe(true);

        // Clicking outside collapses it
        document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        expect(
            layersPanel.classList.contains("leaflet-control-layers-expanded")
        ).toBe(false);

        // Zoom slider exists and reflects current zoom
        const slider = document.querySelector(
            "#zoom-slider-input"
        ) as HTMLInputElement;
        const label = document.querySelector(
            "#zoom-slider-current"
        ) as HTMLElement;
        expect(slider).toBeTruthy();
        expect(label).toBeTruthy();
        expect(Number(slider.value)).toBe(
            Math.round(
                ((map.getZoom() - map.getMinZoom()) /
                    (map.getMaxZoom() - map.getMinZoom())) *
                    100
            )
        );

        // Change slider -> map.setZoom called on change
        slider.value = "50";
        slider.dispatchEvent(new Event("change", { bubbles: true }));
        // 50% of 0..20 -> 10
        expect(map.setZoom).toHaveBeenCalledWith(10);

        // Simulate map zoom event updating slider back
        handlers["zoomend"]?.forEach((cb) => cb());
        expect(slider.value).toBe(
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
        const { L } = makeLeafletStub();
        (globalThis as any).L = L;
        const elevMod =
            await import("../../../../utils/ui/controls/createElevationProfileButton.js");
        vi.spyOn(
            elevMod as any,
            "createElevationProfileButton"
        ).mockImplementation(() => {
            const el = document.createElement("button");
            el.id = "spy-elev-profile";
            return el as any;
        });
        const { renderMap } = await importSUT();

        const container = document.getElementById("content-map")!;
        const child = document.createElement("div");
        container.appendChild(child);

        // Seed previous map instance
        (window as any)._leafletMapInstance = { remove: vi.fn() };

        renderMap();

        // Previous instance removed and container cleared then repopulated
        expect((window as any)._leafletMapInstance).not.toBeNull();
        expect((container.firstChild as HTMLElement).id).toBe("leaflet-map");
    });
});

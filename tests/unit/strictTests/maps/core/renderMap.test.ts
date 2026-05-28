import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock heavy dependencies used inside renderMap
vi.mock(
    "../../../../../electron-app/utils/maps/controls/mapMeasureTool.js",
    () => ({
        addSimpleMeasureTool: vi.fn(),
    })
);
vi.mock(
    "../../../../../electron-app/utils/maps/controls/mapLapSelector.js",
    () => ({
        addLapSelector: vi.fn(),
    })
);
vi.mock("../../../../../electron-app/utils/maps/layers/mapDrawLaps.js", () => ({
    mapDrawLaps: vi.fn(),
    drawOverlayForFitFile: vi.fn(),
}));
vi.mock(
    "../../../../../electron-app/utils/theming/specific/updateMapTheme.js",
    () => ({
        installUpdateMapThemeListeners: vi.fn(),
        updateMapTheme: vi.fn(),
    })
);
vi.mock("../../../../../electron-app/utils/maps/layers/mapIcons.js", () => ({
    createEndIcon: vi.fn(),
    createStartIcon: vi.fn(),
}));
vi.mock(
    "../../../../../electron-app/utils/maps/controls/mapActionButtons.js",
    () => ({
        createMapThemeToggle: vi.fn(() => {
            const el = document.createElement("button");
            el.id = "mock-map-theme-toggle";
            return el;
        }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/maps/layers/mapBaseLayers.js",
    async (orig) => {
        // We defer to actual implementation but ensure it sees a stubbed global L with tileLayer/maplibreGL
        const g: any = globalThis as any;
        if (!g.L) {
            g.L = {
                tileLayer: vi.fn(() => ({})),
                maplibreGL: vi.fn(() => ({})),
            };
        }
        return await (orig as any)();
    }
);
vi.mock(
    "../../../../../electron-app/utils/ui/controls/createMarkerCountSelector.js",
    () => ({
        createMarkerCountSelector: vi.fn((_cb?: Function) => {
            const el = document.createElement("div");
            el.className = "mock-marker-count";
            // Do not call the callback immediately; it's meant for user interaction later
            return el;
        }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/rendering/components/createShownFilesList.js",
    () => ({
        createShownFilesList: vi.fn(() => {
            const el = document.createElement("div");
            el.className = "mock-shown-files";
            return el;
        }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/ui/controls/createAddFitFileToMapButton.js",
    () => ({
        createAddFitFileToMapButton: vi.fn(() => {
            const el = document.createElement("button");
            el.id = "mock-add-fit";
            return el;
        }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/files/export/createExportGPXButton.js",
    () => ({
        createExportGPXButton: vi.fn(() => {
            const el = document.createElement("button");
            el.id = "mock-export-gpx";
            return el;
        }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/files/export/createPrintButton.js",
    () => ({
        createPrintButton: vi.fn(() => {
            const el = document.createElement("button");
            el.id = "mock-print";
            return el;
        }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/ui/controls/createElevationProfileButton.js",
    () => ({
        createElevationProfileButton: vi.fn(() => {
            const el = document.createElement("button");
            el.id = "mock-elev-profile";
            return el;
        }),
    })
);
vi.mock(
    "../../../../../electron-app/utils/charts/theming/chartOverlayColorPalette.js",
    () => ({
        chartOverlayColorPalette: {},
    })
);
vi.mock(
    "../../../../../electron-app/utils/ui/controls/createElevationProfileButton.js",
    () => ({
        createElevationProfileButton: vi.fn(),
    })
);
vi.mock(
    "../../../../../electron-app/utils/maps/controls/mapFullscreenControl.js",
    () => ({
        addFullscreenControl: vi.fn(),
    })
);

// Helper to import subject under test after environment prepared
const importSUT = async () => {
    return await import("../../../../../electron-app/utils/maps/core/renderMap.js");
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
            await import("../../../../../electron-app/utils/ui/controls/createElevationProfileButton.js");
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
        expect(mapDiv).toBeInstanceOf(HTMLDivElement);
        expect(controlsDiv).toBeInstanceOf(HTMLDivElement);

        // Custom map type button exists and expands layer control on click
        const btn = document.querySelector<HTMLDivElement>(
            ".custom-maptype-btn"
        );
        expect(btn).toBeInstanceOf(HTMLDivElement);
        if (!btn) {
            throw new Error("Custom map type button was not rendered");
        }

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
        const slider =
            document.querySelector<HTMLInputElement>("#zoom-slider-input");
        const label = document.querySelector<HTMLElement>(
            "#zoom-slider-current"
        );
        expect(slider).toBeInstanceOf(HTMLInputElement);
        expect(label).toBeInstanceOf(HTMLElement);
        if (!slider || !label) {
            throw new Error("Zoom slider controls were not rendered");
        }
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
        const { L, map } = makeLeafletStub();
        (globalThis as any).L = L;
        const elevMod =
            await import("../../../../../electron-app/utils/ui/controls/createElevationProfileButton.js");
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
        const previousMap = { remove: vi.fn() };
        (window as any)._leafletMapInstance = previousMap;

        renderMap();

        // Previous instance removed and container cleared then repopulated
        expect(previousMap.remove).toHaveBeenCalledTimes(1);
        expect((window as any)._leafletMapInstance).toBe(map);
        expect((container.firstChild as HTMLElement).id).toBe("leaflet-map");
    });
});

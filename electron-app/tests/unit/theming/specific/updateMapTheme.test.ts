import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetMapThemeInverted = vi.fn();
vi.mock("../../../../utils/theming/specific/createMapThemeToggle.js", () => ({
    getMapThemeInverted: mockGetMapThemeInverted,
}));

declare global {
    // eslint-disable-next-line no-var
    var _mapThemeListener: (() => void) | undefined;
}

const { updateMapTheme } = await import("../../../../utils/theming/specific/updateMapTheme.js");

const createLayerMock = (label: string) => ({
    addTo: vi.fn(),
    label,
});

const resetGlobals = () => {
    const windowExt = globalThis as any;
    delete windowExt._leafletMapInstance;
    delete windowExt.__mapLayerRegistry;
    delete windowExt.__mapManagedLayerConfig;
    delete windowExt.__mapManagedLayerIds;
    delete windowExt.__mapCurrentBaseLayer;
    delete windowExt.__mapCurrentBaseLayerId;
    delete windowExt.__mapBaseLayerManual;
    delete windowExt.__miniMapLayers;
    delete windowExt._miniMapControl;
};

describe("updateMapTheme", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        resetGlobals();
        document.body.innerHTML = "";
        mockGetMapThemeInverted.mockReset();
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("applies dark theme and switches to the managed dark base layer", () => {
        mockGetMapThemeInverted.mockReturnValue(true);
    document.body.innerHTML = '<div id="leaflet-map"></div><div id="map-controls" class="map-view-root__controls"></div>';

        const darkLayer = createLayerMock("dark");
        const lightLayer = createLayerMock("light");
        const mapInstance = { removeLayer: vi.fn() } as any;

        const windowExt = globalThis as any;
        windowExt._leafletMapInstance = mapInstance;
        windowExt.__mapLayerRegistry = {
            CartoDB_DarkMatter: darkLayer,
            CartoDB_Positron: lightLayer,
            OpenStreetMap: lightLayer,
        };
        windowExt.__mapManagedLayerConfig = {
            dark: "CartoDB_DarkMatter",
            fallback: "OpenStreetMap",
            light: "CartoDB_Positron",
        };
        windowExt.__mapManagedLayerIds = new Set(["CartoDB_DarkMatter", "CartoDB_Positron"]);
        windowExt.__mapCurrentBaseLayer = lightLayer;
        windowExt.__mapCurrentBaseLayerId = "CartoDB_Positron";
        windowExt.__mapBaseLayerManual = false;
        windowExt.__miniMapLayers = {
            dark: { id: "mini-dark" },
            fallback: { id: "mini-fallback" },
            light: { id: "mini-light" },
        };
        windowExt._miniMapControl = { changeLayer: vi.fn() };

        updateMapTheme();

        const leafletMap = document.querySelector("#leaflet-map") as HTMLElement;
        const mapControls = document.querySelector("#map-controls") as HTMLElement;
        expect(leafletMap.dataset.mapTheme).toBe("dark");
        expect(mapControls.dataset.mapTheme).toBe("dark");
        expect(mapInstance.removeLayer).toHaveBeenCalledWith(lightLayer);
        expect(darkLayer.addTo).toHaveBeenCalledWith(mapInstance);
        expect(windowExt._miniMapControl.changeLayer).toHaveBeenCalledWith({ id: "mini-dark" });
        expect(consoleLogSpy).toHaveBeenCalledWith("[updateMapTheme] Map theme updated - Map dark: true");
    });

    it("keeps the current base layer when the user selected a manual override", () => {
        mockGetMapThemeInverted.mockReturnValue(false);
        document.body.innerHTML = '<div id="leaflet-map"></div><div id="map-controls" class="map-view-root__controls"></div>';
        const mapControls = document.querySelector("#map-controls") as HTMLElement;

        const customLayer = createLayerMock("custom");
        const windowExt = globalThis as any;
        windowExt._leafletMapInstance = { removeLayer: vi.fn() };
        windowExt.__mapLayerRegistry = {
            CartoDB_DarkMatter: createLayerMock("dark"),
            CartoDB_Positron: createLayerMock("light"),
        };
        windowExt.__mapManagedLayerConfig = {
            dark: "CartoDB_DarkMatter",
            fallback: "CartoDB_Positron",
            light: "CartoDB_Positron",
        };
        windowExt.__mapManagedLayerIds = new Set(["CartoDB_DarkMatter", "CartoDB_Positron"]);
        windowExt.__mapCurrentBaseLayer = customLayer;
        windowExt.__mapCurrentBaseLayerId = "Esri";
        windowExt.__mapBaseLayerManual = true;

        updateMapTheme();

    expect(windowExt._leafletMapInstance.removeLayer).not.toHaveBeenCalled();
    expect(customLayer.addTo).not.toHaveBeenCalled();
    expect(mapControls.dataset.mapTheme).toBe("light");
    });

    it("handles missing map element without throwing", () => {
        mockGetMapThemeInverted.mockReturnValue(true);
        document.body.innerHTML = '<div id="map-controls" class="map-view-root__controls"></div>';

        expect(() => updateMapTheme()).not.toThrow();
        expect(consoleLogSpy).toHaveBeenCalledWith("[updateMapTheme] Map theme updated - Map dark: true");

        const mapControls = document.querySelector("#map-controls") as HTMLElement | null;
        expect(mapControls?.dataset.mapTheme).toBe("dark");
    });

    it("logs errors from getMapThemeInverted", () => {
        const error = new Error("preference failure");
        mockGetMapThemeInverted.mockImplementation(() => {
            throw error;
        });

        updateMapTheme();

        expect(consoleErrorSpy).toHaveBeenCalledWith("[updateMapTheme] Error updating map theme:", error);
    });

    it("handles DOM query failures gracefully", () => {
        mockGetMapThemeInverted.mockReturnValue(true);
        const originalQuery = document.querySelector;
        document.querySelector = vi.fn().mockImplementation(() => {
            throw new Error("query issue");
        });

        try {
            updateMapTheme();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Error updating map theme:",
                expect.any(Error)
            );
        } finally {
            document.querySelector = originalQuery;
        }
    });

    it("registers a global theme listener during module load", () => {
        expect(globalThis._mapThemeListener).toBeDefined();
        expect(typeof globalThis._mapThemeListener).toBe("function");
    });

    it("invokes update logic when the global listener fires", () => {
        mockGetMapThemeInverted.mockReturnValue(false);
    document.body.innerHTML = '<div id="leaflet-map"></div><div id="map-controls" class="map-view-root__controls"></div>';
        const windowExt = globalThis as any;
        windowExt._leafletMapInstance = { removeLayer: vi.fn() };
        windowExt.__mapLayerRegistry = {
            CartoDB_DarkMatter: createLayerMock("dark"),
            CartoDB_Positron: createLayerMock("light"),
        };
        windowExt.__mapManagedLayerConfig = {
            dark: "CartoDB_DarkMatter",
            fallback: "CartoDB_Positron",
            light: "CartoDB_Positron",
        };
        windowExt.__mapManagedLayerIds = new Set(["CartoDB_DarkMatter", "CartoDB_Positron"]);

        globalThis._mapThemeListener?.();

    const leafletMap = document.querySelector("#leaflet-map") as HTMLElement;
    const mapControls = document.querySelector("#map-controls") as HTMLElement;
    expect(leafletMap.dataset.mapTheme).toBe("light");
    expect(mapControls.dataset.mapTheme).toBe("light");
    });
});

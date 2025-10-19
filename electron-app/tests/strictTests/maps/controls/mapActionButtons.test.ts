import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({ showNotification: vi.fn() }));

const modPath = "../../../../utils/maps/controls/mapActionButtons.js";

describe("mapActionButtons", () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="activeFileName">main.fit</div><button data-tab="map"></button>`;
        Object.assign(window, {
            _overlayPolylines: [],
            _leafletMapInstance: null,
            _mainPolylineOriginalBounds: null,
            updateOverlayHighlights: undefined,
        });
        (window as any).L = undefined;
        vi.resetModules();
    });

    it("attaches click listener and shows notification when map not ready", async () => {
        await import(modPath); // IIFE attaches observers and handlers
        const name = document.getElementById("activeFileName")!;
        const { showNotification } = await import("../../../../utils/ui/notifications/showNotification.js");
        name.dispatchEvent(new Event("click"));
        // Click handler defers center operation via setTimeout; advance timers
        await new Promise((r) => setTimeout(r, 600));
        // No map instance or main polyline, should notify (either missing track or map not ready)
        expect((showNotification as any).mock.calls.length).toBeGreaterThan(0);
    });

    it("centers map when main polyline and bounds exist", async () => {
        // stub Leaflet structures and bounds
        const fitBounds = vi.fn();
        const getCenter = vi.fn(() => ({ lat: 1, lng: 2 }));
        const getZoom = vi.fn(() => 10);
        (window as any)._leafletMapInstance = { fitBounds, getCenter, getZoom };
        (window as any)._mainPolylineOriginalBounds = { isValid: () => true };
        const poly = {
            options: { color: "#1976d2" },
            getElement: () => ({ style: {} as any }),
        } as any;
        (window as any)._overlayPolylines = [poly];
        await import(modPath);
        const name = document.getElementById("activeFileName")!;
        name.dispatchEvent(new Event("click"));
        // After a small timeout used in module, advance timers
        await new Promise((r) => setTimeout(r, 150));
        expect(fitBounds).toHaveBeenCalled();
    });
});

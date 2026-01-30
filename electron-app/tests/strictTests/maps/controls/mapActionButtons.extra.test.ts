import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

const modPath = "../../../../utils/maps/controls/mapActionButtons.js";

describe("mapActionButtons additional branches", () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="activeFileName">main.fit</div><button data-tab="map"></button>`;
        Object.assign(window as any, {
            _overlayPolylines: [],
            _leafletMapInstance: null,
            _mainPolylineOriginalBounds: null,
            updateOverlayHighlights: undefined,
        });
        (window as any).L = undefined;
        vi.resetModules();
        vi.useRealTimers();
    });

    it("notifies when no valid bounds even with polyline", async () => {
        const fitBounds = vi.fn();
        (window as any)._leafletMapInstance = {
            fitBounds,
            getCenter: vi.fn(),
            getZoom: vi.fn(),
        };
        const poly = {
            options: { color: "#1976d2" },
            getBounds: () => ({ isValid: () => false }),
            getElement: () => ({ style: {} as any }),
        } as any;
        (window as any)._overlayPolylines = [poly];

        await import(modPath);
        const name = document.getElementById("activeFileName")!;
        name.dispatchEvent(new Event("click"));
        await new Promise((r) => setTimeout(r, 150));
        const { showNotification } =
            await import("../../../../utils/ui/notifications/showNotification.js");
        expect(
            (showNotification as any).mock.calls.some((c: any[]) =>
                String(c[0]).includes("bounds")
            )
        ).toBe(true);
        expect(fitBounds).not.toHaveBeenCalled();
    });

    it("brings matching color markers to front when L.CircleMarker exists", async () => {
        const fitBounds = vi.fn();
        const getCenter = vi.fn(() => ({ lat: 0, lng: 0 }));
        const getZoom = vi.fn(() => 12);
        (window as any)._leafletMapInstance = { fitBounds, getCenter, getZoom };
        (window as any)._mainPolylineOriginalBounds = { isValid: () => true };

        const bringToFrontMarker = vi.fn();
        const CircleMarker = function (this: any) {} as any;
        (window as any).L = { CircleMarker };

        const poly = {
            options: { color: "#00ff00" },
            getElement: () => ({ style: {} as any }),
            _map: {
                _layers: {
                    a: {
                        options: { color: "#00ff00" },
                        bringToFront: bringToFrontMarker,
                    },
                    b: { options: { color: "#ff0000" }, bringToFront: vi.fn() },
                },
            },
            bringToFront: vi.fn(),
            getBounds: () => ({ isValid: () => true }),
        } as any;

        // Make layer a instance of CircleMarker at runtime check
        Object.setPrototypeOf(
            (poly._map._layers as any).a,
            (window as any).L.CircleMarker.prototype
        );
        Object.setPrototypeOf(
            (poly._map._layers as any).b,
            (window as any).L.CircleMarker.prototype
        );

        (window as any)._overlayPolylines = [poly];
        await import(modPath);
        const name = document.getElementById("activeFileName")!;
        name.dispatchEvent(new Event("click"));
        await new Promise((r) => setTimeout(r, 200));
        expect(bringToFrontMarker).toHaveBeenCalled();
        expect(fitBounds).toHaveBeenCalled();
    });

    it("reapplies setup after updateShownFilesList is called", async () => {
        // Provide an original implementation that changes DOM
        (window as any).updateShownFilesList = vi.fn((root?: HTMLElement) => {
            const el = document.getElementById("activeFileName");
            if (el) el.textContent = "changed.fit";
        });
        await import(modPath);
        // Call patched function
        (window as any).updateShownFilesList();
        // Ensure our click handler still works after patch
        const fitBounds = vi.fn();
        (window as any)._leafletMapInstance = {
            fitBounds,
            getCenter: vi.fn(),
            getZoom: vi.fn(),
        };
        (window as any)._mainPolylineOriginalBounds = { isValid: () => true };
        (window as any)._overlayPolylines = [
            {
                options: { color: "#1976d2" },
                getBounds: () => ({ isValid: () => true }),
                getElement: () => ({ style: {} }),
            },
        ];
        const name = document.getElementById("activeFileName")!;
        name.dispatchEvent(new Event("click"));
        await new Promise((r) => setTimeout(r, 150));
        expect(fitBounds).toHaveBeenCalled();
    });
});

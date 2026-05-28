import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { showNotification } from "../../../../../electron-app/utils/ui/notifications/showNotification.js";

vi.mock(
    "../../../../../electron-app/utils/ui/notifications/showNotification.js",
    () => ({
        showNotification: vi.fn(),
    })
);

const showNotificationMock = vi.mocked(showNotification);

function getActiveFileName(): HTMLElement {
    const activeFileName = document.getElementById("activeFileName");

    expect(activeFileName).toBeInstanceOf(HTMLElement);

    return activeFileName as HTMLElement;
}

describe("mapActionButtons additional branches", () => {
    beforeEach(() => {
        const activeFileName = document.createElement("div");
        activeFileName.id = "activeFileName";
        activeFileName.textContent = "main.fit";

        const mapButton = document.createElement("button");
        mapButton.id = "tab_map";
        mapButton.type = "button";

        document.body.replaceChildren(activeFileName, mapButton);
        Object.assign(window as any, {
            _overlayPolylines: [],
            _leafletMapInstance: null,
            _mainPolylineOriginalBounds: null,
            updateOverlayHighlights: undefined,
        });
        (window as any).L = undefined;
        vi.resetModules();
        showNotificationMock.mockClear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        document.body.replaceChildren();
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

        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");
        const name = getActiveFileName();

        expect(name.title).toBe("Click to center map on main file");

        name.dispatchEvent(new Event("click"));
        await vi.advanceTimersByTimeAsync(100);

        expect(showNotificationMock).toHaveBeenCalledWith(
            "Could not determine track bounds",
            "warning"
        );
        expect(fitBounds).not.toHaveBeenCalled();
    });

    it("brings matching color markers to front when L.CircleMarker exists", async () => {
        const fitBounds = vi.fn();
        const getCenter = vi.fn(() => ({ lat: 0, lng: 0 }));
        const getZoom = vi.fn(() => 12);
        (window as any)._leafletMapInstance = { fitBounds, getCenter, getZoom };
        const bounds = { isValid: () => true };
        (window as any)._mainPolylineOriginalBounds = bounds;

        const bringToFrontMarker = vi.fn();
        const skipMarker = vi.fn();
        const CircleMarker = function (this: any) {} as any;
        (window as any).L = { CircleMarker };
        const polylineElement = document.createElement("div");
        const matchingMarker = Object.assign(new CircleMarker(), {
            bringToFront: bringToFrontMarker,
            options: { color: "#00ff00" },
        });
        const otherMarker = Object.assign(new CircleMarker(), {
            bringToFront: skipMarker,
            options: { color: "#ff0000" },
        });

        const poly = {
            options: { color: "#00ff00" },
            getElement: () => polylineElement,
            _map: {
                _layers: {
                    a: matchingMarker,
                    b: otherMarker,
                },
            },
            bringToFront: vi.fn(),
            getBounds: () => bounds,
        } as any;

        (window as any)._overlayPolylines = [poly];
        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");
        const name = getActiveFileName();
        name.dispatchEvent(new Event("click"));
        await vi.advanceTimersByTimeAsync(100);

        expect(bringToFrontMarker).toHaveBeenCalledOnce();
        expect(skipMarker).not.toHaveBeenCalled();
        expect(fitBounds).toHaveBeenCalledWith(bounds, { padding: [20, 20] });
        expect(polylineElement.style.filter).toContain("#00ff00");
    });

    it("reapplies setup after updateShownFilesList is called", async () => {
        (window as any).updateShownFilesList = vi.fn((root?: HTMLElement) => {
            const el = document.getElementById("activeFileName");
            if (el) el.textContent = "changed.fit";
        });
        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");

        (window as any).updateShownFilesList();

        const fitBounds = vi.fn();
        const bounds = { isValid: () => true };
        (window as any)._leafletMapInstance = {
            fitBounds,
            getCenter: vi.fn(),
            getZoom: vi.fn(),
        };
        (window as any)._mainPolylineOriginalBounds = bounds;
        (window as any)._overlayPolylines = [
            {
                options: { color: "#1976d2" },
                getBounds: () => bounds,
                getElement: () => ({ style: {} }),
            },
        ];
        const name = getActiveFileName();

        expect(name.textContent).toBe("changed.fit");
        expect(name.style.cursor).toBe("pointer");

        name.dispatchEvent(new Event("click"));
        await vi.advanceTimersByTimeAsync(100);

        expect(fitBounds).toHaveBeenCalledWith(bounds, { padding: [20, 20] });
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type FitBoundsFn = (
    bounds: unknown,
    options: { padding: [number, number] }
) => void;
type GetCenterFn = () => { lat: number; lng: number };
type GetZoomFn = () => number;
type NotificationFn = (message: string, type: string) => void;
type UpdateShownFilesListFn = (root?: HTMLElement) => void;
type VoidFn = () => void;

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<NotificationFn>(),
    })
);

async function getShowNotificationMock() {
    const notificationModule =
        await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");

    return vi.mocked(notificationModule.showNotification);
}

function getActiveFileName(): HTMLElement {
    const activeFileName = document.getElementById("activeFileName");

    expect(activeFileName).toBeInstanceOf(HTMLElement);

    return activeFileName as HTMLElement;
}

describe("mapActionButtons", () => {
    beforeEach(() => {
        const activeFileName = document.createElement("div");
        activeFileName.id = "activeFileName";
        activeFileName.textContent = "main.fit";

        const mapButton = document.createElement("button");
        mapButton.id = "tab_map";
        mapButton.type = "button";

        document.body.replaceChildren(activeFileName, mapButton);
        Object.assign(window, {
            _overlayPolylines: [],
            _leafletMapInstance: null,
            _mainPolylineOriginalBounds: null,
            updateOverlayHighlights: undefined,
        });
        (window as any).L = undefined;
        vi.resetModules();
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        document.body.replaceChildren();
    });

    it("attaches click listener and shows notification when map not ready", async () => {
        expect.assertions(4);

        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");
        const showNotificationMock = await getShowNotificationMock();
        const name = getActiveFileName();

        expect(name.title).toBe("Click to center map on main file");

        name.dispatchEvent(new Event("click"));
        await vi.advanceTimersByTimeAsync(100);

        expect(showNotificationMock).toHaveBeenCalledWith(
            "Map not ready for centering",
            "warning"
        );
        expect(name.classList.contains("highlighted")).toBe(false);
    });

    it("centers map when main polyline and bounds exist", async () => {
        expect.assertions(5);

        // stub Leaflet structures and bounds
        const fitBounds = vi.fn<FitBoundsFn>();
        const getCenter = vi.fn<GetCenterFn>(() => ({ lat: 1, lng: 2 }));
        const getZoom = vi.fn<GetZoomFn>(() => 10);
        (window as any)._leafletMapInstance = { fitBounds, getCenter, getZoom };
        const bounds = { isValid: () => true };
        (window as any)._mainPolylineOriginalBounds = bounds;
        const polylineElement = document.createElement("div");
        const poly = {
            options: { color: "#1976d2" },
            getElement: () => polylineElement,
        } as any;
        (window as any)._overlayPolylines = [poly];
        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");
        const showNotificationMock = await getShowNotificationMock();
        const name = getActiveFileName();

        expect(name.style.cursor).toBe("pointer");

        name.dispatchEvent(new Event("click"));
        await vi.advanceTimersByTimeAsync(100);

        expect(fitBounds).toHaveBeenCalledWith(bounds, { padding: [20, 20] });
        expect(polylineElement.style.filter).toContain("#1976d2");
        expect(showNotificationMock).not.toHaveBeenCalledWith(
            "Could not determine track bounds",
            "warning"
        );
    });

    it("notifies when no valid bounds even with polyline", async () => {
        expect.assertions(4);

        const fitBounds = vi.fn<FitBoundsFn>();
        (window as any)._leafletMapInstance = {
            fitBounds,
            getCenter: vi.fn<GetCenterFn>(),
            getZoom: vi.fn<GetZoomFn>(),
        };
        const poly = {
            options: { color: "#1976d2" },
            getBounds: () => ({ isValid: () => false }),
            getElement: () => ({ style: {} as any }),
        } as any;
        (window as any)._overlayPolylines = [poly];

        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");
        const showNotificationMock = await getShowNotificationMock();
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
        expect.assertions(5);

        const fitBounds = vi.fn<FitBoundsFn>();
        const getCenter = vi.fn<GetCenterFn>(() => ({ lat: 0, lng: 0 }));
        const getZoom = vi.fn<GetZoomFn>(() => 12);
        (window as any)._leafletMapInstance = { fitBounds, getCenter, getZoom };
        const bounds = { isValid: () => true };
        (window as any)._mainPolylineOriginalBounds = bounds;

        const bringToFrontMarker = vi.fn<VoidFn>();
        const skipMarker = vi.fn<VoidFn>();
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
            bringToFront: vi.fn<VoidFn>(),
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
        expect.assertions(4);

        (window as any).updateShownFilesList = () => undefined;
        vi.spyOn(
            window as any,
            "updateShownFilesList"
        ).mockImplementation<UpdateShownFilesListFn>(() => {
            const activeFileName = document.getElementById("activeFileName");
            if (activeFileName) {
                activeFileName.textContent = "changed.fit";
            }
        });
        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");

        (window as any).updateShownFilesList();

        const fitBounds = vi.fn<FitBoundsFn>();
        const bounds = { isValid: () => true };
        (window as any)._leafletMapInstance = {
            fitBounds,
            getCenter: vi.fn<GetCenterFn>(),
            getZoom: vi.fn<GetZoomFn>(),
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

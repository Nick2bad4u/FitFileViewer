import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadLeafletRuntime() {
    return import("../../../../../electron-app/utils/maps/core/leafletRuntime.js");
}

type FitBoundsFn = (
    bounds: unknown,
    options: { padding: [number, number] }
) => void;
type GetCenterFn = () => { lat: number; lng: number };
type GetZoomFn = () => number;
type NotificationFn = (message: string, type: string) => void;
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

async function initializeMapActionButtons(): Promise<void> {
    const { initializeActiveFileNameMapActions } =
        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");

    initializeActiveFileNameMapActions();
}

function getActiveFileName(): HTMLElement {
    const activeFileName = document.getElementById("activeFileName");

    expect(activeFileName).toBeInstanceOf(HTMLElement);

    return activeFileName as HTMLElement;
}

describe("mapActionButtons", () => {
    beforeEach(async () => {
        const activeFileName = document.createElement("div");
        activeFileName.id = "activeFileName";
        activeFileName.textContent = "main.fit";

        const mapButton = document.createElement("button");
        mapButton.id = "tab_map";
        mapButton.type = "button";

        document.body.replaceChildren(activeFileName, mapButton);
        vi.resetModules();
        const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
        clearLeafletRuntimeForTests();
        vi.clearAllMocks();
        vi.useFakeTimers();
        const { resetMapPolylineRegistryForTests } =
            await import("../../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js");
        resetMapPolylineRegistryForTests();
    });

    afterEach(async () => {
        const { resetMapActionButtonStateForTests } =
            await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");
        resetMapActionButtonStateForTests();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        const { resetMapPolylineRegistryForTests } =
            await import("../../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js");
        resetMapPolylineRegistryForTests();
        const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
        clearLeafletRuntimeForTests();
        document.body.replaceChildren();
    });

    it("does not wire active filename actions on module import", async () => {
        expect.assertions(4);

        await import("../../../../../electron-app/utils/maps/controls/mapActionButtons.js");
        const showNotificationMock = await getShowNotificationMock();
        const name = getActiveFileName();

        name.dispatchEvent(new Event("click"));
        await vi.advanceTimersByTimeAsync(100);

        expect(name.title).toBe("");
        expect(name.style.cursor).toBe("");
        expect(showNotificationMock).not.toHaveBeenCalled();
    });

    it("attaches click listener and shows notification when map not ready", async () => {
        expect.assertions(4);

        await initializeMapActionButtons();
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
        const { setRegisteredLeafletMapInstance } =
            await import("../../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js");
        setRegisteredLeafletMapInstance({ fitBounds, getCenter, getZoom });
        const { registerOverlayMapPolyline, setMainMapPolylineOriginalBounds } =
            await import("../../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js");
        const bounds = { isValid: () => true };
        setMainMapPolylineOriginalBounds(bounds);
        const polylineElement = document.createElement("div");
        const poly = {
            options: { color: "#1976d2" },
            getElement: () => polylineElement,
        } as any;
        registerOverlayMapPolyline(0, poly);
        await initializeMapActionButtons();
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
        const { setRegisteredLeafletMapInstance } =
            await import("../../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js");
        setRegisteredLeafletMapInstance({
            fitBounds,
            getCenter: vi.fn<GetCenterFn>(),
            getZoom: vi.fn<GetZoomFn>(),
        });
        const poly = {
            options: { color: "#1976d2" },
            getBounds: () => ({ isValid: () => false }),
            getElement: () => ({ style: {} as any }),
        } as any;
        const { registerOverlayMapPolyline } =
            await import("../../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js");
        registerOverlayMapPolyline(0, poly);

        await initializeMapActionButtons();
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
        const { setRegisteredLeafletMapInstance } =
            await import("../../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js");
        setRegisteredLeafletMapInstance({ fitBounds, getCenter, getZoom });
        const { registerOverlayMapPolyline, setMainMapPolylineOriginalBounds } =
            await import("../../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js");
        const bounds = { isValid: () => true };
        setMainMapPolylineOriginalBounds(bounds);

        const bringToFrontMarker = vi.fn<VoidFn>();
        const skipMarker = vi.fn<VoidFn>();
        const CircleMarker = function (this: any) {} as any;
        const { setLeafletRuntime } = await loadLeafletRuntime();
        setLeafletRuntime({ CircleMarker });
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

        registerOverlayMapPolyline(0, poly);
        await initializeMapActionButtons();
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

        const { setShownFilesListUpdater, updateShownFilesList } =
            await import("../../../../../electron-app/utils/rendering/components/shownFilesListUpdater.js");
        const disposeShownFilesListUpdater = setShownFilesListUpdater(() => {
            const activeFileName = document.getElementById("activeFileName");
            if (activeFileName) {
                activeFileName.textContent = "changed.fit";
            }
        });

        try {
            await initializeMapActionButtons();

            updateShownFilesList();

            const fitBounds = vi.fn<FitBoundsFn>();
            const bounds = { isValid: () => true };
            const { setRegisteredLeafletMapInstance } =
                await import("../../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js");
            setRegisteredLeafletMapInstance({
                fitBounds,
                getCenter: vi.fn<GetCenterFn>(),
                getZoom: vi.fn<GetZoomFn>(),
            });
            const {
                registerOverlayMapPolyline,
                setMainMapPolylineOriginalBounds,
            } =
                await import("../../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js");
            setMainMapPolylineOriginalBounds(bounds);
            registerOverlayMapPolyline(0, {
                options: { color: "#1976d2" },
                getBounds: () => bounds,
                getElement: () => ({ style: {} }),
            });
            const name = getActiveFileName();

            expect(name.textContent).toBe("changed.fit");
            expect(name.style.cursor).toBe("pointer");

            name.dispatchEvent(new Event("click"));
            await vi.advanceTimersByTimeAsync(100);

            expect(fitBounds).toHaveBeenCalledWith(bounds, {
                padding: [20, 20],
            });
        } finally {
            disposeShownFilesListUpdater();
        }
    });
});

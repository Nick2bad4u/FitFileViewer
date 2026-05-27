// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

type MapBounds = {
    isValid: () => boolean;
};

type MapPolyline = {
    bringToFront: () => void;
    getBounds: () => MapBounds;
    getElement: () => HTMLElement;
    options: {
        color: string;
    };
};

type MapActionButtonTestGlobal = typeof globalThis & {
    _highlightedOverlayIdx?: null | number;
    _leafletMapInstance?: {
        fitBounds: (
            bounds: MapBounds,
            options: { padding: [number, number] }
        ) => void;
        getCenter: () => { lat: number; lng: number };
        getZoom: () => number;
    };
    _mainPolyline?: MapPolyline;
    _setupActiveFileNameMapActions?: () => void;
    updateOverlayHighlights?: () => void;
    updateShownFilesList?: (...args: unknown[]) => unknown;
};

type ActiveFileNameElement = HTMLElement & {
    __ffvMapActionCleanup?: () => void;
};

function getTestGlobal(): MapActionButtonTestGlobal {
    return globalThis as MapActionButtonTestGlobal;
}

function resetMapActionFixture(): void {
    const activeFileName =
        document.querySelector<ActiveFileNameElement>("#active_file_name");
    activeFileName?.__ffvMapActionCleanup?.();
    document.body.replaceChildren();

    const testGlobal = getTestGlobal();
    delete testGlobal._highlightedOverlayIdx;
    delete testGlobal._leafletMapInstance;
    delete testGlobal._mainPolyline;
    delete testGlobal._setupActiveFileNameMapActions;
    delete testGlobal.updateOverlayHighlights;
    delete testGlobal.updateShownFilesList;
}

function mountMapActionDom(): {
    activeFileName: HTMLElement;
    tabClicks: ReturnType<typeof vi.fn<() => void>>;
} {
    const wrapper = document.createElement("div");

    const activeFileName = document.createElement("span");
    activeFileName.id = "active_file_name";
    activeFileName.textContent = "activity.fit";

    const mapTab = document.createElement("button");
    mapTab.id = "tab_map";
    mapTab.type = "button";
    const tabClicks = vi.fn<() => void>();
    mapTab.onclick = () => {
        tabClicks();
    };

    wrapper.append(activeFileName, mapTab);
    document.body.append(wrapper);

    return {
        activeFileName,
        tabClicks,
    };
}

function installMapGlobals(): {
    bounds: MapBounds;
    fitBounds: ReturnType<
        typeof vi.fn<
            (bounds: MapBounds, options: { padding: [number, number] }) => void
        >
    >;
    polylineBringToFront: ReturnType<typeof vi.fn<() => void>>;
    updateOverlayHighlights: ReturnType<typeof vi.fn<() => void>>;
    updateShownFilesList: ReturnType<
        typeof vi.fn<(...args: unknown[]) => void>
    >;
} {
    const bounds: MapBounds = {
        isValid: () => true,
    };
    const polylineElement = document.createElement("div");
    const polylineBringToFront = vi.fn<() => void>();
    const fitBounds =
        vi.fn<
            (bounds: MapBounds, options: { padding: [number, number] }) => void
        >();
    const updateOverlayHighlights = vi.fn<() => void>();
    const updateShownFilesList = vi.fn<(...args: unknown[]) => void>();

    Object.assign(getTestGlobal(), {
        _leafletMapInstance: {
            fitBounds,
            getCenter: () => ({ lat: 40, lng: -73 }),
            getZoom: () => 12,
        },
        _mainPolyline: {
            bringToFront: polylineBringToFront,
            getBounds: () => bounds,
            getElement: () => polylineElement,
            options: { color: "#1976d2" },
        },
        updateOverlayHighlights,
        updateShownFilesList,
    });

    return {
        bounds,
        fitBounds,
        polylineBringToFront,
        updateOverlayHighlights,
        updateShownFilesList,
    };
}

describe("mapActionButtons", () => {
    it("wires active filename actions without stacking duplicate listeners", async () => {
        expect.assertions(11);

        vi.useFakeTimers();
        vi.resetModules();
        resetMapActionFixture();

        try {
            const { activeFileName, tabClicks } = mountMapActionDom();
            const {
                bounds,
                fitBounds,
                polylineBringToFront,
                updateOverlayHighlights,
                updateShownFilesList,
            } = installMapGlobals();

            await import("../../../../electron-app/utils/maps/controls/mapActionButtons.js");

            expect(activeFileName.style.cursor).toBe("pointer");
            expect(activeFileName.title).toBe(
                "Click to center map on main file"
            );

            activeFileName.dispatchEvent(new MouseEvent("mouseenter"));

            expect([...activeFileName.classList]).toContain("highlighted");
            expect(getTestGlobal()._highlightedOverlayIdx).toBe(0);

            getTestGlobal()._setupActiveFileNameMapActions?.();
            getTestGlobal()._setupActiveFileNameMapActions?.();
            updateOverlayHighlights.mockClear();
            activeFileName.dispatchEvent(new MouseEvent("mouseleave"));

            expect([...activeFileName.classList]).not.toContain("highlighted");
            expect(getTestGlobal()._highlightedOverlayIdx).toBeNull();
            expect(updateOverlayHighlights).toHaveBeenCalledOnce();

            activeFileName.click();
            vi.advanceTimersByTime(100);

            expect(tabClicks).toHaveBeenCalledOnce();
            expect(polylineBringToFront).toHaveBeenCalledOnce();
            expect(fitBounds).toHaveBeenCalledWith(bounds, {
                padding: [20, 20],
            });

            getTestGlobal().updateShownFilesList?.("activity.fit");

            expect(updateShownFilesList).toHaveBeenCalledWith("activity.fit");
        } finally {
            resetMapActionFixture();
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });
});

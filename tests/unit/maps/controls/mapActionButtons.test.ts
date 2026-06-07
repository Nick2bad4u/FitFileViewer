// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    updateOverlayHighlights: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../electron-app/utils/maps/layers/mapDrawLaps.js"),
    () => ({
        updateOverlayHighlights: mocks.updateOverlayHighlights,
    })
);

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
    vi.clearAllMocks();
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
    });

    return {
        bounds,
        fitBounds,
        polylineBringToFront,
    };
}

describe("mapActionButtons", () => {
    it("wires active filename actions without stacking duplicate listeners", async () => {
        expect.assertions(15);

        vi.useFakeTimers();
        vi.resetModules();
        resetMapActionFixture();

        try {
            const { activeFileName, tabClicks } = mountMapActionDom();
            const {
                bounds,
                fitBounds,
                polylineBringToFront,
            } = installMapGlobals();

            const { setupActiveFileNameMapActions } = await import(
                "../../../../electron-app/utils/maps/controls/mapActionButtons.js"
            );
            const {
                setShownFilesListUpdater,
                updateShownFilesList,
            } = await import(
                "../../../../electron-app/utils/rendering/components/shownFilesListUpdater.js"
            );
            const listUpdater = vi.fn<() => void>();
            const disposeListUpdater = setShownFilesListUpdater(listUpdater);

            expect(activeFileName.style.cursor).toBe("pointer");
            expect(activeFileName.title).toBe(
                "Click to center map on main file"
            );
            expect(activeFileName.getAttribute("role")).toBe("button");
            expect(activeFileName.getAttribute("tabindex")).toBe("0");
            expect(activeFileName.getAttribute("aria-label")).toBe(
                "Center map on main file"
            );

            activeFileName.dispatchEvent(new MouseEvent("mouseenter"));

            expect({
                highlightedClassPresent:
                    activeFileName.classList.contains("highlighted"),
                highlightedOverlayIndex: getTestGlobal()._highlightedOverlayIdx,
            }).toStrictEqual({
                highlightedClassPresent: true,
                highlightedOverlayIndex: 0,
            });

            setupActiveFileNameMapActions();
            setupActiveFileNameMapActions();
            mocks.updateOverlayHighlights.mockClear();
            activeFileName.dispatchEvent(new MouseEvent("mouseleave"));

            expect(activeFileName.classList.contains("highlighted")).toBe(
                false
            );
            expect(getTestGlobal()._highlightedOverlayIdx).toBeNull();
            expect(mocks.updateOverlayHighlights).toHaveBeenCalledOnce();

            activeFileName.click();
            vi.advanceTimersByTime(100);

            expect(tabClicks).toHaveBeenCalledOnce();
            expect(polylineBringToFront).toHaveBeenCalledOnce();
            expect(fitBounds).toHaveBeenCalledWith(bounds, {
                padding: [20, 20],
            });

            activeFileName.dispatchEvent(
                new KeyboardEvent("keydown", { bubbles: true, key: " " })
            );
            vi.advanceTimersByTime(100);

            expect(tabClicks).toHaveBeenCalledTimes(2);
            expect(polylineBringToFront).toHaveBeenCalledTimes(2);

            updateShownFilesList();

            expect(listUpdater).toHaveBeenCalledOnce();
            disposeListUpdater();
        } finally {
            resetMapActionFixture();
            vi.runOnlyPendingTimers();
            vi.useRealTimers();
        }
    });
});

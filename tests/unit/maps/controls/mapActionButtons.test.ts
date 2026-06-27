// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    highlightedOverlayIndex: null as null | number,
    getHighlightedOverlayIndex: vi.fn<() => null | number>(),
    setHighlightedOverlayIndex: vi.fn<(overlayIndex?: null | number) => void>(),
    updateOverlayHighlights: vi.fn<() => void>(),
}));
mocks.getHighlightedOverlayIndex.mockImplementation(
    () => mocks.highlightedOverlayIndex
);
mocks.setHighlightedOverlayIndex.mockImplementation((overlayIndex) => {
    mocks.highlightedOverlayIndex =
        typeof overlayIndex === "number" ? overlayIndex : null;
    mocks.updateOverlayHighlights();
});

vi.mock(
    import("../../../../electron-app/utils/maps/layers/mapDrawLaps.js"),
    () => ({
        getHighlightedOverlayIndex: mocks.getHighlightedOverlayIndex,
        setHighlightedOverlayIndex: mocks.setHighlightedOverlayIndex,
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

let resetMapActionButtonStateForTests: undefined | (() => void);

function resetMapActionFixture(): void {
    resetMapActionButtonStateForTests?.();
    document.body.replaceChildren();

    vi.clearAllMocks();
    mocks.highlightedOverlayIndex = null;
    mocks.getHighlightedOverlayIndex.mockImplementation(
        () => mocks.highlightedOverlayIndex
    );
    mocks.setHighlightedOverlayIndex.mockImplementation((overlayIndex) => {
        mocks.highlightedOverlayIndex =
            typeof overlayIndex === "number" ? overlayIndex : null;
        mocks.updateOverlayHighlights();
    });
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

async function installMapGlobals(): Promise<{
    bounds: MapBounds;
    fitBounds: ReturnType<
        typeof vi.fn<
            (bounds: MapBounds, options: { padding: [number, number] }) => void
        >
    >;
    mapInstance: {
        fitBounds: (
            bounds: MapBounds,
            options: { padding: [number, number] }
        ) => void;
        getCenter: () => { lat: number; lng: number };
        getZoom: () => number;
    };
    polylineBringToFront: ReturnType<typeof vi.fn<() => void>>;
}> {
    const bounds: MapBounds = {
        isValid: () => true,
    };
    const polylineElement = document.createElement("div");
    const polylineBringToFront = vi.fn<() => void>();
    const fitBounds =
        vi.fn<
            (bounds: MapBounds, options: { padding: [number, number] }) => void
        >();
    const mapInstance = {
        fitBounds,
        getCenter: () => ({ lat: 40, lng: -73 }),
        getZoom: () => 12,
    };
    const { setMainMapPolyline } =
        await import("../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js");

    setMainMapPolyline({
        bringToFront: polylineBringToFront,
        getBounds: () => bounds,
        getElement: () => polylineElement,
        options: { color: "#1976d2" },
    });

    return {
        bounds,
        fitBounds,
        mapInstance,
        polylineBringToFront,
    };
}

describe("mapActionButtons", () => {
    it("wires active filename actions without stacking duplicate listeners", async () => {
        expect.assertions(16);

        vi.useFakeTimers();
        vi.resetModules();
        resetMapActionFixture();

        try {
            const { activeFileName, tabClicks } = mountMapActionDom();
            const { bounds, fitBounds, mapInstance, polylineBringToFront } =
                await installMapGlobals();

            const mapActionButtons =
                await import("../../../../electron-app/utils/maps/controls/mapActionButtons.js");
            const {
                initializeActiveFileNameMapActions,
                setupActiveFileNameMapActions,
            } = mapActionButtons;
            resetMapActionButtonStateForTests =
                mapActionButtons.resetMapActionButtonStateForTests;
            const { setRegisteredLeafletMapInstance } =
                await import("../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js");
            const { setShownFilesListUpdater, updateShownFilesList } =
                await import("../../../../electron-app/utils/rendering/components/shownFilesListUpdater.js");
            const listUpdater = vi.fn<() => void>();
            const disposeListUpdater = setShownFilesListUpdater(listUpdater);
            setRegisteredLeafletMapInstance(mapInstance);
            initializeActiveFileNameMapActions();

            expect(activeFileName.style.cursor).toBe("pointer");
            expect(activeFileName.title).toBe(
                "Click to center map on main file"
            );
            expect(activeFileName.getAttribute("role")).toBe("button");
            expect(activeFileName.getAttribute("tabindex")).toBe("0");
            expect(activeFileName.getAttribute("aria-label")).toBe(
                "Center map on main file"
            );
            expect("__ffvMapActionCleanup" in activeFileName).toBe(false);

            activeFileName.dispatchEvent(new MouseEvent("mouseenter"));

            expect({
                highlightedClassPresent:
                    activeFileName.classList.contains("highlighted"),
                highlightedOverlayIndex: mocks.highlightedOverlayIndex,
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
            expect(mocks.highlightedOverlayIndex).toBeNull();
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

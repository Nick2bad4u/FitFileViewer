import { describe, expect, it, vi } from "vitest";
import { ensureMapDocumentListenersInstalled } from "../../../../../electron-app/utils/maps/core/mapDocumentListeners.js";

type MapDocumentListenerTestGlobal = typeof globalThis & {
    __ffvLayoutLayersControl?: () => void;
    __ffvMapDocumentListenersController?: AbortController;
    __ffvMapDocumentListenersInstalled?: boolean;
    __ffvMapTypeButton?: unknown;
    __ffvMapZoomDraggingRef?: { current: boolean };
};

function cleanupFixture(): void {
    const appGlobal = globalThis as MapDocumentListenerTestGlobal;
    appGlobal.__ffvMapDocumentListenersController?.abort();
    delete appGlobal.__ffvLayoutLayersControl;
    delete appGlobal.__ffvMapDocumentListenersController;
    delete appGlobal.__ffvMapDocumentListenersInstalled;
    delete appGlobal.__ffvMapTypeButton;
    delete appGlobal.__ffvMapZoomDraggingRef;
    document.body.replaceChildren();
}

function createExpandedLayersPanel(): HTMLElement {
    const layersPanel = document.createElement("div");
    layersPanel.className =
        "leaflet-control-layers leaflet-control-layers-expanded";
    layersPanel.style.zIndex = "1000";
    layersPanel.style.maxHeight = "30px";
    layersPanel.style.marginTop = "12px";
    layersPanel.style.overflowY = "auto";
    layersPanel.style.overflowX = "hidden";

    const layersList = document.createElement("div");
    layersList.className = "leaflet-control-layers-list";
    layersList.style.maxHeight = "20px";
    layersList.style.overflowY = "auto";
    layersPanel.append(layersList);
    document.body.append(layersPanel);

    return layersPanel;
}

function mouseDown(target: EventTarget): void {
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
}

describe(ensureMapDocumentListenersInstalled, () => {
    it("installs listeners once and collapses expanded layer panels on outside clicks", () => {
        expect.assertions(9);

        cleanupFixture();

        try {
            const appGlobal = globalThis as MapDocumentListenerTestGlobal;
            const addDocumentListenerSpy = vi.spyOn(
                document,
                "addEventListener"
            );
            const mapTypeButton = document.createElement("button");
            const outsideButton = document.createElement("button");
            appGlobal.__ffvMapTypeButton = mapTypeButton;
            document.body.append(mapTypeButton, outsideButton);
            const layersPanel = createExpandedLayersPanel();
            const layersList = layersPanel.querySelector<HTMLElement>(
                ".leaflet-control-layers-list"
            );

            ensureMapDocumentListenersInstalled();
            ensureMapDocumentListenersInstalled();

            expect(appGlobal).toMatchObject({
                __ffvMapDocumentListenersInstalled: true,
            });
            expect(
                appGlobal.__ffvMapDocumentListenersController
            ).toBeInstanceOf(AbortController);
            expect(addDocumentListenerSpy).toHaveBeenCalledTimes(3);

            mouseDown(mapTypeButton);

            expect([...layersPanel.classList]).toContain(
                "leaflet-control-layers-expanded"
            );

            mouseDown(outsideButton);

            expect([...layersPanel.classList]).not.toContain(
                "leaflet-control-layers-expanded"
            );
            expect(layersPanel.style.zIndex).toBe("");
            expect(layersPanel.style.maxHeight).toBe("");
            expect(layersPanel.style.overflowY).toBe("");
            expect(layersList?.style.maxHeight).toBe("");
        } finally {
            cleanupFixture();
            vi.restoreAllMocks();
        }
    });

    it("delegates layout on resize and resets the zoom dragging ref on interaction end", () => {
        expect.assertions(4);

        cleanupFixture();

        try {
            const appGlobal = globalThis as MapDocumentListenerTestGlobal;
            const layoutLayersControl = vi.fn<() => void>();
            const zoomDraggingRef = { current: true };
            appGlobal.__ffvLayoutLayersControl = layoutLayersControl;
            appGlobal.__ffvMapTypeButton = document.createElement("button");
            appGlobal.__ffvMapZoomDraggingRef = zoomDraggingRef;
            createExpandedLayersPanel();

            ensureMapDocumentListenersInstalled();

            window.dispatchEvent(new Event("resize"));

            expect(layoutLayersControl).toHaveBeenCalledOnce();

            document.dispatchEvent(new MouseEvent("mouseup"));

            expect(zoomDraggingRef).toMatchObject({ current: false });

            zoomDraggingRef.current = true;
            document.dispatchEvent(new Event("touchend"));

            expect(appGlobal.__ffvMapZoomDraggingRef).toStrictEqual({
                current: false,
            });
            expect(appGlobal).toMatchObject({
                __ffvMapDocumentListenersInstalled: true,
            });
        } finally {
            cleanupFixture();
        }
    });
});

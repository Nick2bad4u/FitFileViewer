import { describe, expect, it, vi } from "vitest";
import {
    ensureMapDocumentListenersInstalled,
    resetMapDocumentListenersForTests,
    setMapDocumentControlRefs,
} from "../../../../../electron-app/utils/maps/core/mapDocumentListeners.js";

function cleanupFixture(): void {
    resetMapDocumentListenersForTests();
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
        expect.assertions(7);

        cleanupFixture();

        try {
            const addDocumentListenerSpy = vi.spyOn(
                document,
                "addEventListener"
            );
            const mapTypeButton = document.createElement("button");
            const outsideButton = document.createElement("button");
            setMapDocumentControlRefs({ mapTypeButton });
            document.body.append(mapTypeButton, outsideButton);
            const layersPanel = createExpandedLayersPanel();
            const layersList = layersPanel.querySelector<HTMLElement>(
                ".leaflet-control-layers-list"
            );

            ensureMapDocumentListenersInstalled();
            ensureMapDocumentListenersInstalled();

            expect(addDocumentListenerSpy).toHaveBeenCalledTimes(3);

            mouseDown(mapTypeButton);

            expect(
                layersPanel.classList.contains(
                    "leaflet-control-layers-expanded"
                )
            ).toBe(true);

            mouseDown(outsideButton);

            expect(
                layersPanel.classList.contains(
                    "leaflet-control-layers-expanded"
                )
            ).toBe(false);
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
        expect.assertions(3);

        cleanupFixture();

        try {
            const layoutLayersControl = vi.fn<() => void>();
            const zoomDraggingRef = { current: true };
            setMapDocumentControlRefs({
                layoutLayersControl,
                mapTypeButton: document.createElement("button"),
                zoomDraggingRef,
            });
            createExpandedLayersPanel();

            ensureMapDocumentListenersInstalled();

            window.dispatchEvent(new Event("resize"));

            expect(layoutLayersControl).toHaveBeenCalledOnce();

            document.dispatchEvent(new MouseEvent("mouseup"));

            expect(zoomDraggingRef).toMatchObject({ current: false });

            zoomDraggingRef.current = true;
            document.dispatchEvent(new Event("touchend"));

            expect(zoomDraggingRef).toStrictEqual({ current: false });
        } finally {
            cleanupFixture();
        }
    });
});

import {
    getMapFullscreenControlRuntime,
    type MapFullscreenControlRuntime,
    type MapFullscreenControlTimer,
} from "./mapFullscreenControlRuntime.js";

interface LeafletMap {
    _container?: HTMLElement;
    invalidateSize: () => void;
}

function createFullscreenIcon(
    state: "enter" | "exit",
    runtime: MapFullscreenControlRuntime
): SVGSVGElement {
    const icon = runtime.createSvgElement("svg");
    icon.setAttribute("width", "22");
    icon.setAttribute("height", "22");
    icon.setAttribute("viewBox", "0 0 22 22");
    icon.setAttribute("fill", "none");

    const rects: Array<
        readonly [
            string,
            string,
            string,
            string,
        ]
    > =
        state === "enter"
            ? [
                  [
                      "3",
                      "3",
                      "5",
                      "2",
                  ],
                  [
                      "3",
                      "3",
                      "2",
                      "5",
                  ],
                  [
                      "14",
                      "3",
                      "5",
                      "2",
                  ],
                  [
                      "17",
                      "3",
                      "2",
                      "5",
                  ],
                  [
                      "3",
                      "17",
                      "5",
                      "2",
                  ],
                  [
                      "3",
                      "14",
                      "2",
                      "5",
                  ],
                  [
                      "14",
                      "17",
                      "5",
                      "2",
                  ],
                  [
                      "17",
                      "14",
                      "2",
                      "5",
                  ],
              ]
            : [
                  [
                      "7",
                      "3",
                      "2",
                      "5",
                  ],
                  [
                      "3",
                      "7",
                      "5",
                      "2",
                  ],
                  [
                      "14",
                      "3",
                      "2",
                      "5",
                  ],
                  [
                      "15",
                      "7",
                      "5",
                      "2",
                  ],
                  [
                      "3",
                      "14",
                      "5",
                      "2",
                  ],
                  [
                      "7",
                      "15",
                      "2",
                      "5",
                  ],
                  [
                      "15",
                      "15",
                      "2",
                      "5",
                  ],
                  [
                      "15",
                      "15",
                      "5",
                      "2",
                  ],
              ];

    for (const [
        x,
        y,
        width,
        height,
    ] of rects) {
        const rect = runtime.createSvgElement("rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        rect.setAttribute("rx", "1");
        rect.setAttribute("fill", "currentColor");
        icon.append(rect);
    }

    return icon;
}

function setFullscreenButtonIcon(
    button: HTMLButtonElement,
    state: "enter" | "exit",
    runtime: MapFullscreenControlRuntime
): void {
    button.replaceChildren(createFullscreenIcon(state, runtime));
}

/** Adds a custom fullscreen control to a Leaflet map. */
export function addFullscreenControl(
    map: LeafletMap,
    runtime: MapFullscreenControlRuntime = getMapFullscreenControlRuntime()
): void {
    const fullscreenControl = runtime.createElement("div");
    fullscreenControl.className =
        "custom-fullscreen-control leaflet-top leaflet-left";
    const bar = runtime.createElement("div");
    bar.className = "leaflet-bar custom-fullscreen-bar";
    const button = runtime.createElement("button");
    button.id = "fullscreen-btn";
    button.type = "button";
    button.title = "Toggle Fullscreen";
    button.setAttribute("aria-label", "Toggle Fullscreen");
    setFullscreenButtonIcon(button, "enter", runtime);
    bar.append(button);
    fullscreenControl.append(bar);

    const mapDiv = runtime.getMapContainer();
    if (!mapDiv) {
        console.warn("[mapFullscreenControl] Map container not found");
        return;
    }
    mapDiv.append(fullscreenControl);

    const listenerController = runtime.createAbortController();
    let invalidateSizeTimer: MapFullscreenControlTimer | null = null;
    const clearPendingInvalidateSize = (): void => {
        if (invalidateSizeTimer !== null) {
            runtime.clearTimeout(invalidateSizeTimer);
            invalidateSizeTimer = null;
        }
    };
    const scheduleInvalidateSize = (): void => {
        clearPendingInvalidateSize();
        invalidateSizeTimer = runtime.setTimeout(() => {
            invalidateSizeTimer = null;
            map.invalidateSize();
        }, 300);
    };
    button.addEventListener(
        "click",
        () => {
            const isFullscreen = mapDiv.classList.toggle("fullscreen");
            button.title = isFullscreen
                ? "Exit Fullscreen"
                : "Enter Fullscreen";
            setFullscreenButtonIcon(
                button,
                isFullscreen ? "exit" : "enter",
                runtime
            );
            if (isFullscreen) {
                if (mapDiv.requestFullscreen) {
                    void mapDiv.requestFullscreen();
                }
            } else {
                void runtime.exitFullscreen();
            }
            scheduleInvalidateSize();
        },
        { signal: listenerController.signal }
    );

    runtime.addDocumentFullscreenChangeListener(
        () => {
            const isNowFullscreen = runtime.isFullscreenElement(mapDiv);
            if (!isNowFullscreen) {
                mapDiv.classList.remove("fullscreen");
                button.title = "Enter Fullscreen";
                setFullscreenButtonIcon(button, "enter", runtime);
                // Only call invalidateSize if map is still valid and map container is in the DOM
                if (
                    map &&
                    map._container &&
                    runtime.documentBodyContains(map._container)
                ) {
                    scheduleInvalidateSize();
                }
            }
        },
        { signal: listenerController.signal }
    );

    // Remove old fullscreen button from map-controls if present
    const oldFullscreenBtn =
        runtime.getLegacyFullscreenButton();
    if (oldFullscreenBtn) {
        oldFullscreenBtn.remove();
    }
}

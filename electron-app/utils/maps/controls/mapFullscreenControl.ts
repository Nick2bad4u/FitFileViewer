import {
    getMapFullscreenControlRuntime,
    type MapFullscreenControlTimer,
} from "./mapFullscreenControlRuntime.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const mapFullscreenControlRuntime = getMapFullscreenControlRuntime();

interface LeafletMap {
    _container?: HTMLElement;
    invalidateSize: () => void;
}

function createFullscreenIcon(state: "enter" | "exit"): SVGSVGElement {
    const icon = document.createElementNS(SVG_NS, "svg");
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
        const rect = document.createElementNS(SVG_NS, "rect");
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
    state: "enter" | "exit"
): void {
    button.replaceChildren(createFullscreenIcon(state));
}

/** Adds a custom fullscreen control to a Leaflet map. */
export function addFullscreenControl(map: LeafletMap): void {
    const fullscreenControl = document.createElement("div");
    fullscreenControl.className =
        "custom-fullscreen-control leaflet-top leaflet-left";
    const bar = document.createElement("div");
    bar.className = "leaflet-bar custom-fullscreen-bar";
    const button = document.createElement("button");
    button.id = "fullscreen-btn";
    button.type = "button";
    button.title = "Toggle Fullscreen";
    button.setAttribute("aria-label", "Toggle Fullscreen");
    setFullscreenButtonIcon(button, "enter");
    bar.append(button);
    fullscreenControl.append(bar);

    const mapDiv = document.querySelector<HTMLElement>("#leaflet-map");
    if (!mapDiv) {
        console.warn("[mapFullscreenControl] Map container not found");
        return;
    }
    mapDiv.append(fullscreenControl);

    const listenerController =
        mapFullscreenControlRuntime.createAbortController();
    let invalidateSizeTimer: MapFullscreenControlTimer | null = null;
    const clearPendingInvalidateSize = (): void => {
        if (invalidateSizeTimer !== null) {
            mapFullscreenControlRuntime.clearTimeout(invalidateSizeTimer);
            invalidateSizeTimer = null;
        }
    };
    const scheduleInvalidateSize = (): void => {
        clearPendingInvalidateSize();
        invalidateSizeTimer = mapFullscreenControlRuntime.setTimeout(() => {
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
            setFullscreenButtonIcon(button, isFullscreen ? "exit" : "enter");
            if (isFullscreen) {
                if (mapDiv.requestFullscreen) {
                    void mapDiv.requestFullscreen();
                }
            } else if (document.exitFullscreen) {
                    void document.exitFullscreen();
                }
            scheduleInvalidateSize();
        },
        { signal: listenerController.signal }
    );

    mapFullscreenControlRuntime.addDocumentFullscreenChangeListener(
        () => {
            const isNowFullscreen = document.fullscreenElement === mapDiv;
            if (!isNowFullscreen) {
                mapDiv.classList.remove("fullscreen");
                button.title = "Enter Fullscreen";
                setFullscreenButtonIcon(button, "enter");
                // Only call invalidateSize if map is still valid and map container is in the DOM
                if (
                    map &&
                    map._container &&
                    document.body.contains(map._container)
                ) {
                    scheduleInvalidateSize();
                }
            }
        },
        { signal: listenerController.signal }
    );

    // Remove old fullscreen button from map-controls if present
    const oldFullscreenBtn = document.querySelector(
        "#map-controls #fullscreen-btn"
    );
    if (oldFullscreenBtn) {
        oldFullscreenBtn.remove();
    }
}

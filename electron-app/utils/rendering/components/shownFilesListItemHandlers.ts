import {
    getHighlightedOverlayIndex,
    setHighlightedOverlayIndex,
} from "../../maps/layers/mapDrawLaps.js";
import { resolveLeafletRuntime } from "../../maps/core/leafletRuntime.js";
import { getRegisteredLeafletMapInstance } from "../../maps/state/mapLeafletInstanceState.js";
import { getOverlayMapPolyline } from "../../maps/state/mapPolylineRegistryState.js";
import { removeLoadedFitFileAt } from "../../state/domain/loadedFitFilesState.js";
import { updateShownFilesList } from "./shownFilesListUpdater.js";
import { scheduleOverlayMapRender } from "./scheduleOverlayMapRender.js";
import {
    clearOverlayTooltipTimeout,
    setOverlayTooltipTimeout,
} from "./shownFilesListTooltipState.js";
import {
    getShownFilesListRuntime,
    type ShownFilesListTimerHandle,
} from "./shownFilesListRuntime.js";

const shownFilesListRuntime = getShownFilesListRuntime();

type OverlayListItem = HTMLLIElement & {
    _overlayListItemCleanup?: (() => void) | null;
    _tooltipRemover?: (() => void) | null;
};

type AttachOverlayListItemHandlersParams = {
    assignKeyboardFocus: (index: number) => void;
    fullPath: string;
    isDark: boolean;
    li: HTMLLIElement;
    overlayIndex: number;
    removeBtn: HTMLSpanElement;
    scheduleOverlayStateSync: () => void;
    showWarning: boolean;
};

type CircleMarkerLayer = {
    bringToFront?: () => void;
    options?: {
        color?: string;
    };
};

type CircleMarkerConstructor = new (...args: unknown[]) => CircleMarkerLayer;

type CircleMarkerLeafletRuntime = {
    CircleMarker?: CircleMarkerConstructor;
};

type OverlayPolyline = {
    _map?: {
        _layers?: Record<string, unknown>;
    };
    bringToFront?: () => void;
    getBounds?: () => unknown;
    getElement?: () => HTMLElement | null;
    options?: {
        color?: string;
    };
};

type OverlayMapInstance = {
    fitBounds: (
        bounds: unknown,
        options: {
            padding: [number, number];
        }
    ) => void;
};

function isCircleMarkerLeafletRuntime(
    value: unknown
): value is CircleMarkerLeafletRuntime {
    return (
        typeof value === "object" && value !== null && "CircleMarker" in value
    );
}

function removeOverlayFilenameTooltips(): void {
    const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
    for (const tooltip of tooltips) {
        tooltip.parentNode?.removeChild(tooltip);
    }
}

function scheduleTooltipCleanup(): ShownFilesListTimerHandle {
    return shownFilesListRuntime.setTimeout(() => {
        removeOverlayFilenameTooltips();
    }, 10);
}

function getOverlayPolyline(overlayIndex: number): OverlayPolyline | undefined {
    return getOverlayMapPolyline<OverlayPolyline>(overlayIndex);
}

function bringMatchingOverlayMarkersToFront(polyline: OverlayPolyline): void {
    const circleMarker = resolveLeafletRuntime(
        isCircleMarkerLeafletRuntime
    )?.CircleMarker;
    const layers = polyline._map?._layers;
    if (!circleMarker || !layers || !polyline.options) {
        return;
    }

    for (const layer of Object.values(layers)) {
        if (
            layer instanceof circleMarker &&
            layer.options &&
            layer.options.color === polyline.options.color &&
            layer.bringToFront
        ) {
            layer.bringToFront();
        }
    }
}

function focusOverlayOnMap(polyline: OverlayPolyline): void {
    const mapInstance = getRegisteredLeafletMapInstance<OverlayMapInstance>();
    if (polyline.getBounds && mapInstance) {
        mapInstance.fitBounds(polyline.getBounds(), {
            padding: [20, 20],
        });
    }
}

function highlightPolylineElement(
    polyline: OverlayPolyline,
    overlayIndex: number
): ShownFilesListTimerHandle | null {
    const polylineElement = polyline.getElement?.();
    if (!polylineElement) {
        return null;
    }

    const color = polyline.options?.color || "#1976d2";
    polylineElement.style.transition = "filter 0.2s";
    polylineElement.style.filter = `drop-shadow(0 0 16px ${color})`;
    return shownFilesListRuntime.setTimeout(() => {
        if (getHighlightedOverlayIndex() === overlayIndex) {
            polylineElement.style.filter = `drop-shadow(0 0 8px ${color})`;
        }
    }, 250);
}

function showOverlayTooltip({
    fullPath,
    initialEvent,
    isDark,
    li,
    overlayIndex,
    showWarning,
}: {
    fullPath: string;
    initialEvent: MouseEvent;
    isDark: boolean;
    li: OverlayListItem;
    overlayIndex: number;
    showWarning: boolean;
}): void {
    if (getHighlightedOverlayIndex() !== overlayIndex) {
        return;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "overlay-filename-tooltip";
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "9999";
    tooltip.style.pointerEvents = "none";
    tooltip.style.background = isDark ? "#23263a" : "#fff";
    tooltip.style.color = isDark ? "#fff" : "#222";
    tooltip.style.border = `1px solid ${isDark ? "#444" : "#bbb"}`;
    tooltip.style.borderRadius = "4px";
    tooltip.style.padding = "6px 10px";
    tooltip.style.fontSize = "0.95em";
    tooltip.style.boxShadow = "0 2px 8px #0003";
    tooltip.style.whiteSpace = "pre-line";

    // Avoid innerHTML because file paths are user-controlled.
    tooltip.textContent = `File: ${String(fullPath)}${showWarning ? "\n⚠️ This color may be hard to read in this theme." : ""}`;
    document.body.append(tooltip);

    const tooltipMovement = shownFilesListRuntime.createAbortController();
    const moveTooltip = (event: MouseEvent): void => {
        const pad = 12;
        const { height: viewportHeight, width: viewportWidth } =
            shownFilesListRuntime.getViewport();
        let x = event.clientX + pad;
        let y = event.clientY + pad;
        if (x + tooltip.offsetWidth > viewportWidth) {
            x = viewportWidth - tooltip.offsetWidth - pad;
        }
        if (y + tooltip.offsetHeight > viewportHeight) {
            y = viewportHeight - tooltip.offsetHeight - pad;
        }
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    };

    moveTooltip(initialEvent);
    shownFilesListRuntime.addMouseMoveListener(moveTooltip, {
        signal: tooltipMovement.signal,
    });
    li._tooltipRemover = () => {
        tooltipMovement.abort();
        tooltip.remove();
    };
}

/**
 * Attach overlay list item interactions for map overlay selection and removal.
 *
 * @param params - List item, remove button, overlay metadata, and callbacks.
 *
 * @returns Cleanup function for listeners attached by this call.
 */
export function attachOverlayListItemHandlers({
    assignKeyboardFocus,
    fullPath,
    isDark,
    li,
    overlayIndex,
    removeBtn,
    scheduleOverlayStateSync,
    showWarning,
}: AttachOverlayListItemHandlersParams): () => void {
    const listItem = li as OverlayListItem;
    const eventListeners = shownFilesListRuntime.createAbortController();
    const { signal } = eventListeners;
    const timers = new Set<ShownFilesListTimerHandle>();
    const trackTimer = (timer: ShownFilesListTimerHandle | null): void => {
        if (timer) {
            timers.add(timer);
        }
    };
    const scheduleManagedTooltipCleanup = (): void => {
        trackTimer(scheduleTooltipCleanup());
    };

    const cleanup = (): void => {
        for (const timer of timers) {
            shownFilesListRuntime.clearTimeout(timer);
        }
        timers.clear();
        clearOverlayTooltipTimeout();
        listItem._tooltipRemover?.();
        listItem._tooltipRemover = null;
        eventListeners.abort();
        listItem._overlayListItemCleanup = null;
    };
    listItem._overlayListItemCleanup?.();
    listItem._overlayListItemCleanup = cleanup;
    listItem._tooltipRemover = null;

    removeBtn.addEventListener(
        "mouseenter",
        (event) => {
            removeBtn.style.opacity = "1";
            event.stopPropagation();
        },
        { signal }
    );
    removeBtn.addEventListener(
        "mouseleave",
        (event) => {
            removeBtn.style.opacity = "0";
            event.stopPropagation();
        },
        { signal }
    );
    removeBtn.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            removeLoadedFitFileAt(
                overlayIndex,
                "shownFilesListItemHandlers.remove"
            );
            scheduleOverlayStateSync();
            const nextFocusIndex = overlayIndex > 1 ? overlayIndex - 1 : -1;
            assignKeyboardFocus(nextFocusIndex);
            scheduleOverlayMapRender("shownFilesListItemHandlers.remove");
            updateShownFilesList();
            scheduleManagedTooltipCleanup();
        },
        { signal }
    );

    listItem.addEventListener(
        "click",
        () => {
            assignKeyboardFocus(overlayIndex);
            setHighlightedOverlayIndex(overlayIndex);
            listItem._tooltipRemover?.();

            const polyline = getOverlayPolyline(overlayIndex);
            if (!polyline) {
                return;
            }

            polyline.bringToFront?.();
            bringMatchingOverlayMarkersToFront(polyline);
            trackTimer(highlightPolylineElement(polyline, overlayIndex));
            focusOverlayOnMap(polyline);
        },
        { signal }
    );

    listItem.addEventListener(
        "focus",
        () => {
            assignKeyboardFocus(overlayIndex);
        },
        { signal }
    );

    listItem.addEventListener(
        "mouseenter",
        (event) => {
            setHighlightedOverlayIndex(overlayIndex);
            removeBtn.style.opacity = "1";

            clearOverlayTooltipTimeout();
            removeOverlayFilenameTooltips();
            listItem._tooltipRemover?.();

            setOverlayTooltipTimeout(
                shownFilesListRuntime.setTimeout(() => {
                    showOverlayTooltip({
                        fullPath,
                        initialEvent: event,
                        isDark,
                        li: listItem,
                        overlayIndex,
                        showWarning,
                    });
                }, 350)
            );
        },
        { signal }
    );
    listItem.addEventListener(
        "mouseleave",
        () => {
            setHighlightedOverlayIndex(null);
            removeBtn.style.opacity = "0";
            clearOverlayTooltipTimeout();
            listItem._tooltipRemover?.();
            scheduleManagedTooltipCleanup();
        },
        { signal }
    );

    return cleanup;
}

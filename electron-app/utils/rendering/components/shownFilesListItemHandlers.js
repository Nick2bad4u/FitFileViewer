/**
 * Attach overlay list item interactions (click, focus, tooltip, remove).
 *
 * @param {{
 *     li: HTMLLIElement;
 *     removeBtn: HTMLSpanElement;
 *     overlayIndex: number;
 *     fullPath: string;
 *     isDark: boolean;
 *     showWarning: boolean;
 *     assignKeyboardFocus: (index: number) => void;
 *     scheduleOverlayStateSync: () => void;
 * }} params
 */
export function attachOverlayListItemHandlers({
    li,
    removeBtn,
    overlayIndex,
    fullPath,
    isDark,
    showWarning,
    assignKeyboardFocus,
    scheduleOverlayStateSync,
}) {
    removeBtn.addEventListener("mouseenter", (ev) => {
        removeBtn.style.opacity = "1";
        ev.stopPropagation();
    });
    removeBtn.addEventListener("mouseleave", (ev) => {
        removeBtn.style.opacity = "0";
        ev.stopPropagation();
    });
    removeBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (globalThis.loadedFitFiles) {
            globalThis.loadedFitFiles.splice(overlayIndex, 1);
            scheduleOverlayStateSync();
            const nextFocusIndex = overlayIndex > 1 ? overlayIndex - 1 : -1;
            assignKeyboardFocus(nextFocusIndex);
            if (globalThis.renderMap) {
                globalThis.renderMap();
            }
            if (/** @type {any} */ (globalThis).updateShownFilesList) {
                /** @type {any} */ globalThis.updateShownFilesList();
            }
            setTimeout(() => {
                const tooltips = document.querySelectorAll(
                    ".overlay-filename-tooltip"
                );
                for (const t of tooltips)
                    t.parentNode && t.parentNode.removeChild(t);
            }, 10);
        }
    });

    li.addEventListener("click", () => {
        assignKeyboardFocus(overlayIndex);
        // @ts-expect-error - _highlightedOverlayIdx exists on window
        globalThis._highlightedOverlayIdx = overlayIndex;
        // @ts-expect-error - updateOverlayHighlights exists on window
        if (globalThis.updateOverlayHighlights) {
            globalThis.updateOverlayHighlights();
        }
        // @ts-expect-error - Custom property on HTMLElement
        if (li._tooltipRemover) {
            li._tooltipRemover();
        }
        // Bring the overlay polyline to front and flash highlight
        // @ts-expect-error - _overlayPolylines exists on window
        if (
            globalThis._overlayPolylines &&
            globalThis._overlayPolylines[overlayIndex]
        ) {
            // @ts-expect-error - _overlayPolylines exists on window
            const polyline = globalThis._overlayPolylines[overlayIndex];
            if (polyline.bringToFront) {
                polyline.bringToFront();
            }
            // --- Also bring overlay markers to front ---
            if (
                globalThis.L &&
                globalThis.L.CircleMarker &&
                polyline._map &&
                polyline._map._layers
            ) {
                for (const layer of Object.values(polyline._map._layers)) {
                    if (
                        layer instanceof globalThis.L.CircleMarker &&
                        layer.options &&
                        polyline.options &&
                        layer.options.color === polyline.options.color &&
                        layer.bringToFront
                    ) {
                        layer.bringToFront();
                    }
                }
            }
            const polyElem = polyline.getElement && polyline.getElement();
            if (polyElem) {
                polyElem.style.transition = "filter 0.2s";
                polyElem.style.filter = `drop-shadow(0 0 16px ${polyline.options.color || "#1976d2"})`;
                setTimeout(() => {
                    // @ts-expect-error - _highlightedOverlayIdx exists on window
                    if (globalThis._highlightedOverlayIdx === overlayIndex) {
                        polyElem.style.filter = `drop-shadow(0 0 8px ${polyline.options.color || "#1976d2"})`;
                    }
                }, 250);
                // Center and fit map to this overlay
                // @ts-expect-error - _leafletMapInstance exists on window
                if (polyline.getBounds && globalThis._leafletMapInstance) {
                    // @ts-expect-error - _leafletMapInstance exists on window
                    globalThis._leafletMapInstance.fitBounds(
                        polyline.getBounds(),
                        {
                            padding: [20, 20],
                        }
                    );
                }
            }
        }
    });

    li.addEventListener("focus", () => {
        assignKeyboardFocus(overlayIndex);
    });

    // @ts-expect-error - Custom property on HTMLElement
    li._tooltipTimeout = null;
    // @ts-expect-error - Custom property on HTMLElement
    li._tooltipRemover = null;
    /** @param {MouseEvent} e */
    li.addEventListener("mouseenter", (e) => {
        // @ts-expect-error - _highlightedOverlayIdx exists on window
        globalThis._highlightedOverlayIdx = overlayIndex;
        // @ts-expect-error - updateOverlayHighlights exists on window
        if (globalThis.updateOverlayHighlights) {
            globalThis.updateOverlayHighlights();
        }
        removeBtn.style.opacity = "1";

        // Tooltip delay and singleton logic
        // @ts-expect-error - _overlayTooltipTimeout exists on window
        if (globalThis._overlayTooltipTimeout) {
            clearTimeout(globalThis._overlayTooltipTimeout);
        }
        // Remove any existing tooltip immediately
        const oldTooltips = document.querySelectorAll(
            ".overlay-filename-tooltip"
        );
        for (const t of oldTooltips)
            t.parentNode && t.parentNode.removeChild(t);
        // @ts-expect-error - Custom property on HTMLElement
        if (li._tooltipRemover) {
            li._tooltipRemover();
        }

        // @ts-expect-error - _overlayTooltipTimeout exists on window
        globalThis._overlayTooltipTimeout = setTimeout(() => {
            // Only show if still hovered
            // @ts-expect-error - _highlightedOverlayIdx exists on window
            if (globalThis._highlightedOverlayIdx !== overlayIndex) {
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

            // Avoid innerHTML (XSS risk) and avoid nested createElement() calls because
            // some unit tests mock document.createElement to always return the tooltip.
            tooltip.textContent = `File: ${String(fullPath)}${showWarning ? "\n⚠️ This color may be hard to read in this theme." : ""}`;
            document.body.append(tooltip);
            /** @param {MouseEvent} evt */
            const moveTooltip = (evt) => {
                const pad = 12;
                let x = evt.clientX + pad,
                    y = evt.clientY + pad;
                if (x + tooltip.offsetWidth > window.innerWidth) {
                    x = window.innerWidth - tooltip.offsetWidth - pad;
                }
                if (y + tooltip.offsetHeight > window.innerHeight) {
                    y = window.innerHeight - tooltip.offsetHeight - pad;
                }
                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y}px`;
            };
            moveTooltip(e);
            globalThis.addEventListener("mousemove", moveTooltip);
            // @ts-expect-error - Custom property on HTMLElement
            li._tooltipRemover = () => {
                globalThis.removeEventListener("mousemove", moveTooltip);
                if (tooltip.parentNode) {
                    tooltip.remove();
                }
            };
        }, 350);
    });
    li.addEventListener("mouseleave", () => {
        // @ts-expect-error - _highlightedOverlayIdx exists on window
        globalThis._highlightedOverlayIdx = null;
        // @ts-expect-error - updateOverlayHighlights exists on window
        if (globalThis.updateOverlayHighlights) {
            globalThis.updateOverlayHighlights();
        }
        removeBtn.style.opacity = "0";
        // @ts-expect-error - _overlayTooltipTimeout exists on window
        if (globalThis._overlayTooltipTimeout) {
            // @ts-expect-error - _overlayTooltipTimeout exists on window
            clearTimeout(globalThis._overlayTooltipTimeout);
            // @ts-expect-error - _overlayTooltipTimeout exists on window
            globalThis._overlayTooltipTimeout = null;
        }
        // @ts-expect-error - Custom property on HTMLElement
        if (li._tooltipRemover) {
            li._tooltipRemover();
        }
        // Remove any lingering tooltips from the DOM
        setTimeout(() => {
            const tooltips = document.querySelectorAll(
                ".overlay-filename-tooltip"
            );
            for (const t of tooltips)
                t.parentNode && t.parentNode.removeChild(t);
        }, 10);
    });
}

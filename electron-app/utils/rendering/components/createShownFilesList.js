import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";
import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { setState } from "../../state/core/stateManager.js";

/**
 * @typedef {Object} LoadedFitFile
 * @property {any} data
 * @property {string} [filePath]
 */

/**
 * Creates a list container for showing loaded FIT files on the map
 * @returns {HTMLElement} The files list container
 */
export function createShownFilesList() {
    const container = document.createElement("div");
    container.className = "shown-files-list map-overlays-panel";
    container.tabIndex = 0;
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Map overlay files");
    container.setAttribute("aria-disabled", "true");
    container.innerHTML =
        '<b>Extra Files shown on map:</b><ul id="shown-files-ul" class="shown-files-list-items"></ul>';
    container.style.margin = "8px 0";
    container.style.padding = "6px 10px";
    container.style.maxWidth = "fit-content";
    container.style.overflow = "auto";
    container.style.maxHeight = "fit-content";
    container.style.borderRadius = "6px";
    container.style.fontSize = "0.95em";
    container.style.border = "1px solid #cbd5f5";
    container.style.boxShadow = "0 4px 10px rgba(8, 15, 35, 0.18)";
    container.style.backdropFilter = "blur(6px)";
    const listElement = container.querySelector("#shown-files-ul");
    if (listElement) {
        listElement.setAttribute("role", "listbox");
    }

    const applyThemeStyles = () => {
        try {
            const theme = getThemeColors();
            const surface = theme?.surface || "#1f2937";
            const border = theme?.border || "#334155";
            const text = theme?.text || theme?.textPrimary || "#f8fafc";
            container.style.background = surface;
            container.style.border = `1px solid ${border}`;
            container.style.color = text;
            container.setAttribute("aria-disabled", "false");
        } catch (error) {
            console.warn("[createShownFilesList] Failed to apply theme colors", error);
        }
    };

    applyThemeStyles();
    document.body.addEventListener("themechange", applyThemeStyles);

    let pendingStateSync = false;
    const syncOverlayState = () => {
        try {
            const files = Array.isArray(globalThis.loadedFitFiles) ? [...globalThis.loadedFitFiles] : [];
            setState("globalData.loadedFitFiles", files, { source: "createShownFilesList" });
        } catch (error) {
            console.error("[createShownFilesList] Failed to sync overlay state:", error);
        }
    };

    const scheduleOverlayStateSync = () => {
        if (pendingStateSync) {
            return;
        }
        pendingStateSync = true;
        queueMicrotask(() => {
            pendingStateSync = false;
            syncOverlayState();
        });
    };

    let keyboardFocusIndex = -1;
    const assignKeyboardFocus = (value) => {
        keyboardFocusIndex = value;
    };
    const getOverlayItems = () =>
        Array.from(container.querySelectorAll("li[data-overlay-index]"));

    const focusOverlayItem = (index, options) => {
        const opts = options ?? { scrollIntoView: true };
        const items = getOverlayItems();
        if (index < 0 || index >= items.length) {
            return;
        }
        keyboardFocusIndex = index;
        for (const [idx, item] of items.entries()) {
            if (idx === index) {
                item.classList.add("overlay-item-focused");
                item.focus({ preventScroll: !opts.scrollIntoView });
                item.setAttribute("aria-selected", "true");
            } else {
                item.classList.remove("overlay-item-focused");
                item.setAttribute("aria-selected", "false");
            }
        }
    };

    container.addEventListener("focus", (event) => {
        if (event.target === container) {
            const items = getOverlayItems();
            if (items.length === 0) {
                return;
            }
            const targetIndex = keyboardFocusIndex >= 0 && keyboardFocusIndex < items.length ? keyboardFocusIndex : 0;
            focusOverlayItem(targetIndex, { scrollIntoView: false });
        }
    });

    container.addEventListener("keydown", (event) => {
        const items = getOverlayItems();
        if (items.length === 0) {
            return;
        }

        const clampIndex = (value) => {
            if (value < 0) {
                return items.length - 1;
            }
            if (value >= items.length) {
                return 0;
            }
            return value;
        };

        const { key } = event;

        if (key === "ArrowDown" || key === "ArrowRight") {
            event.preventDefault();
            keyboardFocusIndex = clampIndex(keyboardFocusIndex + 1);
            focusOverlayItem(keyboardFocusIndex);
            return;
        }

        if (key === "ArrowUp" || key === "ArrowLeft") {
            event.preventDefault();
            keyboardFocusIndex = clampIndex(keyboardFocusIndex - 1);
            focusOverlayItem(keyboardFocusIndex);
            return;
        }

        if (key === "Home") {
            event.preventDefault();
            keyboardFocusIndex = 0;
            focusOverlayItem(keyboardFocusIndex);
            return;
        }

        if (key === "End") {
            event.preventDefault();
            keyboardFocusIndex = items.length - 1;
            focusOverlayItem(keyboardFocusIndex);
            return;
        }

        if (key === "Enter" || key === " ") {
            if (keyboardFocusIndex >= 0 && keyboardFocusIndex < items.length) {
                event.preventDefault();
                items[keyboardFocusIndex].click();
            }
            return;
        }

        if (
            (key === "Backspace" || key === "Delete") &&
            keyboardFocusIndex >= 0 &&
            keyboardFocusIndex < items.length
        ) {
            event.preventDefault();
            const removeButton = items[keyboardFocusIndex].querySelector(".overlay-remove-btn");
            if (removeButton instanceof HTMLElement) {
                removeButton.click();
            }
        }
    });

    // Helper: Check color contrast (returns true if color is accessible on the given background)
    /**
     * @param {string} fg - Foreground color
     * @param {string} bg - Background color
     * @param {string} [filter=""] - CSS filter string
     * @returns {boolean} True if color is accessible
     */
    function isColorAccessible(fg, bg, filter = "") {
        // Fg, bg: CSS color strings (e.g., '#fff', 'rgb(30,34,40)')
        // Filter: CSS filter string (e.g., 'invert(0.92) ...')
        /**
         * @param {string} hex - Hex color string
         * @returns {number[]} RGB array
         */
        function hexToRgb(hex) {
            hex = hex.replace("#", "");
            if (hex.length === 3) {
                hex = hex
                    .split("")
                    .map(/** @param {string} x */(x) => x + x)
                    .join("");
            }
            const num = Number.parseInt(hex, 16);
            return [num >> 16, (num >> 8) & 255, num & 255];
        }
        /**
         * @param {string} str - Color string to parse
         * @returns {number[]} RGB array
         */
        function parseColor(str) {
            if (str.startsWith("#")) {
                return hexToRgb(str);
            }
            const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m && m[1] && m[2] && m[3]) {
                return [Number.parseInt(m[1]), Number.parseInt(m[2]), Number.parseInt(m[3])];
            }
            return [255, 255, 255];
        }
        // If a filter is provided, simulate the filtered color using a temp element
        let fgColor = fg;
        if (filter) {
            const temp = document.createElement("span");
            temp.style.color = fg;
            temp.style.filter = filter;
            temp.style.display = "none";
            document.body.append(temp);
            fgColor = getComputedStyle(temp).color;
            temp.remove();
        }
        const [r1, g1, b1] = parseColor(fgColor),
            [r2, g2, b2] = parseColor(bg);
        // Relative luminance
        /**
         * @param {number} r - Red component
         * @param {number} g - Green component
         * @param {number} b - Blue component
         * @returns {number} Luminance value
         */
        function lum(r, g, b) {
            const components = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.039_28 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * (components[0] || 0) + 0.7152 * (components[1] || 0) + 0.0722 * (components[2] || 0);
        }
        const L1 = lum(r1 || 0, g1 || 0, b1 || 0) + 0.05,
            L2 = lum(r2 || 0, g2 || 0, b2 || 0) + 0.05,
            ratio = L1 > L2 ? L1 / L2 : L2 / L1;
        return ratio >= 3.5; // WCAG AA for UI text
    }

    // @ts-expect-error - Adding property to window
    globalThis.updateShownFilesList = function () {
        const ul = container.querySelector("#shown-files-ul");
        if (!ul) {
            return;
        }
        ul.innerHTML = "";
        let anyOverlays = false;
        // Remove main file clickable entry (undo previous change)
        // Only show overlays in the list
        if (globalThis.loadedFitFiles && globalThis.loadedFitFiles.length > 1) {
            for (const [idx, f] of globalThis.loadedFitFiles.entries()) {
                if (idx === 0) {
                    continue;
                } // Skip main file
                anyOverlays = true;
                const li = document.createElement("li");
                li.style.position = "relative";
                const displayLabel = f.filePath || "(unknown)";
                li.textContent = `File: ${displayLabel}`;
                const overlayIndex = idx;
                li.dataset.overlayIndex = String(overlayIndex);
                li.setAttribute("role", "option");
                li.tabIndex = -1;
                const colorIdx = overlayIndex % chartOverlayColorPalette.length,
                    color = chartOverlayColorPalette[colorIdx] || "#1976d2",
                    isDark = document.body.classList.contains("theme-dark");
                let filter = "";
                if (isDark) {
                    filter = "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)";
                    li.style.filter = filter;
                }
                const bg = isDark ? "rgb(30,34,40)" : "#fff";
                li.style.color = color;
                li.style.filter = filter;
                li.style.textShadow = isDark
                    ? "0 0 2px #000, 0 0 1px #000, 0 0 1px #000"
                    : "0 0 2px #fff, 0 0 1px #fff, 0 0 1px #fff";
                // Improved: check accessibility using the filtered color as actually rendered
                let filteredColor = color;
                if (filter) {
                    const temp = document.createElement("span");
                    temp.style.color = color;
                    temp.style.filter = filter;
                    temp.style.display = "none";
                    document.body.append(temp);
                    filteredColor = getComputedStyle(temp).color;
                    temp.remove();
                }
                const fullPath = f.originalPath || displayLabel,
                    showWarning = !isColorAccessible(filteredColor || color, bg);
                li.style.cursor = "pointer";
                li.setAttribute("aria-label", `Overlay ${fullPath}`);
                li.setAttribute("aria-selected", "false");

                // Add remove (X) button, only visible on hover
                const removeBtn = document.createElement("span");
                removeBtn.className = "overlay-remove-btn";
                removeBtn.textContent = "×";
                removeBtn.title = "Remove this overlay";
                removeBtn.style.position = "absolute";
                removeBtn.style.right = "6px";
                removeBtn.style.top = "2px";
                removeBtn.style.fontWeight = "bold";
                removeBtn.style.fontSize = "1.1em";
                removeBtn.style.color = isDark ? "#ff5252" : "#e53935";
                removeBtn.style.background = "transparent";
                removeBtn.style.border = "none";
                removeBtn.style.cursor = "pointer";
                removeBtn.style.opacity = "0";
                removeBtn.style.transition = "opacity 0.15s";
                removeBtn.setAttribute("aria-label", `Remove overlay ${fullPath}`);
                removeBtn.style.display = "inline-block";
                removeBtn.style.lineHeight = "1";
                removeBtn.setAttribute("role", "button");
                removeBtn.setAttribute("tabindex", "-1");
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
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            for (const t of tooltips) t.parentNode && t.parentNode.removeChild(t);
                        }, 10);
                    }
                });
                li.append(removeBtn);

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
                    if (globalThis._overlayPolylines && globalThis._overlayPolylines[overlayIndex]) {
                        // @ts-expect-error - _overlayPolylines exists on window
                        const polyline = globalThis._overlayPolylines[overlayIndex];
                        if (polyline.bringToFront) {
                            polyline.bringToFront();
                        }
                        // --- Also bring overlay markers to front ---
                        if (globalThis.L && globalThis.L.CircleMarker && polyline._map && polyline._map._layers) {
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
                                globalThis._leafletMapInstance.fitBounds(polyline.getBounds(), {
                                    padding: [20, 20],
                                });
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
                    const oldTooltips = document.querySelectorAll(".overlay-filename-tooltip");
                    for (const t of oldTooltips) t.parentNode && t.parentNode.removeChild(t);
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
                        let html = `<b>File:</b> ${fullPath}`;
                        if (showWarning) {
                            html +=
                                '<br><span style="color:#eab308;">⚠️ This color may be hard to read in this theme.</span>';
                        }
                        tooltip.innerHTML = html;
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
                        const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                        for (const t of tooltips) t.parentNode && t.parentNode.removeChild(t);
                    }, 10);
                });
                ul.append(li);
            }

            const overlayItems = getOverlayItems();
            container.setAttribute("aria-disabled", overlayItems.length === 0 ? "true" : "false");
            if (container.matches(":focus-within") && overlayItems.length > 0) {
                const targetIndex =
                    keyboardFocusIndex >= 0 && keyboardFocusIndex < overlayItems.length ? keyboardFocusIndex : 0;
                focusOverlayItem(targetIndex, { scrollIntoView: false });
            } else if (overlayItems.length === 0) {
                assignKeyboardFocus(-1);
            } else if (keyboardFocusIndex >= overlayItems.length) {
                assignKeyboardFocus(overlayItems.length - 1);
            }

            // Add Clear All button if overlays exist
            if (anyOverlays && ul.parentNode && !ul.parentNode.querySelector(".overlay-clear-all-btn")) {
                const clearAll = document.createElement("button");
                clearAll.type = "button";
                clearAll.textContent = "Clear All";
                clearAll.className = "overlay-clear-all-btn";
                clearAll.style.margin = "8px 0 0 0";
                clearAll.style.padding = "3px 12px";
                clearAll.style.fontSize = "0.95em";
                clearAll.style.background = "#e53935";
                clearAll.style.color = "#fff";
                clearAll.style.border = "none";
                clearAll.style.borderRadius = "4px";
                clearAll.style.cursor = "pointer";
                clearAll.style.float = "right";
                clearAll.title = "Remove all overlays from the map";
                clearAll.setAttribute("aria-label", "Remove all overlays from the map");
                /** @param {MouseEvent} ev */
                clearAll.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    if (globalThis.loadedFitFiles) {
                        globalThis.loadedFitFiles.splice(1);
                        assignKeyboardFocus(-1);
                        scheduleOverlayStateSync();
                        if (globalThis.renderMap) {
                            globalThis.renderMap();
                        }
                        if (/** @type {any} */ (globalThis).updateShownFilesList) {
                            /** @type {any} */ globalThis.updateShownFilesList();
                        }
                        // Remove any lingering tooltips from the DOM after overlays are cleared
                        setTimeout(() => {
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            for (const t of tooltips) t.parentNode && t.parentNode.removeChild(t);
                        }, 10);
                    }
                });
                if (ul.parentNode) {
                    ul.parentNode.append(clearAll);
                }
            }
            container.style.display = "";
        } else {
            container.style.display = "none";
        }
    };
    // Hide initially if no overlays
    if (!(globalThis.loadedFitFiles && globalThis.loadedFitFiles.length > 1)) {
        container.style.display = "none";
    }

    return container;
}

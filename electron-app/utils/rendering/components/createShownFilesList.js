import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";

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
    container.className = "shown-files-list";
    container.style.margin = "8px 0";
    container.style.fontSize = "0.95em";
    container.style.border = "1px solid #bbb";
    container.style.borderRadius = "6px";
    container.style.padding = "6px 10px";
    container.style.maxWidth = "350px";
    container.style.overflow = "auto";
    container.style.maxHeight = "80px";
    container.innerHTML =
        '<b>Extra Files shown on map:</b><ul id="shown-files-ul" style="margin:0; padding-left:18px;"></ul>';

    function applyTheme() {
        const themeColors = getThemeColors();
        container.style.background = `${themeColors.surface || "#ffffff"}ec`; // Add transparency
        container.style.color = themeColors.text || "#000000";
        container.style.border = `1px solid ${themeColors.border || "#cccccc"}`;
    }
    applyTheme();
    document.body.addEventListener("themechange", applyTheme);

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
                    .map(/** @param {string} x */ (x) => x + x)
                    .join("");
            }
            const num = parseInt(hex, 16);
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
                return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
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
            document.body.appendChild(temp);
            fgColor = getComputedStyle(temp).color;
            document.body.removeChild(temp);
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
                return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * (components[0] || 0) + 0.7152 * (components[1] || 0) + 0.0722 * (components[2] || 0);
        }
        const L1 = lum(r1 || 0, g1 || 0, b1 || 0) + 0.05,
            L2 = lum(r2 || 0, g2 || 0, b2 || 0) + 0.05,
            ratio = L1 > L2 ? L1 / L2 : L2 / L1;
        return ratio >= 3.5; // WCAG AA for UI text
    }

    // @ts-expect-error - Adding property to window
    window.updateShownFilesList = function () {
        const ul = container.querySelector("#shown-files-ul");
        if (!ul) {
            return;
        }
        ul.innerHTML = "";
        let anyOverlays = false;
        // Remove main file clickable entry (undo previous change)
        // Only show overlays in the list
        if (window.loadedFitFiles && window.loadedFitFiles.length > 1) {
            window.loadedFitFiles.forEach(
                /** @param {LoadedFitFile} f */ /** @param {number} idx */ (f, idx) => {
                    if (idx === 0) {
                        return;
                    } // Skip main file
                    anyOverlays = true;
                    const li = document.createElement("li");
                    li.style.position = "relative";
                    li.textContent = `File: ${f.filePath || "(unknown)"}`;
                    const colorIdx = idx % chartOverlayColorPalette.length,
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
                        document.body.appendChild(temp);
                        filteredColor = getComputedStyle(temp).color;
                        document.body.removeChild(temp);
                    }
                    const showWarning = !isColorAccessible(filteredColor || color, bg),
                        fullPath = f.filePath || "(unknown)";
                    li.style.cursor = "pointer";

                    // Add remove (X) button, only visible on hover
                    const removeBtn = document.createElement("span");
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
                    removeBtn.onmouseenter = (ev) => {
                        removeBtn.style.opacity = "1";
                        ev.stopPropagation();
                    };
                    removeBtn.onmouseleave = (ev) => {
                        removeBtn.style.opacity = "0";
                        ev.stopPropagation();
                    };
                    removeBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        if (window.loadedFitFiles) {
                            window.loadedFitFiles.splice(idx, 1);
                            if (window.renderMap) {
                                window.renderMap();
                            }
                            if (/** @type {any} */ (window).updateShownFilesList) {
                                /** @type {any} */ window.updateShownFilesList();
                            }
                            // Remove any lingering tooltips from the DOM after overlays are cleared
                            setTimeout(() => {
                                const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                                tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                            }, 10);
                        }
                    };
                    li.appendChild(removeBtn);

                    li.onclick = () => {
                        // @ts-expect-error - _highlightedOverlayIdx exists on window
                        window._highlightedOverlayIdx = idx;
                        // @ts-expect-error - updateOverlayHighlights exists on window
                        if (window.updateOverlayHighlights) {
                            window.updateOverlayHighlights();
                        }
                        // @ts-expect-error - Custom property on HTMLElement
                        if (li._tooltipRemover) {
                            li._tooltipRemover();
                        }
                        // Bring the overlay polyline to front and flash highlight
                        // @ts-expect-error - _overlayPolylines exists on window
                        if (window._overlayPolylines && window._overlayPolylines[idx]) {
                            // @ts-expect-error - _overlayPolylines exists on window
                            const polyline = window._overlayPolylines[idx];
                            if (polyline.bringToFront) {
                                polyline.bringToFront();
                            }
                            // --- Also bring overlay markers to front ---
                            if (window.L && window.L.CircleMarker && polyline._map && polyline._map._layers) {
                                Object.values(polyline._map._layers).forEach((layer) => {
                                    if (
                                        layer instanceof window.L.CircleMarker &&
                                        layer.options &&
                                        polyline.options &&
                                        layer.options.color === polyline.options.color
                                    ) {
                                        if (layer.bringToFront) {
                                            layer.bringToFront();
                                        }
                                    }
                                });
                            }
                            const polyElem = polyline.getElement && polyline.getElement();
                            if (polyElem) {
                                polyElem.style.transition = "filter 0.2s";
                                polyElem.style.filter = `drop-shadow(0 0 16px ${polyline.options.color || "#1976d2"})`;
                                setTimeout(() => {
                                    // @ts-expect-error - _highlightedOverlayIdx exists on window
                                    if (window._highlightedOverlayIdx === idx) {
                                        polyElem.style.filter = `drop-shadow(0 0 8px ${polyline.options.color || "#1976d2"})`;
                                    }
                                }, 250);
                                // Center and fit map to this overlay
                                // @ts-expect-error - _leafletMapInstance exists on window
                                if (polyline.getBounds && window._leafletMapInstance) {
                                    // @ts-expect-error - _leafletMapInstance exists on window
                                    window._leafletMapInstance.fitBounds(polyline.getBounds(), {
                                        padding: [20, 20],
                                    });
                                }
                            }
                        }
                    };

                    // @ts-expect-error - Custom property on HTMLElement
                    li._tooltipTimeout = null;
                    // @ts-expect-error - Custom property on HTMLElement
                    li._tooltipRemover = null;
                    /** @param {MouseEvent} e */
                    li.onmouseenter = (e) => {
                        // @ts-expect-error - _highlightedOverlayIdx exists on window
                        window._highlightedOverlayIdx = idx;
                        // @ts-expect-error - updateOverlayHighlights exists on window
                        if (window.updateOverlayHighlights) {
                            window.updateOverlayHighlights();
                        }
                        removeBtn.style.opacity = "1";

                        // Tooltip delay and singleton logic
                        // @ts-expect-error - _overlayTooltipTimeout exists on window
                        if (window._overlayTooltipTimeout) {
                            clearTimeout(window._overlayTooltipTimeout);
                        }
                        // Remove any existing tooltip immediately
                        const oldTooltips = document.querySelectorAll(".overlay-filename-tooltip");
                        oldTooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                        // @ts-expect-error - Custom property on HTMLElement
                        if (li._tooltipRemover) {
                            li._tooltipRemover();
                        }

                        // @ts-expect-error - _overlayTooltipTimeout exists on window
                        window._overlayTooltipTimeout = setTimeout(() => {
                            // Only show if still hovered
                            // @ts-expect-error - _highlightedOverlayIdx exists on window
                            if (window._highlightedOverlayIdx !== idx) {
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
                            document.body.appendChild(tooltip);
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
                            window.addEventListener("mousemove", moveTooltip);
                            // @ts-expect-error - Custom property on HTMLElement
                            li._tooltipRemover = () => {
                                window.removeEventListener("mousemove", moveTooltip);
                                if (tooltip.parentNode) {
                                    tooltip.parentNode.removeChild(tooltip);
                                }
                            };
                        }, 350);
                    };
                    li.onmouseleave = () => {
                        // @ts-expect-error - _highlightedOverlayIdx exists on window
                        window._highlightedOverlayIdx = null;
                        // @ts-expect-error - updateOverlayHighlights exists on window
                        if (window.updateOverlayHighlights) {
                            window.updateOverlayHighlights();
                        }
                        removeBtn.style.opacity = "0";
                        // @ts-expect-error - _overlayTooltipTimeout exists on window
                        if (window._overlayTooltipTimeout) {
                            // @ts-expect-error - _overlayTooltipTimeout exists on window
                            clearTimeout(window._overlayTooltipTimeout);
                            // @ts-expect-error - _overlayTooltipTimeout exists on window
                            window._overlayTooltipTimeout = null;
                        }
                        // @ts-expect-error - Custom property on HTMLElement
                        if (li._tooltipRemover) {
                            li._tooltipRemover();
                        }
                        // Remove any lingering tooltips from the DOM
                        setTimeout(() => {
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                        }, 10);
                    };
                    ul.appendChild(li);
                }
            );
            // Add Clear All button if overlays exist
            if (anyOverlays && ul.parentNode && !ul.parentNode.querySelector(".overlay-clear-all-btn")) {
                const clearAll = document.createElement("button");
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
                /** @param {MouseEvent} ev */
                clearAll.onclick = (ev) => {
                    ev.stopPropagation();
                    if (window.loadedFitFiles) {
                        window.loadedFitFiles.splice(1);
                        if (window.renderMap) {
                            window.renderMap();
                        }
                        if (/** @type {any} */ (window).updateShownFilesList) {
                            /** @type {any} */ window.updateShownFilesList();
                        }
                        // Remove any lingering tooltips from the DOM after overlays are cleared
                        setTimeout(() => {
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                        }, 10);
                    }
                };
                if (ul.parentNode) {
                    ul.parentNode.appendChild(clearAll);
                }
            }
            container.style.display = "";
        } else {
            container.style.display = "none";
        }
    };
    // Hide initially if no overlays
    if (!(window.loadedFitFiles && window.loadedFitFiles.length > 1)) {
        container.style.display = "none";
    }

    return container;
}

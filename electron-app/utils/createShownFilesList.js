import { getThemeColors } from "./getThemeColors.js";
import { chartOverlayColorPalette } from "./chartOverlayColorPalette.js";

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
        container.style.background = themeColors.surface + "ec"; // Add transparency
        container.style.color = themeColors.text;
        container.style.border = `1px solid ${themeColors.border}`;
    }
    applyTheme();
    document.body.addEventListener("themechange", applyTheme);

    // Helper: Check color contrast (returns true if color is accessible on the given background)
    function isColorAccessible(fg, bg, filter = "") {
        // fg, bg: CSS color strings (e.g., '#fff', 'rgb(30,34,40)')
        // filter: CSS filter string (e.g., 'invert(0.92) ...')
        function hexToRgb(hex) {
            hex = hex.replace("#", "");
            if (hex.length === 3)
                hex = hex
                    .split("")
                    .map((x) => x + x)
                    .join("");
            const num = parseInt(hex, 16);
            return [num >> 16, (num >> 8) & 255, num & 255];
        }
        function parseColor(str) {
            if (str.startsWith("#")) return hexToRgb(str);
            const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
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
        const [r1, g1, b1] = parseColor(fgColor);
        const [r2, g2, b2] = parseColor(bg);
        // Relative luminance
        function lum(r, g, b) {
            [r, g, b] = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722;
        }
        const L1 = lum(r1, g1, b1) + 0.05,
            L2 = lum(r2, g2, b2) + 0.05;
        const ratio = L1 > L2 ? L1 / L2 : L2 / L1;
        return ratio >= 3.5; // WCAG AA for UI text
    }

    window.updateShownFilesList = function () {
        const ul = container.querySelector("#shown-files-ul");
        ul.innerHTML = "";
        let anyOverlays = false;
        // Remove main file clickable entry (undo previous change)
        // Only show overlays in the list
        if (window.loadedFitFiles && window.loadedFitFiles.length > 1) {
            window.loadedFitFiles.forEach((f, idx) => {
                if (idx === 0) return; // skip main file
                anyOverlays = true;
                const li = document.createElement("li");
                li.style.position = "relative";
                li.textContent = "File: " + (f.filePath || "(unknown)");
                const colorIdx = idx % chartOverlayColorPalette.length;
                const color = chartOverlayColorPalette[colorIdx];
                const isDark = document.body.classList.contains("theme-dark");
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
                let showWarning = !isColorAccessible(filteredColor, bg);
                let fullPath = f.filePath || "(unknown)";
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
                        if (window.renderMap) window.renderMap();
                        if (window.updateShownFilesList) window.updateShownFilesList();
                        // Remove any lingering tooltips from the DOM after overlays are cleared
                        setTimeout(function () {
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                        }, 10);
                    }
                };
                li.appendChild(removeBtn);

                li.onclick = () => {
                    window._highlightedOverlayIdx = idx;
                    if (window.updateOverlayHighlights) window.updateOverlayHighlights();
                    if (li._tooltipRemover) li._tooltipRemover();
                    // Bring the overlay polyline to front and flash highlight
                    if (window._overlayPolylines && window._overlayPolylines[idx]) {
                        const polyline = window._overlayPolylines[idx];
                        if (polyline.bringToFront) polyline.bringToFront();
                        // --- Also bring overlay markers to front ---
                        if (window.L && window.L.CircleMarker && polyline._map && polyline._map._layers) {
                            Object.values(polyline._map._layers).forEach((layer) => {
                                if (
                                    layer instanceof window.L.CircleMarker &&
                                    layer.options &&
                                    polyline.options &&
                                    layer.options.color === polyline.options.color
                                ) {
                                    if (layer.bringToFront) layer.bringToFront();
                                }
                            });
                        }
                        const polyElem = polyline.getElement && polyline.getElement();
                        if (polyElem) {
                            polyElem.style.transition = "filter 0.2s";
                            polyElem.style.filter =
                                "drop-shadow(0 0 16px " + (polyline.options.color || "#1976d2") + ")";
                            setTimeout(function () {
                                if (window._highlightedOverlayIdx === idx) {
                                    polyElem.style.filter =
                                        "drop-shadow(0 0 8px " + (polyline.options.color || "#1976d2") + ")";
                                }
                            }, 250);
                            // Center and fit map to this overlay
                            if (polyline.getBounds && window._leafletMapInstance) {
                                window._leafletMapInstance.fitBounds(polyline.getBounds(), {
                                    padding: [20, 20],
                                });
                            }
                        }
                    }
                };

                li._tooltipTimeout = null;
                li._tooltipRemover = null;
                li.onmouseenter = (e) => {
                    window._highlightedOverlayIdx = idx;
                    if (window.updateOverlayHighlights) window.updateOverlayHighlights();
                    removeBtn.style.opacity = "1";

                    // Tooltip delay and singleton logic
                    if (window._overlayTooltipTimeout) clearTimeout(window._overlayTooltipTimeout);
                    // Remove any existing tooltip immediately
                    const oldTooltips = document.querySelectorAll(".overlay-filename-tooltip");
                    oldTooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                    if (li._tooltipRemover) li._tooltipRemover();

                    window._overlayTooltipTimeout = setTimeout(function () {
                        // Only show if still hovered
                        if (window._highlightedOverlayIdx !== idx) return;
                        let tooltip = document.createElement("div");
                        tooltip.className = "overlay-filename-tooltip";
                        tooltip.style.position = "fixed";
                        tooltip.style.zIndex = 9999;
                        tooltip.style.pointerEvents = "none";
                        tooltip.style.background = isDark ? "#23263a" : "#fff";
                        tooltip.style.color = isDark ? "#fff" : "#222";
                        tooltip.style.border = "1px solid " + (isDark ? "#444" : "#bbb");
                        tooltip.style.borderRadius = "4px";
                        tooltip.style.padding = "6px 10px";
                        tooltip.style.fontSize = "0.95em";
                        tooltip.style.boxShadow = "0 2px 8px #0003";
                        let html = "<b>File:</b> " + fullPath;
                        if (showWarning) {
                            html +=
                                '<br><span style="color:#eab308;">⚠️ This color may be hard to read in this theme.</span>';
                        }
                        tooltip.innerHTML = html;
                        document.body.appendChild(tooltip);
                        const moveTooltip = (evt) => {
                            const pad = 12;
                            let x = evt.clientX + pad;
                            let y = evt.clientY + pad;
                            if (x + tooltip.offsetWidth > window.innerWidth)
                                x = window.innerWidth - tooltip.offsetWidth - pad;
                            if (y + tooltip.offsetHeight > window.innerHeight)
                                y = window.innerHeight - tooltip.offsetHeight - pad;
                            tooltip.style.left = x + "px";
                            tooltip.style.top = y + "px";
                        };
                        moveTooltip(e);
                        window.addEventListener("mousemove", moveTooltip);
                        li._tooltipRemover = () => {
                            window.removeEventListener("mousemove", moveTooltip);
                            if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
                        };
                    }, 350);
                };
                li.onmouseleave = () => {
                    window._highlightedOverlayIdx = null;
                    if (window.updateOverlayHighlights) window.updateOverlayHighlights();
                    removeBtn.style.opacity = "0";
                    if (window._overlayTooltipTimeout) {
                        clearTimeout(window._overlayTooltipTimeout);
                        window._overlayTooltipTimeout = null;
                    }
                    if (li._tooltipRemover) li._tooltipRemover();
                    // Remove any lingering tooltips from the DOM
                    setTimeout(function () {
                        const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                        tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                    }, 10);
                };
                ul.appendChild(li);
            });
            // Add Clear All button if overlays exist
            if (anyOverlays && !ul.parentNode.querySelector(".overlay-clear-all-btn")) {
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
                clearAll.onclick = (ev) => {
                    ev.stopPropagation();
                    if (window.loadedFitFiles) {
                        window.loadedFitFiles.splice(1);
                        if (window.renderMap) window.renderMap();
                        if (window.updateShownFilesList) window.updateShownFilesList();
                        // Remove any lingering tooltips from the DOM after overlays are cleared
                        setTimeout(function () {
                            const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
                            tooltips.forEach((t) => t.parentNode && t.parentNode.removeChild(t));
                        }, 10);
                    }
                };
                ul.parentNode.appendChild(clearAll);
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

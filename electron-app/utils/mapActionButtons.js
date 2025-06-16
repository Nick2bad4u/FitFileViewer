/**
 * @fileoverview Map action buttons utilities for FitFileViewer
 *
 * This module provides functions to create interactive map controls and manage FIT file overlays.
 * Features include:
 * - Print/export buttons for map visualization
 * - Elevation profile modal with theme-aware styling
 * - FIT file overlay management with drag-and-drop support
 * - Marker count selector for performance optimization
 * - Loading overlays with progress tracking
 * - Theme-integrated UI components with proper error handling
 *
 * All components support dynamic theming and include comprehensive error handling
 * with user notifications. The module follows modern ES6+ patterns with proper
 * JSDoc documentation and modular architecture.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { showNotification } from "./showNotification.js";
import { getThemeColors } from "./getThemeColors.js";
import { LoadingOverlay } from "./LoadingOverlay.js";
import { overlayColorPalette } from "./overlayColorPalette.js";

// Export loading functions for backward compatibility
export function showLoadingOverlay(progressText, fileName = "") {
    LoadingOverlay.show(progressText, fileName);
}

export function hideLoadingOverlay() {
    LoadingOverlay.hide();
}

/**
 * Internal function to handle file selection for overlay
 * @private
 */
export function _openFileSelector() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".fit";
    input.multiple = true;
    input.style.display = "none";

    input.addEventListener("change", async (e) => {
        try {
            if (!e.target.files?.length) return;

            const files = Array.from(e.target.files);
            await _loadOverlayFiles(files);
        } catch (error) {
            console.error("[MapActions] File loading failed:", error);
            showNotification("Failed to load FIT files", "error");
        } finally {
            LoadingOverlay.hide();
        }
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

/**
 * Internal function to load a single FIT file as overlay
 * @param {File} file - File to load
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Load result
 * @private
 */
async function _loadSingleOverlayFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async function (event) {
            try {
                const arrayBuffer = event.target.result;

                if (!arrayBuffer || !window.electronAPI?.decodeFitFile) {
                    resolve({ success: false, error: "No file data or decoder not available" });
                    return;
                }

                const fitData = await window.electronAPI.decodeFitFile(arrayBuffer);

                if (!fitData || fitData.error) {
                    resolve({ success: false, error: fitData?.error || "Failed to parse FIT file" });
                    return;
                }

                // Validate that file has location data
                const validLocationCount = Array.isArray(fitData.recordMesgs)
                    ? fitData.recordMesgs.filter(
                          (r) => typeof r.positionLat === "number" && typeof r.positionLong === "number"
                      ).length
                    : 0;

                if (
                    !Array.isArray(fitData.recordMesgs) ||
                    fitData.recordMesgs.length === 0 ||
                    validLocationCount === 0
                ) {
                    resolve({ success: false, error: "No valid location data found in file" });
                    return;
                }

                resolve({ success: true, data: fitData });
            } catch (error) {
                console.error("[mapActionButtons] Error processing file:", file.name, error);
                resolve({ success: false, error: error.message || "Unknown error processing file" });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, error: "Failed to read file" });
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Internal function to load FIT files as overlays
 * @param {File[]} files - Array of files to load
 * @private
 */
async function _loadOverlayFiles(files) {
    try {
        LoadingOverlay.show(`Loading 0 / ${files.length} files...`);

        let loaded = 0;
        const invalidFiles = [];

        // Initialize loaded files array if needed
        if (!window.loadedFitFiles || window.loadedFitFiles.length === 0) {
            if (window.globalData && window.globalData.recordMesgs) {
                window.loadedFitFiles = [
                    {
                        data: window.globalData,
                        filePath: window.globalData?.cachedFilePath,
                    },
                ];
            } else {
                window.loadedFitFiles = [];
            }
        }

        // Process each file
        for (const file of files) {
            try {
                LoadingOverlay.show(`Loading ${loaded + 1} / ${files.length} files...`, file.name);

                const result = await _loadSingleOverlayFile(file);
                if (result.success) {
                    if (!window.loadedFitFiles.some((f) => f.filePath?.toLowerCase() === file.name.toLowerCase())) {
                        window.loadedFitFiles.push({
                            data: result.data,
                            filePath: file.name,
                        });

                        // Update UI
                        if (window.renderMap) window.renderMap();
                        if (window.updateShownFilesList) window.updateShownFilesList();
                    } else {
                        showNotification("File already loaded", `${file.name} is already shown on the map`, "warning");
                    }
                } else {
                    invalidFiles.push(file.name);
                    showNotification("File load failed", `Failed to load ${file.name}: ${result.error}`, "error");
                }

                loaded++;
            } catch (error) {
                console.error("[mapActionButtons] Error loading overlay file:", file.name, error);
                invalidFiles.push(file.name);
                loaded++;
            }
        }

        LoadingOverlay.hide();

        // Show summary notification
        if (invalidFiles.length > 0) {
            const message = `${files.length - invalidFiles.length} files loaded successfully. ${invalidFiles.length} files failed.`;
            showNotification("Load complete with errors", message, "warning");
        } else {
            showNotification("Load complete", `Successfully loaded ${files.length} files`, "success");
        }
    } catch (error) {
        console.error("[mapActionButtons] Error in _loadOverlayFiles:", error);
        LoadingOverlay.hide();
        showNotification("Load failed", "Failed to load overlay files", "error");
    }
}

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
                const colorIdx = idx % overlayColorPalette.length;
                const color = overlayColorPalette[colorIdx];
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
                        setTimeout(() => {
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
                            setTimeout(() => {
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

                    window._overlayTooltipTimeout = setTimeout(() => {
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
                    setTimeout(() => {
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
                        setTimeout(() => {
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

/**
 * Gets the filename for a loaded FIT file overlay by index
 * @param {number} idx - Index of the overlay file
 * @returns {string} The filename or empty string if not found
 */
export function getOverlayFileName(idx) {
    if (window.loadedFitFiles && window.loadedFitFiles[idx] && window.loadedFitFiles[idx].filePath) {
        return window.loadedFitFiles[idx].filePath;
    }
    return "";
}

/**
 * Creates a marker count selector for controlling data point density on the map
 * @param {Function} onChange - Callback function when marker count changes
 * @returns {HTMLElement} The configured marker count selector container
 */
export function createMarkerCountSelector(onChange) {
    try {
        const container = document.createElement("div");
        container.className = "map-action-btn marker-count-container";

        const label = document.createElement("label");
        label.textContent = "Data Points:";
        label.setAttribute("for", "marker-count-select");
        label.className = "marker-count-label";

        const select = document.createElement("select");
        select.id = "marker-count-select";
        select.className = "marker-count-select";

        const options = [10, 25, 50, 100, 200, 500, 1000, "All"];
        options.forEach((val) => {
            const opt = document.createElement("option");
            opt.value = val === "All" ? "all" : val;
            opt.textContent = val;
            select.appendChild(opt);
        });

        // Set initial value from global or default
        const validOptions = [10, 25, 50, 100, 200, 500, 1000, "all"];
        let initial;

        if (window.mapMarkerCount === undefined) {
            window.mapMarkerCount = 50;
            initial = 50;
        } else if (window.mapMarkerCount === 0) {
            initial = "all";
        } else if (validOptions.includes(window.mapMarkerCount)) {
            initial = window.mapMarkerCount;
        } else {
            initial = 50; // Fallback to default if unsupported value
            window.mapMarkerCount = 50;
        }
        select.value = initial;

        // Handle selection changes
        select.addEventListener("change", function () {
            try {
                const val = select.value;
                if (val === "all") {
                    window.mapMarkerCount = 0;
                } else {
                    window.mapMarkerCount = parseInt(val, 10);
                }

                if (typeof onChange === "function") {
                    onChange(window.mapMarkerCount);
                }

                if (window.updateShownFilesList) {
                    window.updateShownFilesList();
                }
            } catch (error) {
                console.error("[mapActionButtons] Error in marker count change:", error);
                showNotification("Error", "Failed to update marker count", "error");
            }
        });

        // Add mouse wheel support for changing marker count
        select.addEventListener(
            "wheel",
            (e) => {
                try {
                    e.preventDefault();
                    e.stopPropagation();

                    const options = Array.from(select.options);
                    let idx = select.selectedIndex;

                    if (e.deltaY > 0 && idx < options.length - 1) {
                        select.selectedIndex = idx + 1;
                        select.dispatchEvent(
                            new Event("change", { bubbles: false, cancelable: true, composed: false })
                        );
                    } else if (e.deltaY < 0 && idx > 0) {
                        select.selectedIndex = idx - 1;
                        select.dispatchEvent(
                            new Event("change", { bubbles: false, cancelable: true, composed: false })
                        );
                    }
                } catch (error) {
                    console.error("[mapActionButtons] Error in wheel event:", error);
                }
            },
            { passive: false }
        );

        // Apply theme styling
        const applyTheme = () => {
            try {
                const themeColors = getThemeColors();
                container.style.background = themeColors.backgroundAlt;
                container.style.color = themeColors.text;
                container.style.border = `1px solid ${themeColors.border}`;

                label.style.color = themeColors.text;
                select.style.background = themeColors.backgroundAlt;
                select.style.color = themeColors.text;
                select.style.border = `1px solid ${themeColors.border}`;
            } catch (error) {
                console.error("[mapActionButtons] Error applying theme to marker selector:", error);
            }
        };

        applyTheme();

        // Listen for theme changes
        if (window.addEventListener) {
            window.addEventListener("themeChanged", applyTheme);
        }

        container.appendChild(label);
        container.appendChild(select);

        return container;
    } catch (error) {
        console.error("[mapActionButtons] Error creating marker count selector:", error);
        showNotification("Error", "Failed to create marker count selector", "error");
        return document.createElement("div"); // Return empty div as fallback
    }
}

/**
 * Sets up interactive functionality for the active file name element
 * Makes the file name clickable to center map on the main file
 * @private
 */
function setupActiveFileNameMapActions() {
    try {
        const activeFileName = document.getElementById("activeFileName");
        if (!activeFileName) {
            console.log("[mapActionButtons] #activeFileName not found in DOM");
            return;
        }

        // Configure element appearance and behavior
        activeFileName.style.cursor = "pointer";
        activeFileName.title = "Click to center map on main file";

        // Apply theme styling
        const themeColors = getThemeColors();
        activeFileName.style.transition = "color 0.2s ease";

        // Remove any previous listeners to avoid stacking
        activeFileName.onclick = null;
        activeFileName.onmouseenter = null;
        activeFileName.onmouseleave = null;

        // Click handler - center map on main file
        activeFileName.onclick = () => {
            try {
                console.log("[mapActionButtons] Active file name clicked");

                // Switch to map tab if not active
                const mapTabBtn = document.querySelector('[data-tab="map"]');
                if (mapTabBtn && !mapTabBtn.classList.contains("active")) {
                    console.log("[mapActionButtons] Switching to map tab");
                    mapTabBtn.click();
                }

                // Center on main file with a slight delay to ensure tab switch completes
                setTimeout(() => {
                    _centerMapOnMainFile();
                }, 100);
            } catch (error) {
                console.error("[mapActionButtons] Error in active filename click:", error);
                showNotification("Error", "Failed to center map on file", "error");
            }
        };

        // Hover handlers for visual feedback
        activeFileName.onmouseenter = () => {
            try {
                console.log("[mapActionButtons] Active file name hover");
                activeFileName.style.color = themeColors.primary;
                window._highlightedOverlayIdx = 0;
                if (window.updateOverlayHighlights) {
                    window.updateOverlayHighlights();
                }
            } catch (error) {
                console.error("[mapActionButtons] Error in mouseenter:", error);
            }
        };

        activeFileName.onmouseleave = () => {
            try {
                console.log("[mapActionButtons] Active file name unhover");
                activeFileName.style.color = themeColors.text;
                window._highlightedOverlayIdx = null;
                if (window.updateOverlayHighlights) {
                    window.updateOverlayHighlights();
                }
            } catch (error) {
                console.error("[mapActionButtons] Error in mouseleave:", error);
            }
        };
    } catch (error) {
        console.error("[mapActionButtons] Error setting up active filename actions:", error);
    }
}

/**
 * Centers the map on the main file's track
 * @private
 */
function _centerMapOnMainFile() {
    try {
        const idx = 0; // Main file is always index 0
        console.log("[mapActionButtons] Attempting to zoom to main polyline");

        if (!window._overlayPolylines || !window._overlayPolylines[idx]) {
            console.warn("[mapActionButtons] No main polyline found");
            showNotification("Info", "No main track to center on", "info");
            return;
        }

        const polyline = window._overlayPolylines[idx];
        window._highlightedOverlayIdx = idx;

        if (window.updateOverlayHighlights) {
            window.updateOverlayHighlights();
        }

        // Bring polyline to front
        if (polyline.bringToFront) {
            polyline.bringToFront();
        }

        // Bring associated markers to front
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

        // Add visual highlighting effect
        const polyElem = polyline.getElement && polyline.getElement();
        if (polyElem) {
            polyElem.style.transition = "filter 0.2s";
            polyElem.style.filter = `drop-shadow(0 0 16px ${polyline.options.color || "#1976d2"})`;

            setTimeout(() => {
                if (window._highlightedOverlayIdx === idx) {
                    polyElem.style.filter = `drop-shadow(0 0 8px ${polyline.options.color || "#1976d2"})`;
                }
            }, 250);
        }

        // Fit map bounds to main polyline only
        if (window._leafletMapInstance) {
            let bounds = null;

            if (
                window._mainPolylineOriginalBounds &&
                window._mainPolylineOriginalBounds.isValid &&
                window._mainPolylineOriginalBounds.isValid()
            ) {
                bounds = window._mainPolylineOriginalBounds;
                console.log("[mapActionButtons] Using stored main polyline bounds");
            } else if (polyline.getBounds) {
                bounds = polyline.getBounds();
                console.warn("[mapActionButtons] Using polyline getBounds as fallback");
            }

            if (bounds && bounds.isValid && bounds.isValid()) {
                console.log("[mapActionButtons] Fitting map to bounds");
                window._leafletMapInstance.fitBounds(bounds, { padding: [20, 20] });

                setTimeout(() => {
                    try {
                        const center = window._leafletMapInstance.getCenter();
                        const zoom = window._leafletMapInstance.getZoom();
                        console.log(`[mapActionButtons] Map centered at ${center.lat}, ${center.lng}, zoom: ${zoom}`);
                    } catch (err) {
                        console.warn("[mapActionButtons] Error getting map state after centering:", err);
                    }
                }, 200);
            } else {
                console.warn("[mapActionButtons] No valid bounds found for main polyline");
                showNotification("Warning", "Could not determine track bounds", "warning");
            }
        } else {
            console.warn("[mapActionButtons] Leaflet map instance not available");
            showNotification("Warning", "Map not ready for centering", "warning");
        }
    } catch (error) {
        console.error("[mapActionButtons] Error centering map on main file:", error);
        showNotification("Error", "Failed to center map on main file", "error");
    }
}

// Initialize active filename functionality with mutation observer
(function initializeActiveFileName() {
    try {
        const targetElement = document.getElementById("activeFileName");
        const parent = targetElement?.parentNode;

        if (!parent) {
            console.log("[mapActionButtons] Active filename parent not found for observer");
            // Try again after DOM loads
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", initializeActiveFileName);
            }
            return;
        }

        // Set up mutation observer to handle dynamic content changes
        const observer = new MutationObserver(() => {
            console.log("[mapActionButtons] Active filename element changed, reapplying setup");
            setupActiveFileNameMapActions();
        });

        observer.observe(parent, { childList: true, subtree: false });

        // Initial setup
        setupActiveFileNameMapActions();
    } catch (error) {
        console.error("[mapActionButtons] Error initializing active filename:", error);
    }
})();

// Export setup function for external use
window._setupActiveFileNameMapActions = setupActiveFileNameMapActions;

// Patch updateShownFilesList to always maintain active filename functionality
(function patchUpdateShownFilesList() {
    try {
        const origUpdateShownFilesList = window.updateShownFilesList;

        window.updateShownFilesList = function () {
            try {
                if (origUpdateShownFilesList) {
                    origUpdateShownFilesList.apply(this, arguments);
                }
                console.log("[mapActionButtons] Files list updated, reapplying active filename setup");
                setupActiveFileNameMapActions();
            } catch (error) {
                console.error("[mapActionButtons] Error in patched updateShownFilesList:", error);
            }
        };
    } catch (error) {
        console.error("[mapActionButtons] Error patching updateShownFilesList:", error);
    }
})();

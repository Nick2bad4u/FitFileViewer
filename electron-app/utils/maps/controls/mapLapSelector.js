import { getThemeColors } from "../../charts/theming/getThemeColors.js";

/**
 * @typedef {Object} LapMesg
 * @property {number} [zone] - Zone identifier
 * @property {string} [label] - Zone label
 * @property {number} [time] - Time value
 */

/**
 * @typedef {Object} GlobalData
 * @property {LapMesg[]} lapMesgs - Array of lap messages
 */

/**
 * @typedef {Object} WindowWithGlobalData
 * @property {GlobalData} globalData - Global data object
 */

/**
 * @typedef {Object} ThemeColors
 * @property {string} surface - Surface color
 * @property {string} primary - Primary color
 * @property {string} accent - Accent color
 * @property {string} text - Text color
 * @property {string} textSecondary - Secondary text color
 */

/**
 * @typedef {Object} MapDrawLapsFunction
 * @property {Function} call - Function to draw laps on map
 */

// Lap selection UI and logic for Leaflet map
// Exports: addLapSelector(map, container, mapDrawLaps)

/**
 * Adds lap selector control to map
 * @param {any} _map - Leaflet map instance (unused in current implementation)
 * @param {HTMLElement} container - Container element for the control
 * @param {Function} mapDrawLaps - Function to draw laps on map
 * @returns {void}
 */
export function addLapSelector(_map, container, mapDrawLaps) {
    const windowWithData = /** @type {any} */ (globalThis);
    if (
        !windowWithData.globalData ||
        !Array.isArray(windowWithData.globalData.lapMesgs) ||
        windowWithData.globalData.lapMesgs.length === 0
    ) {
        return;
    }

    const lapControl = document.createElement("div");
    lapControl.className = "custom-lap-control-container leaflet-bottom leaflet-left";
    // Import theme colors for consistent theming
    const themeColors = /** @type {any} */ (getThemeColors());

    lapControl.innerHTML = `
        <div class="custom-lap-control leaflet-bar">
            <button id="multi-lap-toggle" class="multi-lap-toggle" type="button" title="Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.">
                <!-- Lap icon: stylized stopwatch/lap circle (matches single-lap icon above) -->
                <svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
                    <circle cx="10" cy="11" r="6" fill="${themeColors.surface}" stroke="${themeColors.primary
        }" stroke-width="1.5"/>
                    <rect x="8.5" y="3" width="3" height="2.5" rx="1" fill="${themeColors.primary}" />
                    <line x1="10" y1="11" x2="10" y2="7.5" stroke="${themeColors.primary
        }" stroke-width="1.3" stroke-linecap="round"/>
                    <line x1="10" y1="11" x2="13" y2="11" stroke="${themeColors.accent || themeColors.primary
        }" stroke-width="1.3" stroke-linecap="round"/>
                    <circle cx="10" cy="11" r="1.2" fill="${themeColors.accent || themeColors.primary}" />
                </svg>
                <span style="color:${themeColors.text};margin-left:4px;">Laps:</span>
            </button>
            <button id="deselect-all-btn" class="deselect-all-btn" title="Deselect all laps (Esc)">
                <svg class="icon" viewBox="0 0 16 16" width="16" height="16">
                    <circle cx="8" cy="8" r="7" fill="none" stroke="${themeColors.textSecondary || "#888"
        }" stroke-width="2"/>
                    <line x1="5" y1="5" x2="11" y2="11" stroke="${themeColors.textSecondary || "#888"
        }" stroke-width="2"/>
                    <line x1="11" y1="5" x2="5" y2="11" stroke="${themeColors.textSecondary || "#888"
        }" stroke-width="2"/>
                </svg>
            </button>
            <label for="lap-select" class="lap-label" style="color:${themeColors.text};">Lap:</label>
            <select id="lap-select">
                <option value="all">All</option>
                ${windowWithData.globalData.lapMesgs.map((/** @type {any} */ _lap, /** @type {number} */ i) => `<option value="${i}">Lap ${i + 1}</option>`).join("")}
            </select>
        </div>
    `;
    lapControl.addEventListener("mousedown", (/** @type {Event} */ e) => e.stopPropagation());
    lapControl.addEventListener("touchstart", (/** @type {Event} */ e) => e.stopPropagation(), { passive: true });
    container.append(lapControl);

    const deselectAllBtn = /** @type {HTMLButtonElement} */ (lapControl.querySelector("#deselect-all-btn")),
        lapSelect = /** @type {HTMLSelectElement} */ (lapControl.querySelector("#lap-select")),
        multiLapToggle = /** @type {HTMLButtonElement} */ (lapControl.querySelector("#multi-lap-toggle"));
    let multiSelectMode = false;

    /**
     * Get multi-lap icon based on state
     * @param {boolean} on - Whether multi-lap mode is active
     * @returns {string} HTML string for icon
     */
    function getMultiLapIcon(on) {
        // Bar chart style icon for lap selectors, theme-aware
        if (on) {
            // Active: multi-lap mode icon (bar chart style, accent color)
            return `<svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <rect x="2" y="11" width="2.5" height="5" rx="1" fill="${themeColors.accent || themeColors.primary
                }" stroke="${themeColors.accent || themeColors.primary}" stroke-width="1"/>
            <rect x="6" y="7" width="2.5" height="9" rx="1" fill="${themeColors.accent || themeColors.primary
                }" stroke="${themeColors.accent || themeColors.primary}" stroke-width="1"/>
            <rect x="10" y="4" width="2.5" height="12" rx="1" fill="${themeColors.accent || themeColors.primary
                }" stroke="${themeColors.accent || themeColors.primary}" stroke-width="1"/>
            <rect x="14" y="9" width="2.5" height="7" rx="1" fill="${themeColors.accent || themeColors.primary
                }" stroke="${themeColors.accent || themeColors.primary}" stroke-width="1"/>
            </svg>`;
        }
        // Inactive: single-lap mode icon (stopwatch/lap circle, primary color)
        return `<svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <circle cx="10" cy="11" r="6" fill="${themeColors.surface}" stroke="${themeColors.primary
            }" stroke-width="1.5"/>
            <rect x="8.5" y="3" width="3" height="2.5" rx="1" fill="${themeColors.primary}" />
            <line x1="10" y1="11" x2="10" y2="7.5" stroke="${themeColors.primary
            }" stroke-width="1.3" stroke-linecap="round"/>
            <line x1="10" y1="11" x2="13" y2="11" stroke="${themeColors.accent || themeColors.primary
            }" stroke-width="1.3" stroke-linecap="round"/>
            <circle cx="10" cy="11" r="1.2" fill="${themeColors.accent || themeColors.primary}" />
            </svg>`;
    }

    /**
     * Set multi-select mode state
     * @param {boolean} on - Whether to enable multi-select mode
     * @returns {void}
     */
    function setMultiSelectMode(on) {
        multiSelectMode = on;
        if (multiSelectMode) {
            lapSelect.multiple = true;
            lapSelect.size = Math.min(windowWithData.globalData.lapMesgs.length + 1, 6);
            multiLapToggle?.classList.add("active");
            lapControl.classList.add("multi-select-active");
            if (deselectAllBtn) {
                deselectAllBtn.style.display = "";
            }
            multiLapToggle.innerHTML = getMultiLapIcon(true);
            multiLapToggle.title = "Return to single-lap mode";
        } else {
            lapSelect.multiple = false;
            lapSelect.size = 1;
            multiLapToggle?.classList.remove("active");
            lapControl.classList.remove("multi-select-active");
            if (deselectAllBtn) {
                deselectAllBtn.style.display = "none";
            }
            multiLapToggle.innerHTML = getMultiLapIcon(false);
            multiLapToggle.title =
                "Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.";
            // If more than one selected, reset to 'all'
            if (
                lapSelect.selectedOptions.length > 1 ||
                (lapSelect.selectedOptions.length === 1 && lapSelect.selectedOptions[0]?.value !== "all")
            ) {
                lapSelect.selectedIndex = 0;
                lapSelect.dispatchEvent(new Event("change"));
            }
        }
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener("click", () => {
            for (const opt of lapSelect.options) {
                opt.selected = false;
            }
            lapSelect.selectedIndex = 0;
            lapSelect.dispatchEvent(new Event("change"));
        });
    }

    multiLapToggle.addEventListener("click", () => setMultiSelectMode(!multiSelectMode));

    lapSelect.addEventListener("change", () => {
        let selected = [...lapSelect.selectedOptions].map((/** @type {HTMLOptionElement} */ opt) => opt.value);
        if (multiSelectMode) {
            if (selected.includes("all") && selected.length > 1) {
                for (const opt of lapSelect.options) {
                    opt.selected = opt.value === "all";
                }
                selected = ["all"];
            }
            if (selected.length === 0) {
                lapSelect.selectedIndex = 0;
                selected = ["all"];
            }
            if (selected.length === 1 && selected[0] === "all") {
                mapDrawLaps("all");
            } else {
                mapDrawLaps(selected);
            }
        } else if (selected[0] === "all") {
            mapDrawLaps("all");
        } else {
            mapDrawLaps([selected[0]]);
        }
    });

    // Multi-lap mode: click to select/deselect laps (no hotkey needed)
    // Drag-to-select logic
    let dragSelecting = false,
        dragSelectValue = /** @type {boolean | null} */ (null);
    lapSelect.addEventListener("mousedown", (/** @type {MouseEvent} */ e) => {
        const { target } = /** @type {{ target: HTMLElement }} */ (e);
        if (multiSelectMode && target && target.tagName === "OPTION") {
            e.preventDefault();
            dragSelecting = true;
            const opt = /** @type {HTMLOptionElement} */ (target);
            dragSelectValue = !opt.selected;
            if (opt.value === "all") {
                for (const o of lapSelect.options) {
                    o.selected = o.value === "all";
                }
            } else {
                opt.selected = dragSelectValue;
                if (lapSelect.options[0]) {
                    lapSelect.options[0].selected = false;
                }
            }
            lapSelect.dispatchEvent(new Event("change"));
        }
    });
    lapSelect.addEventListener("mouseover", (/** @type {MouseEvent} */ e) => {
        const { target } = /** @type {{ target: HTMLElement }} */ (e);
        if (multiSelectMode && dragSelecting && target && target.tagName === "OPTION") {
            const opt = /** @type {HTMLOptionElement} */ (target);
            if (opt.value !== "all") {
                opt.selected = /** @type {boolean} */ (dragSelectValue);
                if (lapSelect.options[0]) {
                    lapSelect.options[0].selected = false;
                }
                lapSelect.dispatchEvent(new Event("change"));
            }
        }
    });
    document.addEventListener("mouseup", () => {
        dragSelecting = false;
        dragSelectValue = null;
    });

    // Add scroll wheel support for changing lap selection
    lapSelect.addEventListener(
        "wheel",
        (/** @type {WheelEvent} */ e) => {
            e.preventDefault();
            e.stopPropagation();
            const options = [...lapSelect.options];
            let idx = lapSelect.selectedIndex;
            if (idx === -1) {
                idx = 0;
            }
            if (e.deltaY > 0 && idx < options.length - 1) {
                lapSelect.selectedIndex = idx + 1;
            } else if (e.deltaY < 0 && idx > 0) {
                lapSelect.selectedIndex = idx - 1;
            }
            lapSelect.dispatchEvent(new Event("change"));
        },
        { passive: false }
    );

    // Initialize in single-select mode
    setMultiSelectMode(false);
}

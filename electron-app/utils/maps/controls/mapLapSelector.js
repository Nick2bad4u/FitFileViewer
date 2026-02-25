import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
import { getAppIconSvg } from "../../ui/icons/iconFactory.js";

/**
 * @typedef {Object} LapMesg
 *
 * @property {number} [zone] - Zone identifier
 * @property {string} [label] - Zone label
 * @property {number} [time] - Time value
 */

/**
 * @typedef {Object} GlobalData
 *
 * @property {LapMesg[]} lapMesgs - Array of lap messages
 */

/**
 * @typedef {Object} WindowWithGlobalData
 *
 * @property {GlobalData} globalData - Global data object
 */

/**
 * @typedef {Object} ThemeColors
 *
 * @property {string} surface - Surface color
 * @property {string} primary - Primary color
 * @property {string} accent - Accent color
 * @property {string} text - Text color
 * @property {string} textSecondary - Secondary text color
 */

/**
 * @typedef {Object} MapDrawLapsFunction
 *
 * @property {Function} call - Function to draw laps on map
 */

// Lap selection UI and logic for Leaflet map
// Exports: addLapSelector(map, container, mapDrawLaps)

/**
 * Adds lap selector control to map
 *
 * @param {any} _map - Leaflet map instance (unused in current implementation)
 * @param {HTMLElement} container - Container element for the control
 * @param {Function} mapDrawLaps - Function to draw laps on map
 *
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
    lapControl.className =
        "custom-lap-control-container leaflet-bottom leaflet-left";
    // Import theme colors for consistent theming
    const themeColors = /** @type {any} */ (getThemeColors());

    // Idempotency: remove any prior lap selector control in this container.
    const existing = container.querySelector(".custom-lap-control-container");
    if (existing) {
        existing.remove();
    }

    const safeColors = {
        surface: sanitizeCssColorToken(themeColors.surface, "#ffffff"),
        primary: sanitizeCssColorToken(themeColors.primary, "#3b82f6"),
        accent: sanitizeCssColorToken(
            themeColors.accent || themeColors.primary,
            "#3b82f6"
        ),
        text: sanitizeCssColorToken(themeColors.text, "#0f172a"),
        textSecondary: sanitizeCssColorToken(
            themeColors.textSecondary || "#888",
            "#888"
        ),
    };

    /**
     * @param {"circleHelp" | "circleX" | "route" | "timer"} iconName
     * @param {number} [size]
     *
     * @returns {HTMLElement}
     */
    const createControlIcon = (iconName, size = 16) => {
        const icon = document.createElement("span");
        icon.className = "icon";
        icon.innerHTML = getAppIconSvg(iconName, {
            className: "lap-control-icon",
            size,
            strokeWidth: 2,
        });
        return icon;
    };

    const bar = document.createElement("div");
    bar.className = "custom-lap-control leaflet-bar";

    const multiLapToggle = document.createElement("button");
    multiLapToggle.id = "multi-lap-toggle";
    multiLapToggle.className = "multi-lap-toggle";
    multiLapToggle.type = "button";
    multiLapToggle.title =
        "Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.";
    multiLapToggle.append(createControlIcon("timer"));
    const lapsText = document.createElement("span");
    lapsText.textContent = "Laps:";
    lapsText.style.color = safeColors.text;
    lapsText.style.marginLeft = "4px";
    multiLapToggle.append(lapsText);

    const deselectAllBtn = document.createElement("button");
    deselectAllBtn.id = "deselect-all-btn";
    deselectAllBtn.className = "deselect-all-btn";
    deselectAllBtn.title = "Deselect all laps (Esc)";
    deselectAllBtn.append(createControlIcon("circleX"));

    const label = document.createElement("label");
    // Avoid redundant "Laps: Lap:" UI (multiLapToggle already indicates purpose).
    // Keep a label for accessibility but hide it visually.
    label.className = "lap-label visually-hidden";
    label.htmlFor = "lap-select";
    label.textContent = "Lap selection";

    const lapSelect = document.createElement("select");
    lapSelect.id = "lap-select";
    lapSelect.setAttribute("aria-label", "Lap selection");
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All";
    lapSelect.append(allOption);
    for (let i = 0; i < windowWithData.globalData.lapMesgs.length; i += 1) {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = `Lap ${i + 1}`;
        lapSelect.append(opt);
    }

    // Help tooltip (themed) for lap selector usage
    const helpBtn = document.createElement("button");
    helpBtn.type = "button";
    helpBtn.className = "lap-help-btn";
    helpBtn.setAttribute("aria-label", "Lap selection help");
    helpBtn.setAttribute("aria-expanded", "false");
    helpBtn.append(createControlIcon("circleHelp"));

    const helpTooltip = document.createElement("div");
    helpTooltip.id = "lap-help-tooltip";
    helpTooltip.className = "ffv-map-tooltip";
    helpTooltip.setAttribute("role", "tooltip");
    helpBtn.setAttribute("aria-controls", helpTooltip.id);
    helpTooltip.textContent =
        "Select a lap (or All). Toggle multi-lap mode to select multiple laps via click/drag. Press Esc to clear.";

    let tooltipPinned = false;

    function handleOutsideClick(event) {
        const target = event.target instanceof Node ? event.target : null;
        if (target && !lapControl.contains(target)) {
            hideHelpTooltip({ force: true });
        }
    }

    function handleEscapeKey(event) {
        if (event.key === "Escape") {
            hideHelpTooltip({ force: true });
        }
    }

    /**
     * @param {{ force?: boolean }} [options]
     */
    function hideHelpTooltip(options = {}) {
        const force = Boolean(options.force);
        if (tooltipPinned && !force) {
            return;
        }
        tooltipPinned = false;
        helpTooltip.classList.remove("is-visible");
        helpBtn.setAttribute("aria-expanded", "false");
        document.removeEventListener("mousedown", handleOutsideClick, true);
        document.removeEventListener("keydown", handleEscapeKey);
    }

    /**
     * @param {{ pinned?: boolean }} [options]
     */
    function showHelpTooltip(options = {}) {
        if (options.pinned) {
            tooltipPinned = true;
        }
        helpTooltip.classList.add("is-visible");
        helpBtn.setAttribute("aria-expanded", "true");
        if (tooltipPinned) {
            document.addEventListener("mousedown", handleOutsideClick, true);
            document.addEventListener("keydown", handleEscapeKey);
        }
    }

    helpBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        if (tooltipPinned) {
            hideHelpTooltip({ force: true });
        } else {
            showHelpTooltip({ pinned: true });
        }
    });

    helpBtn.addEventListener("mouseenter", () => showHelpTooltip());
    helpBtn.addEventListener("focus", () => showHelpTooltip());
    helpBtn.addEventListener("mouseleave", () => hideHelpTooltip());
    helpBtn.addEventListener("blur", () => hideHelpTooltip({ force: true }));
    helpTooltip.addEventListener("mouseenter", () => showHelpTooltip());
    helpTooltip.addEventListener("mouseleave", () => hideHelpTooltip());

    bar.append(
        multiLapToggle,
        deselectAllBtn,
        label,
        lapSelect,
        helpBtn,
        helpTooltip
    );
    lapControl.append(bar);
    lapControl.addEventListener("mousedown", (/** @type {Event} */ e) =>
        e.stopPropagation()
    );
    lapControl.addEventListener(
        "touchstart",
        (/** @type {Event} */ e) => e.stopPropagation(),
        { passive: true }
    );
    container.append(lapControl);

    const deselectAllBtnEl = /** @type {HTMLButtonElement} */ (deselectAllBtn);
    const lapSelectEl = /** @type {HTMLSelectElement} */ (lapSelect);
    const multiLapToggleEl = /** @type {HTMLButtonElement} */ (multiLapToggle);
    let multiSelectMode = false;

    const renderToggleIcon = (on) => {
        // Keep the label span, just swap the first child icon.
        const existingIcon = multiLapToggleEl.querySelector(".icon");
        if (existingIcon) {
            existingIcon.remove();
        }
        multiLapToggleEl.prepend(createControlIcon(on ? "route" : "timer"));
    };

    /**
     * Set multi-select mode state
     *
     * @param {boolean} on - Whether to enable multi-select mode
     *
     * @returns {void}
     */
    function setMultiSelectMode(on) {
        multiSelectMode = on;
        if (multiSelectMode) {
            lapSelectEl.multiple = true;
            lapSelectEl.size = Math.min(
                windowWithData.globalData.lapMesgs.length + 1,
                6
            );
            multiLapToggleEl?.classList.add("active");
            lapControl.classList.add("multi-select-active");
            if (deselectAllBtnEl) {
                deselectAllBtnEl.style.display = "";
            }
            renderToggleIcon(true);
            multiLapToggleEl.title = "Return to single-lap mode";
        } else {
            lapSelectEl.multiple = false;
            lapSelectEl.size = 1;
            multiLapToggleEl?.classList.remove("active");
            lapControl.classList.remove("multi-select-active");
            if (deselectAllBtnEl) {
                deselectAllBtnEl.style.display = "none";
            }
            renderToggleIcon(false);
            multiLapToggleEl.title =
                "Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.";
            // If more than one selected, reset to 'all'
            if (
                lapSelectEl.selectedOptions.length > 1 ||
                (lapSelectEl.selectedOptions.length === 1 &&
                    lapSelectEl.selectedOptions[0]?.value !== "all")
            ) {
                lapSelectEl.selectedIndex = 0;
                lapSelectEl.dispatchEvent(new Event("change"));
            }
        }
    }

    if (deselectAllBtnEl) {
        deselectAllBtnEl.addEventListener("click", () => {
            for (const opt of lapSelectEl.options) {
                opt.selected = false;
            }
            lapSelectEl.selectedIndex = 0;
            lapSelectEl.dispatchEvent(new Event("change"));
        });
    }

    // Hide deselect button by default.
    deselectAllBtnEl.style.display = "none";

    multiLapToggleEl.addEventListener("click", () =>
        setMultiSelectMode(!multiSelectMode)
    );

    lapSelectEl.addEventListener("change", () => {
        let selected = [...lapSelectEl.selectedOptions].map(
            (/** @type {HTMLOptionElement} */ opt) => opt.value
        );
        if (multiSelectMode) {
            if (selected.includes("all") && selected.length > 1) {
                for (const opt of lapSelectEl.options) {
                    opt.selected = opt.value === "all";
                }
                selected = ["all"];
            }
            if (selected.length === 0) {
                lapSelectEl.selectedIndex = 0;
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
    lapSelectEl.addEventListener("mousedown", (/** @type {MouseEvent} */ e) => {
        const { target } = /** @type {{ target: HTMLElement }} */ (e);
        if (multiSelectMode && target && target.tagName === "OPTION") {
            e.preventDefault();
            dragSelecting = true;
            const opt = /** @type {HTMLOptionElement} */ (target);
            dragSelectValue = !opt.selected;
            if (opt.value === "all") {
                for (const o of lapSelectEl.options) {
                    o.selected = o.value === "all";
                }
            } else {
                opt.selected = dragSelectValue;
                if (lapSelectEl.options[0]) {
                    lapSelectEl.options[0].selected = false;
                }
            }
            lapSelectEl.dispatchEvent(new Event("change"));
        }
    });
    lapSelectEl.addEventListener("mouseover", (/** @type {MouseEvent} */ e) => {
        const { target } = /** @type {{ target: HTMLElement }} */ (e);
        if (
            multiSelectMode &&
            dragSelecting &&
            target &&
            target.tagName === "OPTION"
        ) {
            const opt = /** @type {HTMLOptionElement} */ (target);
            if (opt.value !== "all") {
                opt.selected = /** @type {boolean} */ (dragSelectValue);
                if (lapSelectEl.options[0]) {
                    lapSelectEl.options[0].selected = false;
                }
                lapSelectEl.dispatchEvent(new Event("change"));
            }
        }
    });

    // Avoid leaking document-level handlers if the map is re-rendered.
    /** @type {any} */
    const g = globalThis;
    const mouseupKey = "__ffvLapSelectorMouseupHandler";
    if (typeof g[mouseupKey] === "function") {
        document.removeEventListener("mouseup", g[mouseupKey]);
    }
    g[mouseupKey] = () => {
        dragSelecting = false;
        dragSelectValue = null;
    };
    document.addEventListener("mouseup", g[mouseupKey]);

    // Add scroll wheel support for changing lap selection
    lapSelectEl.addEventListener(
        "wheel",
        (/** @type {WheelEvent} */ e) => {
            e.preventDefault();
            e.stopPropagation();
            const options = [...lapSelectEl.options];
            let idx = lapSelectEl.selectedIndex;
            if (idx === -1) {
                idx = 0;
            }
            if (e.deltaY > 0 && idx < options.length - 1) {
                lapSelectEl.selectedIndex = idx + 1;
            } else if (e.deltaY < 0 && idx > 0) {
                lapSelectEl.selectedIndex = idx - 1;
            }
            lapSelectEl.dispatchEvent(new Event("change"));
        },
        { passive: false }
    );

    // Initialize in single-select mode
    setMultiSelectMode(false);
}

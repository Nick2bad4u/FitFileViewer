import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";

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

    // Idempotency: remove any prior lap selector control in this container.
    const existing = container.querySelector(".custom-lap-control-container");
    if (existing) {
        existing.remove();
    }

    const safeColors = {
        surface: sanitizeCssColorToken(themeColors.surface, "#ffffff"),
        primary: sanitizeCssColorToken(themeColors.primary, "#3b82f6"),
        accent: sanitizeCssColorToken(themeColors.accent || themeColors.primary, "#3b82f6"),
        text: sanitizeCssColorToken(themeColors.text, "#0f172a"),
        textSecondary: sanitizeCssColorToken(themeColors.textSecondary || "#888", "#888"),
    };

    /**
     * @param {string} name
     * @returns {SVGElement}
     */
    const svgEl = (name) => document.createElementNS("http://www.w3.org/2000/svg", name);

    /**
     * @returns {SVGElement}
     */
    const createStopwatchIcon = () => {
        const svg = svgEl("svg");
        svg.setAttribute("class", "icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");

        const circle = svgEl("circle");
        circle.setAttribute("cx", "10");
        circle.setAttribute("cy", "11");
        circle.setAttribute("r", "6");
        circle.setAttribute("fill", safeColors.surface);
        circle.setAttribute("stroke", safeColors.primary);
        circle.setAttribute("stroke-width", "1.5");

        const rect = svgEl("rect");
        rect.setAttribute("x", "8.5");
        rect.setAttribute("y", "3");
        rect.setAttribute("width", "3");
        rect.setAttribute("height", "2.5");
        rect.setAttribute("rx", "1");
        rect.setAttribute("fill", safeColors.primary);

        const hand1 = svgEl("line");
        hand1.setAttribute("x1", "10");
        hand1.setAttribute("y1", "11");
        hand1.setAttribute("x2", "10");
        hand1.setAttribute("y2", "7.5");
        hand1.setAttribute("stroke", safeColors.primary);
        hand1.setAttribute("stroke-width", "1.3");
        hand1.setAttribute("stroke-linecap", "round");

        const hand2 = svgEl("line");
        hand2.setAttribute("x1", "10");
        hand2.setAttribute("y1", "11");
        hand2.setAttribute("x2", "13");
        hand2.setAttribute("y2", "11");
        hand2.setAttribute("stroke", safeColors.accent);
        hand2.setAttribute("stroke-width", "1.3");
        hand2.setAttribute("stroke-linecap", "round");

        const dot = svgEl("circle");
        dot.setAttribute("cx", "10");
        dot.setAttribute("cy", "11");
        dot.setAttribute("r", "1.2");
        dot.setAttribute("fill", safeColors.accent);

        svg.append(circle, rect, hand1, hand2, dot);
        return svg;
    };

    /**
     * @returns {SVGElement}
     */
    const createMultiLapIcon = () => {
        const svg = svgEl("svg");
        svg.setAttribute("class", "icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");

        /**
         * @param {string} x
         * @param {string} y
         * @param {string} h
         */
        const addBar = (x, y, h) => {
            const r = svgEl("rect");
            r.setAttribute("x", x);
            r.setAttribute("y", y);
            r.setAttribute("width", "2.5");
            r.setAttribute("height", h);
            r.setAttribute("rx", "1");
            r.setAttribute("fill", safeColors.accent);
            r.setAttribute("stroke", safeColors.accent);
            r.setAttribute("stroke-width", "1");
            svg.append(r);
        };

        addBar("2", "11", "5");
        addBar("6", "7", "9");
        addBar("10", "4", "12");
        addBar("14", "9", "7");
        return svg;
    };

    /**
     * @returns {SVGElement}
     */
    const createDeselectIcon = () => {
        const svg = svgEl("svg");
        svg.setAttribute("class", "icon");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");

        const c = svgEl("circle");
        c.setAttribute("cx", "8");
        c.setAttribute("cy", "8");
        c.setAttribute("r", "7");
        c.setAttribute("fill", "none");
        c.setAttribute("stroke", safeColors.textSecondary);
        c.setAttribute("stroke-width", "2");

        const l1 = svgEl("line");
        l1.setAttribute("x1", "5");
        l1.setAttribute("y1", "5");
        l1.setAttribute("x2", "11");
        l1.setAttribute("y2", "11");
        l1.setAttribute("stroke", safeColors.textSecondary);
        l1.setAttribute("stroke-width", "2");

        const l2 = svgEl("line");
        l2.setAttribute("x1", "11");
        l2.setAttribute("y1", "5");
        l2.setAttribute("x2", "5");
        l2.setAttribute("y2", "11");
        l2.setAttribute("stroke", safeColors.textSecondary);
        l2.setAttribute("stroke-width", "2");

        svg.append(c, l1, l2);
        return svg;
    };

    const bar = document.createElement("div");
    bar.className = "custom-lap-control leaflet-bar";

    const multiLapToggle = document.createElement("button");
    multiLapToggle.id = "multi-lap-toggle";
    multiLapToggle.className = "multi-lap-toggle";
    multiLapToggle.type = "button";
    multiLapToggle.title =
        "Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.";
    multiLapToggle.append(createStopwatchIcon());
    const lapsText = document.createElement("span");
    lapsText.textContent = "Laps:";
    lapsText.style.color = safeColors.text;
    lapsText.style.marginLeft = "4px";
    multiLapToggle.append(lapsText);

    const deselectAllBtn = document.createElement("button");
    deselectAllBtn.id = "deselect-all-btn";
    deselectAllBtn.className = "deselect-all-btn";
    deselectAllBtn.title = "Deselect all laps (Esc)";
    deselectAllBtn.append(createDeselectIcon());

    const label = document.createElement("label");
    label.className = "lap-label";
    label.htmlFor = "lap-select";
    label.textContent = "Lap:";
    label.style.color = safeColors.text;

    const lapSelect = document.createElement("select");
    lapSelect.id = "lap-select";
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

    bar.append(multiLapToggle, deselectAllBtn, label, lapSelect);
    lapControl.append(bar);
    lapControl.addEventListener("mousedown", (/** @type {Event} */ e) => e.stopPropagation());
    lapControl.addEventListener("touchstart", (/** @type {Event} */ e) => e.stopPropagation(), { passive: true });
    container.append(lapControl);

    const deselectAllBtnEl = /** @type {HTMLButtonElement} */ (deselectAllBtn);
    const lapSelectEl = /** @type {HTMLSelectElement} */ (lapSelect);
    const multiLapToggleEl = /** @type {HTMLButtonElement} */ (multiLapToggle);
    let multiSelectMode = false;

    const renderToggleIcon = (on) => {
        // Keep the label span, just swap the first child icon.
        const existingSvg = multiLapToggleEl.querySelector("svg");
        if (existingSvg) {
            existingSvg.remove();
        }
        multiLapToggleEl.prepend(on ? createMultiLapIcon() : createStopwatchIcon());
    };

    /**
     * Set multi-select mode state
     * @param {boolean} on - Whether to enable multi-select mode
     * @returns {void}
     */
    function setMultiSelectMode(on) {
        multiSelectMode = on;
        if (multiSelectMode) {
            lapSelectEl.multiple = true;
            lapSelectEl.size = Math.min(windowWithData.globalData.lapMesgs.length + 1, 6);
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
                (lapSelectEl.selectedOptions.length === 1 && lapSelectEl.selectedOptions[0]?.value !== "all")
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

    multiLapToggleEl.addEventListener("click", () => setMultiSelectMode(!multiSelectMode));

    lapSelectEl.addEventListener("change", () => {
        let selected = [...lapSelectEl.selectedOptions].map((/** @type {HTMLOptionElement} */ opt) => opt.value);
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
        if (multiSelectMode && dragSelecting && target && target.tagName === "OPTION") {
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

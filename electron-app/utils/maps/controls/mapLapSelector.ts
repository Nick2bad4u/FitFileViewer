import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
import { FitFileSelectors } from "../../state/domain/fitFileState.js";
import {
    createAppIconElement,
    type AppIconName,
} from "../../ui/icons/iconFactory.js";
import {
    getMapLapSelectorRuntime,
    type MapLapSelectorRuntime,
} from "./mapLapSelectorRuntime.js";

type LapSelection = "all" | string[];
type MapDrawLaps = (selection: LapSelection) => void;

type HelpTooltipOptions = {
    force?: boolean;
    pinned?: boolean;
};

type LapControlIconName = Extract<
    AppIconName,
    "circleHelp" | "circleX" | "route" | "timer"
>;

type LapSelectorMouseupRegistration = {
    readonly handler: (event: MouseEvent) => void;
    readonly runtime: MapLapSelectorRuntime;
};

let lapSelectorMouseupHandler: LapSelectorMouseupRegistration | null = null;

function replaceLapSelectorMouseupHandler(
    handler: (event: MouseEvent) => void,
    runtime: MapLapSelectorRuntime
): void {
    const currentHandler = lapSelectorMouseupHandler;
    if (currentHandler) {
        currentHandler.runtime.removeDocumentMouseupListener(
            currentHandler.handler
        );
    }
    lapSelectorMouseupHandler = { handler, runtime };
}

function clearLapSelectorMouseupHandler(
    handler: (event: MouseEvent) => void
): void {
    const currentHandler = lapSelectorMouseupHandler;
    if (currentHandler?.handler !== handler) {
        return;
    }
    currentHandler.runtime.removeDocumentMouseupListener(handler);
    lapSelectorMouseupHandler = null;
}

export function resetMapLapSelectorStateForTests(): void {
    const currentHandler = lapSelectorMouseupHandler;
    if (currentHandler) {
        currentHandler.runtime.removeDocumentMouseupListener(
            currentHandler.handler
        );
    }
    lapSelectorMouseupHandler = null;
}

// Lap selection UI and logic for Leaflet map
// Exports: addLapSelector(map, container, mapDrawLaps)

/**
 * Adds lap selector control to map
 *
 * @param _map - Leaflet map instance. Reserved for future map-specific
 *   behavior.
 * @param container - Container element for the control.
 * @param mapDrawLaps - Function to draw laps on map.
 */
export function addLapSelector(
    _map: unknown,
    container: HTMLElement,
    mapDrawLaps: MapDrawLaps,
    runtime: MapLapSelectorRuntime = getMapLapSelectorRuntime()
): void {
    const lapMesgs = FitFileSelectors.getLapMessages();
    if (lapMesgs.length === 0) {
        return;
    }
    const availableLapMesgs = lapMesgs;

    const lapControl = runtime.createElement("div");
    lapControl.className =
        "custom-lap-control-container leaflet-bottom leaflet-left";
    const eventController = runtime.createAbortController();
    const { signal } = eventController;
    // Import theme colors for consistent theming
    const themeColors = getThemeColors();

    // Idempotency: remove any prior lap selector control in this container.
    const existing = container.querySelector(".custom-lap-control-container");
    if (existing) {
        existing.remove();
    }

    const safeColors = {
        surface: sanitizeCssColorToken(themeColors["surface"], "#ffffff"),
        primary: sanitizeCssColorToken(themeColors["primary"], "#3b82f6"),
        accent: sanitizeCssColorToken(
            themeColors["accent"] || themeColors["primary"],
            "#3b82f6"
        ),
        text: sanitizeCssColorToken(themeColors["text"], "#0f172a"),
        textSecondary: sanitizeCssColorToken(
            themeColors["textSecondary"] || "#888",
            "#888"
        ),
    };

    const createControlIcon = (
        iconName: LapControlIconName,
        size = 16
    ): HTMLElement => {
        const icon = runtime.createElement("span");
        icon.className = "icon";
        icon.append(
            createAppIconElement(iconName, {
                className: "lap-control-icon",
                size,
                strokeWidth: 2,
            })
        );
        return icon;
    };

    const bar = runtime.createElement("div");
    bar.className = "custom-lap-control leaflet-bar";

    const multiLapToggle = runtime.createElement("button");
    multiLapToggle.id = "multi-lap-toggle";
    multiLapToggle.className = "multi-lap-toggle";
    multiLapToggle.type = "button";
    multiLapToggle.title =
        "Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.";
    multiLapToggle.append(createControlIcon("timer"));
    const lapsText = runtime.createElement("span");
    lapsText.textContent = "Laps:";
    lapsText.style.color = safeColors.text;
    lapsText.style.marginLeft = "4px";
    multiLapToggle.append(lapsText);

    const deselectAllBtn = runtime.createElement("button");
    deselectAllBtn.id = "deselect-all-btn";
    deselectAllBtn.className = "deselect-all-btn";
    deselectAllBtn.title = "Deselect all laps (Esc)";
    deselectAllBtn.append(createControlIcon("circleX"));

    const label = runtime.createElement("label");
    // Avoid redundant "Laps: Lap:" UI (multiLapToggle already indicates purpose).
    // Keep a label for accessibility but hide it visually.
    label.className = "lap-label visually-hidden";
    label.htmlFor = "lap-select";
    label.textContent = "Lap selection";

    const lapSelect = runtime.createElement("select");
    lapSelect.id = "lap-select";
    lapSelect.setAttribute("aria-label", "Lap selection");
    const allOption = runtime.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All";
    lapSelect.append(allOption);
    for (let i = 0; i < availableLapMesgs.length; i += 1) {
        const opt = runtime.createElement("option");
        opt.value = String(i);
        opt.textContent = `Lap ${i + 1}`;
        lapSelect.append(opt);
    }

    // Help tooltip (themed) for lap selector usage
    const helpBtn = runtime.createElement("button");
    helpBtn.type = "button";
    helpBtn.className = "lap-help-btn";
    helpBtn.setAttribute("aria-label", "Lap selection help");
    helpBtn.setAttribute("aria-expanded", "false");
    helpBtn.append(createControlIcon("circleHelp"));

    const helpTooltip = runtime.createElement("div");
    helpTooltip.id = "lap-help-tooltip";
    helpTooltip.className = "ffv-map-tooltip";
    helpTooltip.setAttribute("role", "tooltip");
    helpBtn.setAttribute("aria-controls", helpTooltip.id);
    helpTooltip.textContent =
        "Select a lap (or All). Toggle multi-lap mode to select multiple laps via click/drag. Press Esc to clear.";

    let tooltipPinned = false;

    function handleOutsideClick(event: MouseEvent): void {
        const target = event.target instanceof Node ? event.target : null;
        if (target && !lapControl.contains(target)) {
            hideHelpTooltip({ force: true });
        }
    }

    function handleEscapeKey(event: KeyboardEvent): void {
        if (event.key === "Escape") {
            hideHelpTooltip({ force: true });
            if (multiSelectMode) {
                clearLapSelection();
                event.preventDefault();
            }
        }
    }

    function hideHelpTooltip(options: HelpTooltipOptions = {}): void {
        const force = Boolean(options.force);
        if (tooltipPinned && !force) {
            return;
        }
        tooltipPinned = false;
        helpTooltip.classList.remove("is-visible");
        helpBtn.setAttribute("aria-expanded", "false");
        runtime.removeDocumentMousedownListener(handleOutsideClick);
        runtime.removeDocumentKeydownListener(handleEscapeKey);
    }

    function showHelpTooltip(options: HelpTooltipOptions = {}): void {
        if (options.pinned) {
            tooltipPinned = true;
        }
        helpTooltip.classList.add("is-visible");
        helpBtn.setAttribute("aria-expanded", "true");
        if (tooltipPinned) {
            runtime.addDocumentMousedownListener(handleOutsideClick, {
                capture: true,
                signal,
            });
            runtime.addDocumentKeydownListener(handleEscapeKey, {
                signal,
            });
        }
    }

    helpBtn.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            if (tooltipPinned) {
                hideHelpTooltip({ force: true });
            } else {
                showHelpTooltip({ pinned: true });
            }
        },
        { signal }
    );

    helpBtn.addEventListener("mouseenter", () => showHelpTooltip(), { signal });
    helpBtn.addEventListener("focus", () => showHelpTooltip(), { signal });
    helpBtn.addEventListener("mouseleave", () => hideHelpTooltip(), { signal });
    helpBtn.addEventListener("blur", () => hideHelpTooltip({ force: true }), {
        signal,
    });
    helpTooltip.addEventListener("mouseenter", () => showHelpTooltip(), {
        signal,
    });
    helpTooltip.addEventListener("mouseleave", () => hideHelpTooltip(), {
        signal,
    });

    bar.append(
        multiLapToggle,
        deselectAllBtn,
        label,
        lapSelect,
        helpBtn,
        helpTooltip
    );
    lapControl.append(bar);
    lapControl.addEventListener(
        "mousedown",
        (event) => event.stopPropagation(),
        {
            signal,
        }
    );
    lapControl.addEventListener(
        "touchstart",
        (event) => event.stopPropagation(),
        { passive: true, signal }
    );
    lapControl.addEventListener("keydown", handleEscapeKey, { signal });
    container.append(lapControl);

    const deselectAllBtnEl = deselectAllBtn;
    const lapSelectEl = lapSelect;
    const multiLapToggleEl = multiLapToggle;
    let multiSelectMode = false;

    function clearLapSelection(): void {
        for (const opt of lapSelectEl.options) {
            opt.selected = false;
        }
        lapSelectEl.selectedIndex = 0;
        lapSelectEl.dispatchEvent(runtime.createSelectChangeEvent());
    }

    const renderToggleIcon = (on: boolean): void => {
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
     * @param on - Whether to enable multi-select mode.
     */
    function setMultiSelectMode(on: boolean): void {
        multiSelectMode = on;
        if (multiSelectMode) {
            lapSelectEl.multiple = true;
            lapSelectEl.size = Math.min(availableLapMesgs.length + 1, 6);
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
                lapSelectEl.dispatchEvent(runtime.createSelectChangeEvent());
            }
        }
    }

    if (deselectAllBtnEl) {
        deselectAllBtnEl.addEventListener("click", () => clearLapSelection(), {
            signal,
        });
    }

    // Hide deselect button by default.
    deselectAllBtnEl.style.display = "none";

    multiLapToggleEl.addEventListener(
        "click",
        () => setMultiSelectMode(!multiSelectMode),
        { signal }
    );

    lapSelectEl.addEventListener(
        "change",
        () => {
            let selected = [...lapSelectEl.selectedOptions].map(
                (opt) => opt.value
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
            } else if ((selected[0] ?? "all") === "all") {
                mapDrawLaps("all");
            } else {
                mapDrawLaps([selected[0] ?? "all"]);
            }
        },
        { signal }
    );

    // Multi-lap mode: click to select/deselect laps (no hotkey needed)
    // Drag-to-select logic
    let dragSelecting = false,
        dragSelectValue: boolean | null = null;
    lapSelectEl.addEventListener(
        "mousedown",
        (event) => {
            const { target } = event;
            if (multiSelectMode && target instanceof HTMLOptionElement) {
                event.preventDefault();
                dragSelecting = true;
                dragSelectValue = !target.selected;
                if (target.value === "all") {
                    for (const o of lapSelectEl.options) {
                        o.selected = o.value === "all";
                    }
                } else {
                    target.selected = dragSelectValue;
                    if (lapSelectEl.options[0]) {
                        lapSelectEl.options[0].selected = false;
                    }
                }
                lapSelectEl.dispatchEvent(runtime.createSelectChangeEvent());
            }
        },
        { signal }
    );
    lapSelectEl.addEventListener(
        "mouseover",
        (event) => {
            const { target } = event;
            if (
                multiSelectMode &&
                dragSelecting &&
                target instanceof HTMLOptionElement &&
                target.value !== "all"
            ) {
                target.selected = Boolean(dragSelectValue);
                if (lapSelectEl.options[0]) {
                    lapSelectEl.options[0].selected = false;
                }
                lapSelectEl.dispatchEvent(runtime.createSelectChangeEvent());
            }
        },
        { signal }
    );

    // Avoid leaking document-level handlers if the map is re-rendered.
    const mouseupHandler = () => {
        dragSelecting = false;
        dragSelectValue = null;
    };
    replaceLapSelectorMouseupHandler(mouseupHandler, runtime);
    runtime.addDocumentMouseupListener(mouseupHandler, {
        signal,
    });
    signal.addEventListener(
        "abort",
        () => {
            clearLapSelectorMouseupHandler(mouseupHandler);
            hideHelpTooltip({ force: true });
        },
        { once: true, signal }
    );

    // Add scroll wheel support for changing lap selection
    lapSelectEl.addEventListener(
        "wheel",
        (event) => {
            event.preventDefault();
            event.stopPropagation();
            const options = [...lapSelectEl.options];
            let idx = lapSelectEl.selectedIndex;
            if (idx === -1) {
                idx = 0;
            }
            if (event.deltaY > 0 && idx < options.length - 1) {
                lapSelectEl.selectedIndex = idx + 1;
            } else if (event.deltaY < 0 && idx > 0) {
                lapSelectEl.selectedIndex = idx - 1;
            }
            lapSelectEl.dispatchEvent(runtime.createSelectChangeEvent());
        },
        { passive: false, signal }
    );

    lapControl.addEventListener(
        "ffv:map-lap-selector:dispose",
        () => eventController.abort(),
        { once: true, signal }
    );

    // Initialize in single-select mode
    setMultiSelectMode(false);
}

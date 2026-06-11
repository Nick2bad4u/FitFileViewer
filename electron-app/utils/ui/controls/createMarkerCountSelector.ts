import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import {
    DEFAULT_MAP_MARKER_COUNT,
    MAP_MARKER_COUNT_OPTIONS,
    getMapMarkerCount,
    setMapMarkerCount,
} from "../../maps/state/mapMarkerCountState.js";
import { updateShownFilesList } from "../../rendering/components/shownFilesListUpdater.js";
import { showNotification } from "../notifications/showNotification.js";
import { getCreateMarkerCountSelectorRuntime } from "./createMarkerCountSelectorRuntime.js";

type MarkerCountOption = (typeof MAP_MARKER_COUNT_OPTIONS)[number];
type NumericMarkerCountOption = Extract<MarkerCountOption, number>;
type ThemeColors = ReturnType<typeof getThemeColors>;
type MarkerCountSelectorRuntime = ReturnType<
    typeof getCreateMarkerCountSelectorRuntime
>;
const MAP_MARKER_COUNT_OPTION_SET: ReadonlySet<number> = new Set(
    MAP_MARKER_COUNT_OPTIONS.filter(
        (option): option is NumericMarkerCountOption =>
            typeof option === "number"
    )
);

function createMarkerCountIcon(
    runtime: MarkerCountSelectorRuntime,
    themeColors: ThemeColors
): SVGSVGElement {
    const icon = runtime.createSvgElement("svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const bars = [
        { height: "7", x: "1.5", y: "8" },
        { height: "11", x: "5", y: "5" },
        { height: "14", x: "8.5", y: "2.5" },
        { height: "5", x: "12", y: "11" },
    ];
    for (const { height, x, y } of bars) {
        const rect = runtime.createSvgElement("rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", "2");
        rect.setAttribute("height", height);
        rect.setAttribute("rx", "1");
        rect.setAttribute("fill", getThemeColorValue(themeColors, "surface"));
        rect.setAttribute("stroke", getThemeColorValue(themeColors, "primary"));
        rect.setAttribute("stroke-width", "1.5");
        icon.append(rect);
    }

    return icon;
}

function getThemeColorValue(colors: ThemeColors, key: string): string {
    const value = colors[key];
    return typeof value === "string" && value ? value : "currentColor";
}

/**
 * Creates a marker count selector for controlling data point density on the
 * map. Adds wheel support and persists the shared map marker-count state used
 * by map rendering.
 *
 * Contract:
 *
 * - `onChange` is called with 0 to mean "all" markers, else the numeric limit.
 * - Shared map marker-count state is always kept in sync; 0 means all.
 * - Returned element is a container div with a label + select.
 *
 * @param onChange - Callback invoked when selection changes.
 *
 * @returns Container element.
 */
export function createMarkerCountSelector(
    onChange?: (count: number) => void
): HTMLDivElement {
    const runtime = getCreateMarkerCountSelectorRuntime();

    try {
        const container = runtime.createElement("div");
        const listenerController = runtime.createAbortController();
        const themeColors = getThemeColors();
        container.className = "map-action-btn marker-count-container";

        const label = runtime.createElement("label");
        const labelText = runtime.createElement("span");
        labelText.textContent = "Data Points:";
        label.append(createMarkerCountIcon(runtime, themeColors), labelText);
        label.setAttribute("for", "marker-count-select");
        label.className = "marker-count-label";

        const select = runtime.createElement("select");
        select.id = "marker-count-select";
        select.className = "marker-count-select";

        for (const val of MAP_MARKER_COUNT_OPTIONS) {
            const opt = runtime.createElement("option");
            opt.value = String(val);
            opt.textContent = val === "all" ? "All" : String(val);
            select.append(opt);
        }

        select.value = resolveInitialMarkerCount();

        // Handle selection changes
        select.addEventListener(
            "change",
            () => {
                handleMarkerCountChange(select, onChange);
            },
            { signal: listenerController.signal }
        );

        // Add mouse wheel support for changing marker count
        select.addEventListener(
            "wheel",
            (e) => {
                handleMarkerCountWheel(runtime, e, select);
            },
            { passive: false, signal: listenerController.signal }
        );

        // Apply CSS classes for proper theming - no need for inline styles
        // The CSS already handles theming through .map-action-btn and theme-specific selectors
        container.append(label);
        container.append(select);

        return container;
    } catch (error) {
        console.error(
            "[mapActionButtons] Error creating marker count selector:",
            error
        );
        void showNotification(
            "Failed to create marker count selector",
            "error"
        );
        return runtime.createElement("div");
    }
}

function handleMarkerCountChange(
    select: HTMLSelectElement,
    onChange: ((count: number) => void) | undefined
): void {
    try {
        const selectedCount =
            select.value === "all" ? 0 : Number.parseInt(select.value, 10);
        const markerCount = setMapMarkerCount(selectedCount);

        onChange?.(markerCount);
        updateShownFilesList();
    } catch (error) {
        console.error(
            "[mapActionButtons] Error in marker count change:",
            error
        );
        void showNotification("Failed to update marker count", "error");
    }
}

function handleMarkerCountWheel(
    runtime: MarkerCountSelectorRuntime,
    event: WheelEvent,
    select: HTMLSelectElement
): void {
    try {
        event.preventDefault();
        event.stopPropagation();

        const idx = select.selectedIndex;
        const optionCount = select.options.length;

        if (event.deltaY > 0 && idx < optionCount - 1) {
            select.selectedIndex = idx + 1;
            dispatchMarkerCountChange(runtime, select);
        } else if (event.deltaY < 0 && idx > 0) {
            select.selectedIndex = idx - 1;
            dispatchMarkerCountChange(runtime, select);
        }
    } catch (error) {
        console.error("[mapActionButtons] Error in wheel event:", error);
    }
}

function dispatchMarkerCountChange(
    runtime: MarkerCountSelectorRuntime,
    select: HTMLSelectElement
): void {
    select.dispatchEvent(runtime.createChangeEvent());
}

function resolveInitialMarkerCount(): string {
    const current = getMapMarkerCount();

    if (current === 0) {
        return "all";
    }

    if (isMarkerCountOption(current)) {
        return String(current);
    }

    setMapMarkerCount(DEFAULT_MAP_MARKER_COUNT);
    return String(DEFAULT_MAP_MARKER_COUNT);
}

function isMarkerCountOption(value: number): value is NumericMarkerCountOption {
    return MAP_MARKER_COUNT_OPTION_SET.has(value);
}

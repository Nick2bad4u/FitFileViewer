import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { showNotification } from "../notifications/showNotification.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_MARKER_COUNT = 50;
const MARKER_COUNT_OPTIONS = [
    10,
    25,
    50,
    100,
    200,
    500,
    1000,
    "all",
] as const;

type MarkerCountOption = (typeof MARKER_COUNT_OPTIONS)[number];
type NumericMarkerCountOption = Extract<MarkerCountOption, number>;
type ThemeColors = ReturnType<typeof getThemeColors>;

type MarkerCountGlobal = typeof globalThis & {
    mapMarkerCount?: number;
    updateShownFilesList?: () => void;
};

function createMarkerCountIcon(themeColors: ThemeColors): SVGSVGElement {
    const icon = document.createElementNS(SVG_NS, "svg");
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
        const rect = document.createElementNS(SVG_NS, "rect");
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
 * map. Adds wheel support and persists a global `window.mapMarkerCount` value
 * used by map rendering.
 *
 * Contract:
 *
 * - `onChange` is called with 0 to mean "all" markers, else the numeric limit.
 * - Global `window.mapMarkerCount` is always kept in sync; 0 means all.
 * - Returned element is a container div with a label + select.
 *
 * @param onChange - Callback invoked when selection changes.
 *
 * @returns Container element.
 */
export function createMarkerCountSelector(
    onChange?: (count: number) => void
): HTMLDivElement {
    try {
        const container = document.createElement("div");
        const listenerController = new AbortController();
        const themeColors = getThemeColors();
        container.className = "map-action-btn marker-count-container";

        const label = document.createElement("label");
        const labelText = document.createElement("span");
        labelText.textContent = "Data Points:";
        label.append(createMarkerCountIcon(themeColors), labelText);
        label.setAttribute("for", "marker-count-select");
        label.className = "marker-count-label";

        const select = document.createElement("select");
        select.id = "marker-count-select";
        select.className = "marker-count-select";

        for (const val of MARKER_COUNT_OPTIONS) {
            const opt = document.createElement("option");
            opt.value = String(val);
            opt.textContent = val === "all" ? "All" : String(val);
            select.append(opt);
        }

        const g = globalThis as MarkerCountGlobal;
        select.value = resolveInitialMarkerCount(g);

        // Handle selection changes
        select.addEventListener(
            "change",
            () => {
                handleMarkerCountChange(select, g, onChange);
            },
            { signal: listenerController.signal }
        );

        // Add mouse wheel support for changing marker count
        select.addEventListener(
            "wheel",
            (e) => {
                handleMarkerCountWheel(e, select);
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
        showNotification("Failed to create marker count selector", "error");
        return document.createElement("div");
    }
}

function handleMarkerCountChange(
    select: HTMLSelectElement,
    globalRef: MarkerCountGlobal,
    onChange: ((count: number) => void) | undefined
): void {
    try {
        globalRef.mapMarkerCount =
            select.value === "all" ? 0 : Number.parseInt(select.value, 10);

        onChange?.(globalRef.mapMarkerCount);
        globalRef.updateShownFilesList?.();
    } catch (error) {
        console.error(
            "[mapActionButtons] Error in marker count change:",
            error
        );
        showNotification("Failed to update marker count", "error");
    }
}

function handleMarkerCountWheel(
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
            dispatchMarkerCountChange(select);
        } else if (event.deltaY < 0 && idx > 0) {
            select.selectedIndex = idx - 1;
            dispatchMarkerCountChange(select);
        }
    } catch (error) {
        console.error("[mapActionButtons] Error in wheel event:", error);
    }
}

function dispatchMarkerCountChange(select: HTMLSelectElement): void {
    select.dispatchEvent(
        new Event("change", {
            bubbles: false,
            cancelable: true,
            composed: false,
        })
    );
}

function resolveInitialMarkerCount(globalRef: MarkerCountGlobal): string {
    const current = globalRef.mapMarkerCount;

    if (typeof current !== "number") {
        globalRef.mapMarkerCount = DEFAULT_MARKER_COUNT;
        return String(DEFAULT_MARKER_COUNT);
    }

    if (current === 0) {
        return "all";
    }

    if (isMarkerCountOption(current)) {
        return String(current);
    }

    globalRef.mapMarkerCount = DEFAULT_MARKER_COUNT;
    return String(DEFAULT_MARKER_COUNT);
}

function isMarkerCountOption(value: number): value is NumericMarkerCountOption {
    return (MARKER_COUNT_OPTIONS as readonly unknown[]).includes(value);
}

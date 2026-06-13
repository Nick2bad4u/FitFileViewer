import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";
import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import {
    clearOverlayLoadedFitFiles,
    getLoadedFitFiles,
    setLoadedFitFiles,
} from "../../state/domain/loadedFitFilesState.js";
import { clearRegisteredMapMeasurements } from "../../maps/state/mapMeasureControlState.js";
import { attachOverlayListItemHandlers } from "./shownFilesListItemHandlers.js";
import { scheduleOverlayMapRender } from "./scheduleOverlayMapRender.js";
import {
    setShownFilesListUpdater,
    updateShownFilesList,
} from "./shownFilesListUpdater.js";
import { clearOverlayTooltipTimeout } from "./shownFilesListTooltipState.js";
import { getShownFilesListRuntime } from "./shownFilesListRuntime.js";

const shownFilesListRuntime = getShownFilesListRuntime();

type ShownFilesContainer = HTMLDivElement & {
    _dispose?: () => void;
};

type OverlayListItem = HTMLLIElement & {
    _overlayListItemCleanup?: (() => void) | null;
    _tooltipRemover?: (() => void) | null;
};

type FocusOverlayOptions = {
    readonly scrollIntoView?: boolean;
};

type Rgb = readonly [
    number,
    number,
    number,
];

function removeOverlayFilenameTooltips(): void {
    const tooltips = document.querySelectorAll(".overlay-filename-tooltip");
    for (const tooltip of tooltips) {
        tooltip.parentNode?.removeChild(tooltip);
    }
}

function getOverlayItems(container: HTMLElement): OverlayListItem[] {
    return [
        ...container.querySelectorAll<OverlayListItem>(
            "li[data-overlay-index]"
        ),
    ];
}

function hexToRgb(hexColor: string): Rgb {
    let hex = hexColor.replace("#", "");
    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((value) => value + value)
            .join("");
    }

    const numericColor = Number.parseInt(hex, 16);
    return [
        numericColor >> 16,
        (numericColor >> 8) & 255,
        numericColor & 255,
    ];
}

function parseColor(color: string): Rgb {
    if (color.startsWith("#")) {
        return hexToRgb(color);
    }

    const match = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
    if (match?.[1] && match[2] && match[3]) {
        return [
            Number.parseInt(match[1], 10),
            Number.parseInt(match[2], 10),
            Number.parseInt(match[3], 10),
        ];
    }

    return [
        255,
        255,
        255,
    ];
}

function luminance(red: number, green: number, blue: number): number {
    const components = [
        red,
        green,
        blue,
    ].map((value) => {
        const normalizedValue = value / 255;
        return normalizedValue <= 0.039_28
            ? normalizedValue / 12.92
            : ((normalizedValue + 0.055) / 1.055) ** 2.4;
    });

    return (
        0.2126 * (components[0] ?? 0) +
        0.7152 * (components[1] ?? 0) +
        0.0722 * (components[2] ?? 0)
    );
}

function getFilteredColor(color: string, filter: string): string {
    if (!filter) {
        return color;
    }

    const temp = document.createElement("span");
    temp.style.color = color;
    temp.style.filter = filter;
    temp.style.display = "none";
    document.body.append(temp);
    const filteredColor = getComputedStyle(temp).color;
    temp.remove();
    return filteredColor;
}

function isColorAccessible(foreground: string, background: string): boolean {
    const [
        redForeground,
        greenForeground,
        blueForeground,
    ] = parseColor(foreground);
    const [
        redBackground,
        greenBackground,
        blueBackground,
    ] = parseColor(background);
    const foregroundLuminance =
        luminance(redForeground, greenForeground, blueForeground) + 0.05;
    const backgroundLuminance =
        luminance(redBackground, greenBackground, blueBackground) + 0.05;
    const contrastRatio =
        foregroundLuminance > backgroundLuminance
            ? foregroundLuminance / backgroundLuminance
            : backgroundLuminance / foregroundLuminance;

    return contrastRatio >= 3.5;
}

function getStringThemeColor(
    themeColors: ReturnType<typeof getThemeColors>,
    colorKey: string,
    fallback: string
): string {
    const color = themeColors[colorKey];
    return typeof color === "string" && color ? color : fallback;
}

/**
 * Creates a list container for showing loaded FIT files on the map.
 *
 * @returns The files list container.
 */
export function createShownFilesList(): HTMLElement {
    const container: ShownFilesContainer = document.createElement("div");
    const lifecycle = shownFilesListRuntime.createAbortController();

    container.className = "shown-files-list map-controls-secondary-card";
    container.style.margin = "0";
    container.style.fontSize = "0.95em";
    container.style.border = "1px solid #bbb";
    container.style.borderRadius = "6px";
    container.style.padding = "10px 14px";
    container.style.maxWidth = "fit-content";
    container.style.overflow = "auto";
    container.style.maxHeight = "fit-content";
    container.style.minHeight = "40px";
    container.tabIndex = 0;
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Map overlay files");
    container.setAttribute("aria-disabled", "true");

    // Security: avoid innerHTML. The header/list markup is static, but using DOM APIs
    // keeps the pattern consistent and prevents future accidental interpolation.
    const heading = document.createElement("b");
    heading.textContent = "Extra Files shown on map:";
    const listElement = document.createElement("ul");
    listElement.id = "shown-files-ul";
    listElement.style.margin = "0";
    listElement.style.paddingLeft = "18px";
    listElement.setAttribute("role", "listbox");
    container.append(heading, listElement);

    const applyTheme = (): void => {
        const themeColors = getThemeColors();
        const surface = getStringThemeColor(themeColors, "surface", "#ffffff");
        const text = getStringThemeColor(themeColors, "text", "#000000");
        const border = getStringThemeColor(themeColors, "border", "#cccccc");
        container.style.background = `${surface}ec`;
        container.style.color = text;
        container.style.border = `1px solid ${border}`;
    };
    applyTheme();

    shownFilesListRuntime.addBodyThemeChangeListener(applyTheme, {
        signal: lifecycle.signal,
    });

    let disposeShownFilesListUpdater: (() => void) | null = null;

    /**
     * Cleanup hook used by renderMap when it tears down the old map DOM. This
     * prevents accumulating document/body listeners and any hovered-tooltip
     * mousemove listeners.
     */
    container._dispose = () => {
        lifecycle.abort();

        clearOverlayTooltipTimeout();

        for (const item of getOverlayItems(container)) {
            item._overlayListItemCleanup?.();
            item._tooltipRemover?.();
        }

        removeOverlayFilenameTooltips();
        disposeShownFilesListUpdater?.();
        disposeShownFilesListUpdater = null;
    };

    let pendingStateSync = false;
    const syncOverlayState = (): void => {
        try {
            setLoadedFitFiles(getLoadedFitFiles(), "createShownFilesList");
        } catch (error) {
            console.error(
                "[createShownFilesList] Failed to sync overlay state:",
                error
            );
        }
    };

    const scheduleOverlayStateSync = (): void => {
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
    const assignKeyboardFocus = (value: number): void => {
        keyboardFocusIndex = value;
    };

    const focusOverlayItem = (
        index: number,
        options?: FocusOverlayOptions
    ): void => {
        const items = getOverlayItems(container);
        if (index < 0 || index >= items.length) {
            return;
        }

        const shouldScrollIntoView = options?.scrollIntoView ?? true;
        keyboardFocusIndex = index;
        for (const [itemIndex, item] of items.entries()) {
            if (itemIndex === index) {
                item.classList.add("overlay-item-focused");
                item.focus({ preventScroll: !shouldScrollIntoView });
                item.setAttribute("aria-selected", "true");
            } else {
                item.classList.remove("overlay-item-focused");
                item.setAttribute("aria-selected", "false");
            }
        }
    };

    container.addEventListener(
        "focus",
        (event) => {
            if (event.target === container) {
                const items = getOverlayItems(container);
                if (items.length === 0) {
                    return;
                }
                const targetIndex =
                    keyboardFocusIndex >= 0 && keyboardFocusIndex < items.length
                        ? keyboardFocusIndex
                        : 0;
                focusOverlayItem(targetIndex, { scrollIntoView: false });
            }
        },
        { signal: lifecycle.signal }
    );

    container.addEventListener(
        "keydown",
        (event) => {
            const items = getOverlayItems(container);
            if (items.length === 0) {
                return;
            }

            const clampIndex = (value: number): number => {
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
                if (
                    keyboardFocusIndex >= 0 &&
                    keyboardFocusIndex < items.length
                ) {
                    event.preventDefault();
                    items[keyboardFocusIndex]?.click();
                }
                return;
            }

            if (
                (key === "Backspace" || key === "Delete") &&
                keyboardFocusIndex >= 0 &&
                keyboardFocusIndex < items.length
            ) {
                event.preventDefault();
                const removeButton = items[keyboardFocusIndex]?.querySelector(
                    ".overlay-remove-btn"
                );
                if (removeButton instanceof HTMLElement) {
                    removeButton.click();
                }
            }
        },
        { signal: lifecycle.signal }
    );

    const updateShownFilesListForContainer = (): void => {
        const shownFilesList = container.querySelector("#shown-files-ul");
        if (!(shownFilesList instanceof HTMLUListElement)) {
            return;
        }

        shownFilesList.replaceChildren();
        const files = getLoadedFitFiles();
        if (files.length <= 1) {
            shownFilesList.parentElement
                ?.querySelector(".overlay-clear-all-btn")
                ?.remove();
            container.style.display = "none";
            container.setAttribute("aria-disabled", "true");
            assignKeyboardFocus(-1);
            return;
        }

        let anyOverlays = false;
        for (const [index, file] of files.entries()) {
            if (index === 0) {
                continue;
            }

            anyOverlays = true;
            const item: OverlayListItem = document.createElement("li");
            item.style.position = "relative";
            const displayLabel = file.filePath || "(unknown)";
            item.textContent = `File: ${displayLabel}`;
            const overlayIndex = index;
            item.dataset["overlayIndex"] = String(overlayIndex);
            item.setAttribute("role", "option");
            item.tabIndex = -1;

            const colorIndex = overlayIndex % chartOverlayColorPalette.length;
            const color = chartOverlayColorPalette[colorIndex] || "#1976d2";
            const isDark = document.body.classList.contains("theme-dark");
            const filter = isDark
                ? "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)"
                : "";
            if (filter) {
                item.style.filter = filter;
            }

            const background = isDark ? "rgb(30,34,40)" : "#fff";
            item.style.color = color;
            item.style.filter = filter;
            item.style.textShadow = isDark
                ? "0 0 2px #000, 0 0 1px #000, 0 0 1px #000"
                : "0 0 2px #fff, 0 0 1px #fff, 0 0 1px #fff";

            const filteredColor = getFilteredColor(color, filter);
            const fullPath = file.originalPath || displayLabel;
            const showWarning = !isColorAccessible(
                filteredColor || color,
                background
            );
            item.style.cursor = "pointer";
            item.setAttribute("aria-label", `Overlay ${fullPath}`);
            item.setAttribute("aria-selected", "false");

            const removeButton = document.createElement("span");
            removeButton.className = "overlay-remove-btn";
            removeButton.textContent = "×";
            removeButton.title = "Remove this overlay";
            removeButton.style.position = "absolute";
            removeButton.style.right = "6px";
            removeButton.style.top = "2px";
            removeButton.style.fontWeight = "bold";
            removeButton.style.fontSize = "1.1em";
            removeButton.style.color = isDark ? "#ff5252" : "#e53935";
            removeButton.style.background = "transparent";
            removeButton.style.border = "none";
            removeButton.style.cursor = "pointer";
            removeButton.style.opacity = "0";
            removeButton.style.transition = "opacity 0.15s";
            removeButton.setAttribute(
                "aria-label",
                `Remove overlay ${fullPath}`
            );
            removeButton.style.display = "inline-block";
            removeButton.style.lineHeight = "1";
            removeButton.setAttribute("role", "button");
            removeButton.setAttribute("tabindex", "-1");
            item.append(removeButton);

            attachOverlayListItemHandlers({
                assignKeyboardFocus,
                fullPath,
                isDark,
                li: item,
                overlayIndex,
                removeBtn: removeButton,
                scheduleOverlayStateSync,
                showWarning,
            });
            shownFilesList.append(item);
        }

        const overlayItems = getOverlayItems(container);
        container.setAttribute(
            "aria-disabled",
            overlayItems.length === 0 ? "true" : "false"
        );
        if (container.matches(":focus-within") && overlayItems.length > 0) {
            const targetIndex =
                keyboardFocusIndex >= 0 &&
                keyboardFocusIndex < overlayItems.length
                    ? keyboardFocusIndex
                    : 0;
            focusOverlayItem(targetIndex, { scrollIntoView: false });
        } else if (overlayItems.length === 0) {
            assignKeyboardFocus(-1);
        } else if (keyboardFocusIndex >= overlayItems.length) {
            assignKeyboardFocus(overlayItems.length - 1);
        }

        if (
            anyOverlays &&
            shownFilesList.parentNode instanceof HTMLElement &&
            !shownFilesList.parentNode.querySelector(".overlay-clear-all-btn")
        ) {
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
            clearAll.setAttribute(
                "aria-label",
                "Remove all overlays from the map"
            );
            clearAll.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    try {
                        clearRegisteredMapMeasurements();
                    } catch {
                        // Ignore optional map measurement cleanup failures.
                    }

                    clearOverlayLoadedFitFiles("createShownFilesList.clearAll");
                    assignKeyboardFocus(-1);
                    scheduleOverlayMapRender("createShownFilesList.clearAll");
                    updateShownFilesList();
                    queueMicrotask(removeOverlayFilenameTooltips);
                },
                { signal: lifecycle.signal }
            );
            shownFilesList.parentNode.append(clearAll);
        }

        container.style.display = "";
    };
    disposeShownFilesListUpdater = setShownFilesListUpdater(
        updateShownFilesListForContainer
    );

    if (getLoadedFitFiles().length <= 1) {
        container.style.display = "none";
    }

    return container;
}

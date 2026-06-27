import { getEnableTabButtonsHelpersRuntime } from "./enableTabButtonsHelpersRuntime.js";

/**
 * Safely get computed style values when available.
 *
 * @param element - Element to inspect.
 * @param property - CSS property name.
 *
 * @returns Computed style value when available.
 */
export function safeComputedStyle(
    element: Element,
    property: string
): string | undefined {
    try {
        const computedStyle =
            getEnableTabButtonsHelpersRuntime().getComputedStyle(element);
        if (!computedStyle) {
            return undefined;
        }

        if (typeof computedStyle.getPropertyValue === "function") {
            const directValue = computedStyle.getPropertyValue(property);
            if (directValue) {
                return directValue;
            }

            const cssPropertyName = toCssPropertyName(property);
            return cssPropertyName === property
                ? undefined
                : computedStyle.getPropertyValue(cssPropertyName) || undefined;
        }
    } catch {
        /* Ignore errors */
    }

    return undefined;
}

/**
 * Safely get an array of tab button elements.
 *
 * @returns Matching tab buttons, or an empty array when DOM access fails.
 */
export function safeQueryTabButtons(): HTMLElement[] {
    try {
        return getEnableTabButtonsHelpersRuntime().queryTabButtons();
    } catch {
        // Fall through to return [].
    }

    return [];
}

/**
 * Normalize a button identifier for comparisons.
 *
 * @param value - Button ID or label.
 *
 * @returns Normalized identifier.
 */
export function normalizeButtonId(value: string): string {
    return String(value)
        .replaceAll(/[-_\s]/gu, "")
        .toLowerCase();
}

/** Common identity data for a tab button. */
export type TabButtonIdentity = {
    id: string;
    isOpenFile: boolean;
    normalizedId: string;
    text: string;
};

/**
 * Get common identity data for a tab button.
 *
 * @param button - Button element to inspect.
 *
 * @returns Identity data used by tab-button state helpers.
 */
export function getTabButtonIdentity(button: HTMLElement): TabButtonIdentity {
    const id =
        button.id ||
        (typeof button.getAttribute === "function"
            ? button.getAttribute("id")
            : "") ||
        button.textContent?.trim() ||
        "";
    const text = (button.textContent || "").trim().toLowerCase();
    const normalizedId = normalizeButtonId(id);
    const isOpenFile =
        id === "open_file_btn" ||
        id === "open-file-btn" ||
        id === "openFileBtn" ||
        normalizedId === "openfilebtn" ||
        normalizedId === "openfilebutton" ||
        button.classList.contains("open-file-btn") ||
        text.includes("open file");

    return {
        id,
        isOpenFile,
        normalizedId,
        text,
    };
}

/**
 * Determine if a tab button corresponds to the open file control.
 *
 * @param button - Button element to inspect.
 *
 * @returns True when this is the open-file button.
 */
export function isOpenFileButton(button: HTMLElement): boolean {
    return getTabButtonIdentity(button).isOpenFile;
}

function toCssPropertyName(property: string): string {
    return property.replaceAll(
        /[A-Z]/gu,
        (character) => `-${character.toLowerCase()}`
    );
}

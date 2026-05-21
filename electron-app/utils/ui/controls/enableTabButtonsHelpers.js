/**
 * Safely get computed style values when available.
 *
 * @param element - Element to inspect.
 * @param property - CSS property name.
 *
 * @returns Computed style value when available.
 */
export function safeComputedStyle(element, property) {
    try {
        if (
            globalThis.window !== undefined &&
            typeof globalThis.getComputedStyle === "function"
        ) {
            const computedStyle = globalThis.getComputedStyle(element);
            if (typeof computedStyle.getPropertyValue === "function") {
                return computedStyle.getPropertyValue(property) || undefined;
            }
            return getIndexedStyleValue(computedStyle, property);
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
export function safeQueryTabButtons() {
    try {
        if (typeof document !== "undefined") {
            if (typeof document.querySelectorAll === "function") {
                return Array.from(document.querySelectorAll(".tab-button"));
            }
            if (typeof document.getElementsByClassName === "function") {
                return Array.from(
                    document.getElementsByClassName("tab-button")
                );
            }
        }
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
export function normalizeButtonId(value) {
    return String(value)
        .replaceAll(/[-_\s]/gu, "")
        .toLowerCase();
}
/**
 * Get common identity data for a tab button.
 *
 * @param button - Button element to inspect.
 *
 * @returns Identity data used by tab-button state helpers.
 */
export function getTabButtonIdentity(button) {
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
export function isOpenFileButton(button) {
    return getTabButtonIdentity(button).isOpenFile;
}
function getIndexedStyleValue(computedStyle, property) {
    const value = Reflect.get(computedStyle, property);
    return typeof value === "string" && value ? value : undefined;
}

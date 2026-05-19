/**
 * Escape text for safe embedding into HTML element content or quoted
 * attributes.
 *
 * Note: Prefer creating DOM nodes and assigning `textContent` where feasible.
 * This helper is intended for places where templated HTML is already used.
 */
export function escapeHtml(value: string): string {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

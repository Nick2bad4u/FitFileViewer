/**
 * @param {string} value
 *
 * @returns {string}
 */
export function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/**
 * @param {string} title
 *
 * @returns {import("../../ui/icons/iconFactory.js").AppIconName}
 */
export function resolveChartTitleIconName(title) {
    const normalized = title.toLowerCase();
    if (/power|watt|energy|calorie/u.test(normalized)) return "activity";
    if (/speed|pace|velocity/u.test(normalized)) return "gauge";
    if (/cadence|rpm/u.test(normalized)) return "activity";
    if (/heart|hr/u.test(normalized)) return "activity";
    if (/distance|elevation|altitude|grade/u.test(normalized)) return "ruler";
    if (/time|timeline|timestamp/u.test(normalized)) return "timer";
    if (/lap|route|track|map/u.test(normalized)) return "route";
    return "table";
}

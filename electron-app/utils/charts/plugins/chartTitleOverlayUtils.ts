import type { AppIconName } from "../../ui/icons/iconFactory.js";

/**
 * Escape text for safe embedding into chart title overlay HTML.
 */
export function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/**
 * Resolve the icon that best represents a chart title.
 */
export function resolveChartTitleIconName(title: string): AppIconName {
    const normalized = title.toLowerCase();

    if (/power|watt|energy|calorie/u.test(normalized)) {
        return "activity";
    }

    if (/speed|pace|velocity/u.test(normalized)) {
        return "gauge";
    }

    if (/cadence|rpm/u.test(normalized)) {
        return "activity";
    }

    if (/heart|hr/u.test(normalized)) {
        return "activity";
    }

    if (/distance|elevation|altitude|grade/u.test(normalized)) {
        return "ruler";
    }

    if (/time|timeline|timestamp/u.test(normalized)) {
        return "timer";
    }

    if (/lap|route|track|map/u.test(normalized)) {
        return "route";
    }

    return "table";
}

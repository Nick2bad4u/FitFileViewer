/**
 * Minimal internal icon registry for consistent inline SVG usage.
 *
 * Icons are intentionally stroke-based and currentColor-driven so they inherit
 * existing theme colors without bespoke CSS.
 */

/** @typedef {
 *     | "activity"
 *     | "arrowLeft"
 *     | "arrowRight"
 *     | "bike"
 *     | "calendar"
 *     | "calendarRange"
 *     | "calendarWeek"
 *     | "circleHelp"
 *     | "circleX"
 *     | "database"
 *     | "file"
 *     | "folder"
 *     | "folderOpen"
 *     | "gauge"
 *     | "hash"
 *     | "history"
 *     | "map"
 *     | "route"
 *     | "ruler"
 *     | "settings"
 *     | "table"
 *     | "target"
 *     | "timer"} AppIconName */

/** @type {Record<AppIconName, string>} */
const ICON_PATHS = {
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
    arrowLeft: '<path d="m15 18-6-6 6-6"></path>',
    arrowRight: '<path d="m9 18 6-6-6-6"></path>',
    bike: '<circle cx="6" cy="17" r="3"></circle><circle cx="18" cy="17" r="3"></circle><path d="m6 17 6-9 3 4h3"></path><path d="m11 8 2-3"></path>',
    calendar:
        '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path>',
    calendarRange:
        '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M3 10h18"></path><path d="M8 14h8"></path><path d="M8 18h5"></path>',
    calendarWeek:
        '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="M3 10h18"></path><path d="M7 14h2"></path><path d="M11 14h2"></path><path d="M15 14h2"></path>',
    circleHelp:
        '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4"></path><path d="M12 17h.01"></path>',
    circleX:
        '<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>',
    database:
        '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"></path><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"></path>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path>',
    folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    folderOpen:
        '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1"></path><path d="M3 10h19l-2 8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>',
    gauge: '<path d="m12 14 4-4"></path><path d="M3.34 18a10 10 0 1 1 17.32 0"></path>',
    hash: '<line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>',
    history:
        '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3 2"></path>',
    map: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line>',
    route: '<circle cx="6" cy="19" r="2"></circle><circle cx="18" cy="5" r="2"></circle><path d="M8 18c2-2 6-2 8-6"></path><path d="M6 5h4"></path><path d="M6 9h3"></path>',
    ruler: '<path d="M3 7V3h4"></path><path d="M21 17v4h-4"></path><path d="M5 5 19 19"></path><path d="M9 9 7 7"></path><path d="M13 13 11 11"></path><path d="M17 17 15 15"></path>',
    settings:
        '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"></path>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 10h18"></path><path d="M9 4v16"></path><path d="M15 4v16"></path>',
    target: '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
    timer: '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M9 3h6"></path><path d="m14 3 1 2"></path>',
};

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {{ min?: number; max?: number }} [bounds]
 *
 * @returns {number}
 */
function toBoundedNumber(value, fallback, bounds = {}) {
    const n =
        typeof value === "number" && Number.isFinite(value) ? value : fallback;
    const { max = Number.POSITIVE_INFINITY, min = 0 } = bounds;
    return Math.min(Math.max(n, min), max);
}

/**
 * Build an inline SVG string for a known app icon.
 *
 * @param {AppIconName} name
 * @param {{
 *     className?: string;
 *     size?: number;
 *     strokeWidth?: number;
 *     title?: string;
 * }} [options]
 *
 * @returns {string}
 */
export function getAppIconSvg(name, options = {}) {
    const className =
        typeof options.className === "string" &&
        options.className.trim().length > 0
            ? ` class="${options.className.trim()}"`
            : "";
    const size = toBoundedNumber(options.size, 16, { min: 10, max: 48 });
    const strokeWidth = toBoundedNumber(options.strokeWidth, 2, {
        min: 1,
        max: 3,
    });
    const title =
        typeof options.title === "string" && options.title.trim().length > 0
            ? `<title>${options.title}</title>`
            : "";

    const iconMarkup = ICON_PATHS[name] || ICON_PATHS.target;
    return `<svg${className} xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${title}${iconMarkup}</svg>`;
}

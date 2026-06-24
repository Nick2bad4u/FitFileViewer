/**
 * Minimal internal icon registry for consistent inline SVG usage.
 *
 * Icons are intentionally stroke-based and currentColor-driven so they inherit
 * existing theme colors without bespoke CSS.
 */

import {
    getIconFactoryRuntime,
    SVG_NAMESPACE,
    type IconFactoryRuntime,
} from "./iconFactoryRuntime.js";

/** Known icon names supported by the legacy icon factory. */
export type AppIconName =
    | "activity"
    | "arrowLeft"
    | "arrowRight"
    | "bike"
    | "calendar"
    | "calendarRange"
    | "calendarWeek"
    | "circleHelp"
    | "circleX"
    | "database"
    | "file"
    | "folder"
    | "folderOpen"
    | "gauge"
    | "hash"
    | "history"
    | "map"
    | "route"
    | "ruler"
    | "settings"
    | "table"
    | "target"
    | "timer";

/** Options accepted by the legacy icon SVG factory. */
export type AppIconSvgOptions = {
    readonly className?: string;
    readonly size?: number;
    readonly strokeWidth?: number;
    readonly title?: string;
};

type AppIconNodeTag =
    | "circle"
    | "ellipse"
    | "line"
    | "path"
    | "polygon"
    | "polyline"
    | "rect";

type AppIconNodeSpec = {
    readonly attrs: Readonly<Record<string, string>>;
    readonly tag: AppIconNodeTag;
};

const ICON_NODE_SPECS: Record<AppIconName, readonly AppIconNodeSpec[]> = {
    activity: [
        {
            attrs: { points: "22 12 18 12 15 21 9 3 6 12 2 12" },
            tag: "polyline",
        },
    ],
    arrowLeft: [{ attrs: { d: "m15 18-6-6 6-6" }, tag: "path" }],
    arrowRight: [{ attrs: { d: "m9 18 6-6-6-6" }, tag: "path" }],
    bike: [
        { attrs: { cx: "6", cy: "17", r: "3" }, tag: "circle" },
        { attrs: { cx: "18", cy: "17", r: "3" }, tag: "circle" },
        { attrs: { d: "m6 17 6-9 3 4h3" }, tag: "path" },
        { attrs: { d: "m11 8 2-3" }, tag: "path" },
    ],
    calendar: [
        {
            attrs: { height: "18", rx: "2", width: "18", x: "3", y: "4" },
            tag: "rect",
        },
        { attrs: { d: "M16 2v4" }, tag: "path" },
        { attrs: { d: "M8 2v4" }, tag: "path" },
        { attrs: { d: "M3 10h18" }, tag: "path" },
    ],
    calendarRange: [
        {
            attrs: { height: "18", rx: "2", width: "18", x: "3", y: "4" },
            tag: "rect",
        },
        { attrs: { d: "M8 2v4" }, tag: "path" },
        { attrs: { d: "M16 2v4" }, tag: "path" },
        { attrs: { d: "M3 10h18" }, tag: "path" },
        { attrs: { d: "M8 14h8" }, tag: "path" },
        { attrs: { d: "M8 18h5" }, tag: "path" },
    ],
    calendarWeek: [
        {
            attrs: { height: "18", rx: "2", width: "18", x: "3", y: "4" },
            tag: "rect",
        },
        { attrs: { d: "M8 2v4" }, tag: "path" },
        { attrs: { d: "M16 2v4" }, tag: "path" },
        { attrs: { d: "M3 10h18" }, tag: "path" },
        { attrs: { d: "M7 14h2" }, tag: "path" },
        { attrs: { d: "M11 14h2" }, tag: "path" },
        { attrs: { d: "M15 14h2" }, tag: "path" },
    ],
    circleHelp: [
        { attrs: { cx: "12", cy: "12", r: "10" }, tag: "circle" },
        { attrs: { d: "M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" }, tag: "path" },
        { attrs: { d: "M12 17h.01" }, tag: "path" },
    ],
    circleX: [
        { attrs: { cx: "12", cy: "12", r: "10" }, tag: "circle" },
        { attrs: { d: "m15 9-6 6" }, tag: "path" },
        { attrs: { d: "m9 9 6 6" }, tag: "path" },
    ],
    database: [
        { attrs: { cx: "12", cy: "5", rx: "9", ry: "3" }, tag: "ellipse" },
        { attrs: { d: "M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" }, tag: "path" },
        { attrs: { d: "M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" }, tag: "path" },
    ],
    file: [
        {
            attrs: {
                d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
            },
            tag: "path",
        },
        { attrs: { d: "M14 2v6h6" }, tag: "path" },
    ],
    folder: [
        {
            attrs: {
                d: "M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
            },
            tag: "path",
        },
    ],
    folderOpen: [
        {
            attrs: { d: "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1" },
            tag: "path",
        },
        {
            attrs: { d: "M3 10h19l-2 8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" },
            tag: "path",
        },
    ],
    gauge: [
        { attrs: { d: "m12 14 4-4" }, tag: "path" },
        { attrs: { d: "M3.34 18a10 10 0 1 1 17.32 0" }, tag: "path" },
    ],
    hash: [
        { attrs: { x1: "4", x2: "20", y1: "9", y2: "9" }, tag: "line" },
        { attrs: { x1: "4", x2: "20", y1: "15", y2: "15" }, tag: "line" },
        { attrs: { x1: "10", x2: "8", y1: "3", y2: "21" }, tag: "line" },
        { attrs: { x1: "16", x2: "14", y1: "3", y2: "21" }, tag: "line" },
    ],
    history: [
        { attrs: { d: "M3 12a9 9 0 1 0 3-6.7" }, tag: "path" },
        { attrs: { d: "M3 3v5h5" }, tag: "path" },
        { attrs: { d: "M12 7v5l3 2" }, tag: "path" },
    ],
    map: [
        {
            attrs: { points: "3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" },
            tag: "polygon",
        },
        { attrs: { x1: "9", x2: "9", y1: "3", y2: "18" }, tag: "line" },
        { attrs: { x1: "15", x2: "15", y1: "6", y2: "21" }, tag: "line" },
    ],
    route: [
        { attrs: { cx: "6", cy: "19", r: "2" }, tag: "circle" },
        { attrs: { cx: "18", cy: "5", r: "2" }, tag: "circle" },
        { attrs: { d: "M8 18c2-2 6-2 8-6" }, tag: "path" },
        { attrs: { d: "M6 5h4" }, tag: "path" },
        { attrs: { d: "M6 9h3" }, tag: "path" },
    ],
    ruler: [
        { attrs: { d: "M3 7V3h4" }, tag: "path" },
        { attrs: { d: "M21 17v4h-4" }, tag: "path" },
        { attrs: { d: "M5 5 19 19" }, tag: "path" },
        { attrs: { d: "M9 9 7 7" }, tag: "path" },
        { attrs: { d: "M13 13 11 11" }, tag: "path" },
        { attrs: { d: "M17 17 15 15" }, tag: "path" },
    ],
    settings: [
        { attrs: { cx: "12", cy: "12", r: "3" }, tag: "circle" },
        {
            attrs: {
                d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z",
            },
            tag: "path",
        },
    ],
    table: [
        {
            attrs: { height: "16", rx: "2", width: "18", x: "3", y: "4" },
            tag: "rect",
        },
        { attrs: { d: "M3 10h18" }, tag: "path" },
        { attrs: { d: "M9 4v16" }, tag: "path" },
        { attrs: { d: "M15 4v16" }, tag: "path" },
    ],
    target: [
        { attrs: { cx: "12", cy: "12", r: "10" }, tag: "circle" },
        { attrs: { cx: "12", cy: "12", r: "6" }, tag: "circle" },
        { attrs: { cx: "12", cy: "12", r: "2" }, tag: "circle" },
    ],
    timer: [
        { attrs: { cx: "12", cy: "13", r: "8" }, tag: "circle" },
        { attrs: { d: "M12 9v4l2 2" }, tag: "path" },
        { attrs: { d: "M9 3h6" }, tag: "path" },
        { attrs: { d: "m14 3 1 2" }, tag: "path" },
    ],
};

function createSvgChild(
    spec: AppIconNodeSpec,
    runtime: IconFactoryRuntime
): SVGElement {
    const element = runtime.createSvgElement(spec.tag);
    for (const [name, value] of Object.entries(spec.attrs)) {
        element.setAttribute(name, value);
    }
    return element;
}

function escapeSvgText(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function escapeSvgAttribute(value: string): string {
    return escapeSvgText(value).replaceAll('"', "&quot;");
}

function serializeSvgChild(spec: AppIconNodeSpec): string {
    const attributes = Object.entries(spec.attrs)
        .map(
            ([name, value]) => `${name}="${escapeSvgAttribute(String(value))}"`
        )
        .join(" ");

    return `<${spec.tag} ${attributes}></${spec.tag}>`;
}

function toBoundedNumber(
    value: unknown,
    fallback: number,
    bounds: { readonly max?: number; readonly min?: number } = {}
): number {
    const n =
        typeof value === "number" && Number.isFinite(value) ? value : fallback;
    const { max = Number.POSITIVE_INFINITY, min = 0 } = bounds;
    return Math.min(Math.max(n, min), max);
}

/**
 * Build an inline SVG string for a known app icon.
 *
 * @param name - Icon name to render.
 * @param options - SVG sizing, class, stroke, and title options.
 *
 * @returns Serialized SVG markup.
 */
export function getAppIconSvg(
    name: AppIconName,
    options: AppIconSvgOptions = {}
): string {
    const className =
        typeof options.className === "string" &&
        options.className.trim().length > 0
            ? ` class="${escapeSvgAttribute(options.className.trim())}"`
            : "";
    const size = toBoundedNumber(options.size, 16, { min: 10, max: 48 });
    const strokeWidth = toBoundedNumber(options.strokeWidth, 2, {
        min: 1,
        max: 3,
    });
    const title =
        typeof options.title === "string" && options.title.trim().length > 0
            ? `<title>${escapeSvgText(options.title)}</title>`
            : "";

    const iconSpecs = ICON_NODE_SPECS[name] || ICON_NODE_SPECS.target;
    const iconMarkup = iconSpecs
        .map((spec) => serializeSvgChild(spec))
        .join("");
    return `<svg${className} xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${title}${iconMarkup}</svg>`;
}

/**
 * Build an inline SVG element for a known app icon.
 *
 * @param name - Icon name to render.
 * @param options - SVG sizing, class, stroke, and title options.
 *
 * @returns SVG element instance.
 */
export function createAppIconElement(
    name: AppIconName,
    options: AppIconSvgOptions = {},
    runtime: IconFactoryRuntime = getIconFactoryRuntime()
): SVGSVGElement {
    const icon = runtime.createSvgElement("svg");
    const size = toBoundedNumber(options.size, 16, { min: 10, max: 48 });
    const strokeWidth = toBoundedNumber(options.strokeWidth, 2, {
        min: 1,
        max: 3,
    });

    if (
        typeof options.className === "string" &&
        options.className.trim().length > 0
    ) {
        icon.classList.add(...options.className.trim().split(/\s+/u));
    }
    icon.setAttribute("xmlns", SVG_NAMESPACE);
    icon.setAttribute("width", String(size));
    icon.setAttribute("height", String(size));
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", String(strokeWidth));
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    if (typeof options.title === "string" && options.title.trim().length > 0) {
        const title = runtime.createSvgElement("title");
        title.textContent = options.title;
        icon.append(title);
    }

    const iconSpecs = ICON_NODE_SPECS[name] || ICON_NODE_SPECS.target;
    for (const spec of iconSpecs) {
        icon.append(createSvgChild(spec, runtime));
    }

    return icon;
}

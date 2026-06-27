const DEFAULT_RENDERER_ACTIVE_TAB = "summary";

export const RENDERER_TAB_NAMES = [
    "altfit",
    "browser",
    "chart",
    "chartjs",
    "data",
    "map",
    "summary",
    "zwift",
] as const;

export type RendererTabName = (typeof RENDERER_TAB_NAMES)[number];

const rendererTabNames = new Set<string>(RENDERER_TAB_NAMES);
const rendererChartTabNames = new Set<string>(["chart", "chartjs"]);

export function isRendererTabName(value: unknown): value is RendererTabName {
    return typeof value === "string" && rendererTabNames.has(value);
}

export function normalizeRendererActiveTab(value: unknown): string {
    return isRendererTabName(value) ? value : DEFAULT_RENDERER_ACTIVE_TAB;
}

export function isRendererChartTab(value: unknown): boolean {
    return rendererChartTabNames.has(normalizeRendererActiveTab(value));
}

import {
    getState,
    setState,
    subscribe,
    type StateListener,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_ACTIVE_TAB_STATE_PATH = "ui.activeTab";
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

export function getRendererActiveTab(): string {
    return normalizeRendererActiveTab(getState(RENDERER_ACTIVE_TAB_STATE_PATH));
}

export function isRendererActiveTab(tabName: string): boolean {
    return getRendererActiveTab() === tabName;
}

export function isRendererTabName(value: unknown): value is RendererTabName {
    return typeof value === "string" && rendererTabNames.has(value);
}

export function subscribeToRendererActiveTab(
    callback: StateListener
): () => void {
    return subscribe(RENDERER_ACTIVE_TAB_STATE_PATH, callback);
}

export function setRendererActiveTab(
    tabName: string,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_ACTIVE_TAB_STATE_PATH,
        normalizeRendererActiveTab(tabName),
        {
            source: "rendererActiveTabState.set",
            ...options,
        }
    );
}

export function replaceRendererActiveTab(
    currentTabName: string,
    nextTabName: string,
    options: StateUpdateOptions = {}
): boolean {
    if (!isRendererActiveTab(currentTabName)) {
        return false;
    }

    setRendererActiveTab(nextTabName, {
        source: "rendererActiveTabState.replace",
        ...options,
    });
    return true;
}

export function normalizeRendererActiveTab(value: unknown): string {
    return isRendererTabName(value) ? value : DEFAULT_RENDERER_ACTIVE_TAB;
}

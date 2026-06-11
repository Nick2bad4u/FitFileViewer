import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_ACTIVE_TAB_STATE_PATH = "ui.activeTab";
const DEFAULT_RENDERER_ACTIVE_TAB = "summary";

export function getRendererActiveTab(): string {
    return normalizeRendererActiveTab(
        getState(RENDERER_ACTIVE_TAB_STATE_PATH)
    );
}

export function isRendererActiveTab(tabName: string): boolean {
    return getRendererActiveTab() === tabName;
}

export function setRendererActiveTab(
    tabName: string,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_ACTIVE_TAB_STATE_PATH, normalizeRendererActiveTab(tabName), {
        source: "rendererActiveTabState.set",
        ...options,
    });
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
    return typeof value === "string" && value.trim() !== ""
        ? value
        : DEFAULT_RENDERER_ACTIVE_TAB;
}

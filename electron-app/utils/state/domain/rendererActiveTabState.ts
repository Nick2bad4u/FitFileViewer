import {
    getState,
    setState,
    subscribe,
    type StateListener,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export {
    isRendererChartTab,
    isRendererTabName,
    normalizeRendererActiveTab,
    RENDERER_TAB_NAMES,
    type RendererTabName,
} from "./rendererActiveTabContract.js";
import { normalizeRendererActiveTab } from "./rendererActiveTabContract.js";

const RENDERER_ACTIVE_TAB_STATE_PATH = "ui.activeTab";

export function getRendererActiveTab(): string {
    return normalizeRendererActiveTab(getState(RENDERER_ACTIVE_TAB_STATE_PATH));
}

export function isRendererActiveTab(tabName: string): boolean {
    return getRendererActiveTab() === tabName;
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

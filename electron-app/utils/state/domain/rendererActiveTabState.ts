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
const RENDERER_ACTIVE_TAB_CONTENT_STATE_PATH = "ui.activeTabContent";

type RendererActiveTabStateReader = (path: string) => unknown;
type RendererActiveTabStateWriter = (
    path: string,
    value: unknown,
    options?: StateUpdateOptions
) => void;
type RendererActiveTabStateListener = (
    newValue: unknown,
    oldValue?: unknown,
    path?: string
) => void;
type RendererActiveTabStateSubscriber = (
    path: string,
    callback: RendererActiveTabStateListener
) => unknown;
type RendererActiveTabStateSingletonSubscriber = (
    path: string,
    key: string,
    callback: RendererActiveTabStateListener
) => unknown;

export function getRendererActiveTab(): string {
    return normalizeRendererActiveTab(getState(RENDERER_ACTIVE_TAB_STATE_PATH));
}

export function getRendererActiveTabFromState(
    readState: RendererActiveTabStateReader
): string {
    return normalizeRendererActiveTab(readState(RENDERER_ACTIVE_TAB_STATE_PATH));
}

export function getRendererActiveTabContentFromState(
    readState: RendererActiveTabStateReader
): string {
    return normalizeRendererActiveTab(
        readState(RENDERER_ACTIVE_TAB_CONTENT_STATE_PATH)
    );
}

export function isRendererActiveTab(tabName: string): boolean {
    return getRendererActiveTab() === tabName;
}

export function subscribeToRendererActiveTab(
    callback: StateListener
): () => void {
    return subscribe(RENDERER_ACTIVE_TAB_STATE_PATH, callback);
}

export function subscribeToRendererActiveTabInState(
    subscribeState: RendererActiveTabStateSubscriber,
    callback: RendererActiveTabStateListener
): unknown {
    return subscribeState(RENDERER_ACTIVE_TAB_STATE_PATH, callback);
}

export function subscribeToRendererActiveTabSingletonInState(
    subscribeState: RendererActiveTabStateSingletonSubscriber,
    key: string,
    callback: RendererActiveTabStateListener
): unknown {
    return subscribeState(RENDERER_ACTIVE_TAB_STATE_PATH, key, callback);
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

export function setRendererActiveTabInState(
    writeState: RendererActiveTabStateWriter,
    tabName: string,
    options: StateUpdateOptions = {}
): void {
    writeState(
        RENDERER_ACTIVE_TAB_STATE_PATH,
        normalizeRendererActiveTab(tabName),
        {
            source: "rendererActiveTabState.setInState",
            ...options,
        }
    );
}

export function setRendererActiveTabContentInState(
    writeState: RendererActiveTabStateWriter,
    tabName: string,
    options: StateUpdateOptions = {}
): void {
    writeState(
        RENDERER_ACTIVE_TAB_CONTENT_STATE_PATH,
        normalizeRendererActiveTab(tabName),
        {
            source: "rendererActiveTabState.setContentInState",
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

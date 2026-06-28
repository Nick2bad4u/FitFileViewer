import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export { normalizeRendererSidebarCollapsed } from "./rendererLayoutContract.js";
import { normalizeRendererSidebarCollapsed } from "./rendererLayoutContract.js";

const RENDERER_SIDEBAR_COLLAPSED_STATE_PATH = "ui.sidebarCollapsed";

export function isRendererSidebarCollapsed(): boolean {
    return normalizeRendererSidebarCollapsed(
        getState(RENDERER_SIDEBAR_COLLAPSED_STATE_PATH)
    );
}

export function setRendererSidebarCollapsed(
    collapsed: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_SIDEBAR_COLLAPSED_STATE_PATH,
        normalizeRendererSidebarCollapsed(collapsed),
        {
            source: "rendererLayoutState.setSidebarCollapsed",
            ...options,
        }
    );
}

import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_TAB_BUTTONS_ENABLED_STATE_PATH = "ui.tabButtonsEnabled";

export function areRendererTabButtonsEnabled(): boolean {
    return normalizeRendererTabButtonsEnabled(
        getState(RENDERER_TAB_BUTTONS_ENABLED_STATE_PATH)
    );
}

export function setRendererTabButtonsEnabled(
    enabled: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_TAB_BUTTONS_ENABLED_STATE_PATH, enabled, {
        source: "rendererTabButtonsState.set",
        ...options,
    });
}

export function normalizeRendererTabButtonsEnabled(value: unknown): boolean {
    return value === true;
}

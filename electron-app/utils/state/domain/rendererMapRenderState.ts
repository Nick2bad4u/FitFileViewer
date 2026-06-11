import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_MAP_RENDERED_STATE_PATH = "map.isRendered";

export function isRendererMapRendered(): boolean {
    return getState(RENDERER_MAP_RENDERED_STATE_PATH) === true;
}

export function setRendererMapRendered(
    isRendered: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_MAP_RENDERED_STATE_PATH, isRendered, {
        source: "rendererMapRenderState.set",
        ...options,
    });
}

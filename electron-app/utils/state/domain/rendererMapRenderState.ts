import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
import { normalizeRendererRenderFlag } from "./rendererRenderStateContract.js";

const RENDERER_MAP_RENDERED_STATE_PATH = "map.isRendered";

export function isRendererMapRendered(): boolean {
    return normalizeRendererRenderFlag(
        getState(RENDERER_MAP_RENDERED_STATE_PATH)
    );
}

export function setRendererMapRendered(
    isRendered: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_MAP_RENDERED_STATE_PATH,
        normalizeRendererRenderFlag(isRendered),
        {
            source: "rendererMapRenderState.set",
            ...options,
        }
    );
}

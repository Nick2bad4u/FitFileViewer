import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
import { normalizeMapBaseLayer } from "./mapBaseLayerContract.js";

const MAP_BASE_LAYER_STATE_PATH = "map.baseLayer";

export function getMapBaseLayer(): string {
    return normalizeMapBaseLayer(getState(MAP_BASE_LAYER_STATE_PATH));
}

export function setMapBaseLayer(
    baseLayer: string,
    options: StateUpdateOptions = {}
): void {
    setState(MAP_BASE_LAYER_STATE_PATH, normalizeMapBaseLayer(baseLayer), {
        source: "mapBaseLayerState.set",
        ...options,
    });
}

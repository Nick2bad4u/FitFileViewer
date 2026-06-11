import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const MAP_BASE_LAYER_STATE_PATH = "map.baseLayer";
const DEFAULT_MAP_BASE_LAYER = "OpenStreetMap";

export function getMapBaseLayer(): string {
    const baseLayer = getState(MAP_BASE_LAYER_STATE_PATH);
    return typeof baseLayer === "string" && baseLayer.trim() !== ""
        ? baseLayer
        : DEFAULT_MAP_BASE_LAYER;
}

export function setMapBaseLayer(
    baseLayer: string,
    options: StateUpdateOptions = {}
): void {
    setState(MAP_BASE_LAYER_STATE_PATH, baseLayer, {
        source: "mapBaseLayerState.set",
        ...options,
    });
}

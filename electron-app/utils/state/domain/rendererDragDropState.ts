import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export {
    normalizeDragCounter,
    normalizeDropOverlayVisible,
    type RendererDropOverlayState,
} from "./rendererDragDropContract.js";
import {
    normalizeDragCounter,
    normalizeDropOverlayVisible,
} from "./rendererDragDropContract.js";

const RENDERER_DRAG_COUNTER_STATE_PATH = "ui.dragCounter";
const RENDERER_DROP_OVERLAY_VISIBLE_STATE_PATH = "ui.dropOverlay.visible";

export function getRendererDragCounter(): number {
    return normalizeDragCounter(getState(RENDERER_DRAG_COUNTER_STATE_PATH));
}

export function setRendererDragCounter(
    value: number,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_DRAG_COUNTER_STATE_PATH, normalizeDragCounter(value), {
        source: "rendererDragDropState.dragCounter",
        ...options,
    });
}

export function isRendererDropOverlayVisible(): boolean {
    return normalizeDropOverlayVisible(
        getState(RENDERER_DROP_OVERLAY_VISIBLE_STATE_PATH)
    );
}

export function setRendererDropOverlayVisible(
    visible: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_DROP_OVERLAY_VISIBLE_STATE_PATH,
        normalizeDropOverlayVisible(visible),
        {
            source: "rendererDragDropState.dropOverlay",
            ...options,
        }
    );
}

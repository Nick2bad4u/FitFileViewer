import {
    getState,
    setState,
    subscribe,
    type StateUpdateOptions,
    updateState,
} from "../core/stateManager.js";
export {
    DEFAULT_RENDERER_LOADING_INDICATOR,
    normalizeRendererLoading,
    normalizeRendererLoadingIndicator,
    type RendererLoadingIndicatorState,
} from "./rendererLoadingContract.js";
import {
    normalizeRendererLoading,
    normalizeRendererLoadingIndicator,
    type RendererLoadingIndicatorState,
} from "./rendererLoadingContract.js";

const RENDERER_LOADING_STATE_PATH = "isLoading";
const RENDERER_LOADING_INDICATOR_STATE_PATH = "ui.loadingIndicator";

type RendererLoadingIndicatorListener = (
    indicator: RendererLoadingIndicatorState
) => void;
type RendererLoadingListener = (loading: boolean) => void;
type RendererLoadingStateReader = (path: string) => unknown;

export function isRendererLoading(): boolean {
    return normalizeRendererLoading(getState(RENDERER_LOADING_STATE_PATH));
}

export function getRendererLoadingFromState(
    readState: RendererLoadingStateReader
): boolean {
    return normalizeRendererLoading(readState(RENDERER_LOADING_STATE_PATH));
}

export function setRendererLoading(
    loading: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_LOADING_STATE_PATH, normalizeRendererLoading(loading), {
        source: "rendererLoadingState.set",
        ...options,
    });
}

export function getRendererLoadingIndicator(): RendererLoadingIndicatorState {
    return normalizeRendererLoadingIndicator(
        getState(RENDERER_LOADING_INDICATOR_STATE_PATH)
    );
}

export function updateRendererLoadingIndicator(
    indicator: RendererLoadingIndicatorState,
    options: StateUpdateOptions = {}
): void {
    updateState(
        RENDERER_LOADING_INDICATOR_STATE_PATH,
        normalizeRendererLoadingIndicator(indicator),
        {
            source: "rendererLoadingState.updateIndicator",
            ...options,
        }
    );
}

export function subscribeToRendererLoading(
    listener: RendererLoadingListener
): () => void {
    return subscribe(RENDERER_LOADING_STATE_PATH, (loading) => {
        listener(normalizeRendererLoading(loading));
    });
}

export function subscribeToRendererLoadingIndicator(
    listener: RendererLoadingIndicatorListener
): () => void {
    return subscribe(RENDERER_LOADING_INDICATOR_STATE_PATH, (indicator) => {
        listener(normalizeRendererLoadingIndicator(indicator));
    });
}

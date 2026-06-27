import {
    getState,
    setState,
    subscribe,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export { normalizeRendererLoading } from "./rendererLoadingContract.js";
import { normalizeRendererLoading } from "./rendererLoadingContract.js";

const RENDERER_LOADING_STATE_PATH = "isLoading";

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

export function subscribeToRendererLoading(
    listener: RendererLoadingListener
): () => void {
    return subscribe(RENDERER_LOADING_STATE_PATH, (loading) => {
        listener(normalizeRendererLoading(loading));
    });
}

import {
    getState,
    setState,
    subscribe,
    type StateListener,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export {
    normalizeRendererTheme,
    type RendererThemeName,
} from "./rendererThemeContract.js";
import { normalizeRendererTheme } from "./rendererThemeContract.js";

const RENDERER_THEME_STATE_PATH = "ui.theme";
const RENDERER_PREVIOUS_THEME_STATE_PATH = "ui.previousTheme";

export function getRendererTheme(): string {
    return normalizeRendererTheme(getState(RENDERER_THEME_STATE_PATH));
}

export function getRendererPreviousTheme(): unknown {
    return getState(RENDERER_PREVIOUS_THEME_STATE_PATH);
}

export function setRendererTheme(
    theme: string,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_THEME_STATE_PATH, normalizeRendererTheme(theme), {
        source: "rendererThemeState.set",
        ...options,
    });
}

export function setRendererPreviousTheme(
    theme: string,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_PREVIOUS_THEME_STATE_PATH,
        normalizeRendererTheme(theme),
        {
            source: "rendererThemeState.setPrevious",
            ...options,
        }
    );
}

export function subscribeToRendererTheme(callback: StateListener): () => void {
    return subscribe(RENDERER_THEME_STATE_PATH, callback);
}

import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_THEME_STATE_PATH = "ui.theme";
const DEFAULT_RENDERER_THEME = "system";

export function getRendererTheme(): string {
    return normalizeRendererTheme(getState(RENDERER_THEME_STATE_PATH));
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

export function normalizeRendererTheme(value: unknown): string {
    return typeof value === "string" && value.trim() !== ""
        ? value
        : DEFAULT_RENDERER_THEME;
}

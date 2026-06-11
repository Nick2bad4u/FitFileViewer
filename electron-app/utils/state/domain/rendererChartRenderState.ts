import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_CHARTS_RENDERED_STATE_PATH = "charts.isRendered";

export function areRendererChartsRendered(): boolean {
    return normalizeRendererChartsRendered(
        getState(RENDERER_CHARTS_RENDERED_STATE_PATH)
    );
}

export function setRendererChartsRendered(
    rendered: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_CHARTS_RENDERED_STATE_PATH,
        normalizeRendererChartsRendered(rendered),
        {
            source: "rendererChartRenderState.setRendered",
            ...options,
        }
    );
}

export function normalizeRendererChartsRendered(value: unknown): boolean {
    return value === true;
}

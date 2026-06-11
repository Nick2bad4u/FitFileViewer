import {
    getState,
    setState,
    updateState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_CHARTS_RENDERED_STATE_PATH = "charts.isRendered";
const RENDERER_CHART_PREVIOUS_STATE_PATH = "charts.previousState";

export type RendererChartPreviousState = {
    chartCount: number;
    timestamp: number;
    visibleFields: number;
};

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

export function setRendererChartPreviousState(
    previousState: RendererChartPreviousState,
    options: StateUpdateOptions = {}
): void {
    updateState(RENDERER_CHART_PREVIOUS_STATE_PATH, previousState, {
        source: "rendererChartRenderState.setPreviousState",
        ...options,
    });
}

export function normalizeRendererChartsRendered(value: unknown): boolean {
    return value === true;
}

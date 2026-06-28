import {
    getState,
    setState,
    subscribe,
    type StateListener,
    updateState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
export { normalizeRendererRenderFlag as normalizeRendererChartsRendered } from "./rendererRenderStateContract.js";
import { normalizeRendererRenderFlag } from "./rendererRenderStateContract.js";

const RENDERER_CHART_STATE_PATH = "charts";
const RENDERER_CHARTS_RENDERED_STATE_PATH = "charts.isRendered";
const RENDERER_CHART_PREVIOUS_STATE_PATH = "charts.previousState";
const RENDERER_CHART_RENDERING_STATE_PATH = "charts.isRendering";
const RENDERER_CHART_LAST_RENDER_TIME_STATE_PATH = "charts.lastRenderTime";
const RENDERER_CHART_SELECTED_STATE_PATH = "charts.selectedChart";
const RENDERER_CHART_TAB_ACTIVE_STATE_PATH = "charts.tabActive";

export type RendererChartPreviousState = {
    chartCount: number;
    timestamp: number;
    visibleFields: number;
};

export type RendererChartRenderClearState = {
    chartData: null;
    isRendered: false;
    renderedCount: 0;
};

export function areRendererChartsRendered(): boolean {
    return normalizeRendererRenderFlag(
        getState(RENDERER_CHARTS_RENDERED_STATE_PATH)
    );
}

export function isRendererChartRendering(): boolean {
    return normalizeRendererRenderFlag(
        getState(RENDERER_CHART_RENDERING_STATE_PATH)
    );
}

export function getRendererChartState(): Record<string, unknown> | undefined {
    const chartState = getState(RENDERER_CHART_STATE_PATH);
    return isRecord(chartState) ? chartState : undefined;
}

export function setRendererChartLastRenderTime(
    timestamp: number,
    options: StateUpdateOptions = {}
): void {
    setState(RENDERER_CHART_LAST_RENDER_TIME_STATE_PATH, timestamp, {
        source: "rendererChartRenderState.setLastRenderTime",
        ...options,
    });
}

export function setRendererChartRendering(
    rendering: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_CHART_RENDERING_STATE_PATH,
        normalizeRendererRenderFlag(rendering),
        {
            source: "rendererChartRenderState.setRendering",
            ...options,
        }
    );
}

export function setRendererChartTabActive(
    active: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_CHART_TAB_ACTIVE_STATE_PATH,
        normalizeRendererRenderFlag(active),
        {
            source: "rendererChartRenderState.setTabActive",
            ...options,
        }
    );
}

export function setRendererChartsRendered(
    rendered: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_CHARTS_RENDERED_STATE_PATH,
        normalizeRendererRenderFlag(rendered),
        {
            source: "rendererChartRenderState.setRendered",
            ...options,
        }
    );
}

export function subscribeToRendererSelectedChart(
    callback: StateListener
): () => void {
    return subscribe(RENDERER_CHART_SELECTED_STATE_PATH, callback);
}

export function subscribeToRendererChartsRendered(
    callback: StateListener
): () => void {
    return subscribe(RENDERER_CHARTS_RENDERED_STATE_PATH, callback);
}

export function updateRendererChartState(
    chartState: Record<string, unknown>,
    options: StateUpdateOptions = {}
): void {
    updateState(RENDERER_CHART_STATE_PATH, chartState, {
        source: "rendererChartRenderState.update",
        ...options,
    });
}

export function clearRendererChartRenderState(
    options: StateUpdateOptions = {}
): void {
    updateRendererChartState(
        {
            chartData: null,
            isRendered: false,
            renderedCount: 0,
        },
        {
            source: "rendererChartRenderState.clearRenderState",
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

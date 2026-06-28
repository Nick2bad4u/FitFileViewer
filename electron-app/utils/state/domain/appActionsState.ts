import {
    getState,
    setState,
    subscribe,
    type StateListener,
    type StateUpdateOptions,
    updateState,
} from "../core/stateManager.js";
import { normalizeRendererRenderFlag } from "./rendererRenderStateContract.js";

export type AppActionMapCenter = [number, number];
export type AppActionTableState = Record<string, unknown>;

const MAP_MEASUREMENT_MODE_STATE_PATH = "map.measurementMode";
const MAP_SELECTED_LAP_STATE_PATH = "map.selectedLap";
const MAP_STATE_PATH = "map";
const PERFORMANCE_STATE_PATH = "performance";
const PERFORMANCE_LAST_LOAD_TIME_STATE_PATH = "performance.lastLoadTime";
const PERFORMANCE_RENDER_TIMES_STATE_PATH = "performance.renderTimes";
const TABLES_RENDERED_STATE_PATH = "tables.isRendered";
const TABLES_STATE_PATH = "tables";
const APP_FILE_OPENING_STATE_PATH = "app.isOpeningFile";
const APP_INITIALIZED_STATE_PATH = "app.initialized";
const WINDOW_STATE_PATH = "ui.windowState";

export function areRendererTablesRendered(): boolean {
    return normalizeRendererRenderFlag(getState(TABLES_RENDERED_STATE_PATH));
}

export function getRendererMapState(): Record<string, unknown> {
    const mapState = getState(MAP_STATE_PATH);
    return isRecord(mapState) ? mapState : {};
}

export function getRendererPerformanceMetrics(): Record<string, unknown> {
    const performanceMetrics = getState("performance");
    return isRecord(performanceMetrics) ? performanceMetrics : {};
}

export function getRendererPerformanceRenderTime(key: string): unknown {
    return getState(`${PERFORMANCE_RENDER_TIMES_STATE_PATH}.${key}`);
}

export function isRendererMapMeasurementModeEnabled(): boolean {
    return normalizeRendererRenderFlag(
        getState(MAP_MEASUREMENT_MODE_STATE_PATH)
    );
}

export function setAppInitialized(
    initialized: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(APP_INITIALIZED_STATE_PATH, initialized, {
        source: "appActionsState.setInitialized",
        ...options,
    });
}

export function setAppIsOpeningFile(
    isOpening: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(APP_FILE_OPENING_STATE_PATH, isOpening, {
        source: "appActionsState.setIsOpeningFile",
        ...options,
    });
}

export function setMapMeasurementMode(
    measurementMode: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        MAP_MEASUREMENT_MODE_STATE_PATH,
        normalizeRendererRenderFlag(measurementMode),
        {
            source: "appActionsState.setMapMeasurementMode",
            ...options,
        }
    );
}

export function subscribeToRendererMapMeasurementMode(
    listener: (enabled: boolean) => void
): () => void {
    return subscribe(MAP_MEASUREMENT_MODE_STATE_PATH, (measurementMode) => {
        listener(normalizeRendererRenderFlag(measurementMode));
    });
}

export function subscribeToRendererMapMeasurementModeState(
    listener: StateListener
): () => void {
    return subscribe(MAP_MEASUREMENT_MODE_STATE_PATH, listener);
}

export function setMapSelectedLap(
    lapNumber: number,
    options: StateUpdateOptions = {}
): void {
    setState(MAP_SELECTED_LAP_STATE_PATH, lapNumber, {
        source: "appActionsState.setMapSelectedLap",
        ...options,
    });
}

export function setPerformanceLastLoadTime(
    timestamp: number,
    options: StateUpdateOptions = {}
): void {
    setState(PERFORMANCE_LAST_LOAD_TIME_STATE_PATH, timestamp, {
        source: "appActionsState.setPerformanceLastLoadTime",
        ...options,
    });
}

export function setRendererTablesRendered(
    isRendered: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        TABLES_RENDERED_STATE_PATH,
        normalizeRendererRenderFlag(isRendered),
        {
            source: "appActionsState.setTablesRendered",
            ...options,
        }
    );
}

export function updateAppActionWindowState(
    windowState: Record<string, unknown>,
    options: StateUpdateOptions = {}
): void {
    updateState(WINDOW_STATE_PATH, windowState, {
        source: "appActionsState.updateWindowState",
        ...options,
    });
}

export function updateRendererMapState(
    mapState: {
        center: AppActionMapCenter;
        isRendered: boolean;
        zoom: number;
    },
    options: StateUpdateOptions = {}
): void {
    updateState(MAP_STATE_PATH, mapState, {
        source: "appActionsState.updateMapState",
        ...options,
    });
}

export function updateRendererPerformanceRenderTimes(
    renderTimes: Record<string, number>,
    options: StateUpdateOptions = {}
): void {
    updateState(PERFORMANCE_RENDER_TIMES_STATE_PATH, renderTimes, {
        source: "appActionsState.updatePerformanceRenderTimes",
        ...options,
    });
}

export function updateRendererChartRenderPerformanceSummary(
    summary: { chartsRendered: number; lastChartRender: number },
    options: StateUpdateOptions = {}
): void {
    const existingRenderTimes = getState(PERFORMANCE_RENDER_TIMES_STATE_PATH);
    const renderTimes = isRecord(existingRenderTimes)
        ? existingRenderTimes
        : {};

    updateState(
        PERFORMANCE_STATE_PATH,
        {
            chartsRendered: summary.chartsRendered,
            renderTimes: {
                ...renderTimes,
                lastChartRender: summary.lastChartRender,
            },
        },
        {
            source: "appActionsState.updateChartRenderPerformanceSummary",
            ...options,
        }
    );
}

export function updateRendererTableState(
    tableState: AppActionTableState,
    options: StateUpdateOptions = {}
): void {
    updateState(TABLES_STATE_PATH, tableState, {
        source: "appActionsState.updateTableState",
        ...options,
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

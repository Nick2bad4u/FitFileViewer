import {
    getState,
    setState,
    subscribe,
    type StateListener,
    updateState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const RENDERER_CHART_CONTROLS_VISIBLE_STATE_PATH = "charts.controlsVisible";

export function ensureRendererChartControlsVisibleState(
    options: StateUpdateOptions = {}
): void {
    if (getState(RENDERER_CHART_CONTROLS_VISIBLE_STATE_PATH) !== undefined) {
        return;
    }

    setRendererChartControlsVisible(true, {
        source: "rendererChartControlsState.init",
        ...options,
    });
}

export function areRendererChartControlsVisible(): boolean {
    return normalizeRendererChartControlsVisible(
        getState(RENDERER_CHART_CONTROLS_VISIBLE_STATE_PATH)
    );
}

export function setRendererChartControlsVisible(
    visible: boolean,
    options: StateUpdateOptions = {}
): void {
    setState(
        RENDERER_CHART_CONTROLS_VISIBLE_STATE_PATH,
        normalizeRendererChartControlsVisible(visible),
        {
            source: "rendererChartControlsState.setVisible",
            ...options,
        }
    );
}

export function toggleRendererChartControlsVisible(
    options: StateUpdateOptions = {}
): boolean {
    const nextVisibility = !areRendererChartControlsVisible();
    setRendererChartControlsVisible(nextVisibility, {
        source: "rendererChartControlsState.toggle",
        ...options,
    });

    return nextVisibility;
}

export function toggleRendererChartControlsVisibleFromStoredState(
    options: StateUpdateOptions = {}
): boolean {
    const nextVisibility =
        getState(RENDERER_CHART_CONTROLS_VISIBLE_STATE_PATH) !== true;
    setRendererChartControlsVisible(nextVisibility, {
        source: "rendererChartControlsState.toggleStored",
        ...options,
    });

    return nextVisibility;
}

export function subscribeToRendererChartControlsVisible(
    listener: (visible: boolean) => void
): () => void {
    return subscribe(RENDERER_CHART_CONTROLS_VISIBLE_STATE_PATH, (value) => {
        listener(normalizeRendererChartControlsVisible(value));
    });
}

export function subscribeToRendererChartControlsVisibleState(
    listener: StateListener
): () => void {
    return subscribe(RENDERER_CHART_CONTROLS_VISIBLE_STATE_PATH, listener);
}

export function markRendererChartControlsInitialized(
    wrapperId: string,
    options: StateUpdateOptions = {}
): void {
    updateState(
        "charts",
        {
            controlsInitialized: true,
            controlsWrapper: wrapperId,
        },
        {
            merge: true,
            source: "rendererChartControlsState.initialized",
            ...options,
        }
    );
}

export function normalizeRendererChartControlsVisible(value: unknown): boolean {
    return value !== false;
}

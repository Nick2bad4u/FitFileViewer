/**
 * Module-owned state for map theme toggle listeners.
 */

import {
    getMapThemeToggleRuntime,
    type MapThemeToggleRuntime,
    type MapThemeToggleTimerHandle,
} from "./mapThemeToggleRuntime.js";

/**
 * Custom map theme event names emitted by the map theme toggle.
 */
export const MAP_THEME_EVENTS = {
    CHANGED: "mapThemeChanged",
} as const;

const mapThemeToggleUpdateTimers = new Set<MapThemeToggleTimerHandle>();

let currentMapThemeToggleUpdate: (() => void) | null = null;

let mapThemeToggleListenersController: AbortController | null = null;

let mapThemeToggleListenersInstalled = false;

let mapThemeToggleRuntime: MapThemeToggleRuntime | null = null;

function getMapThemeToggleStateRuntime(
    runtime: MapThemeToggleRuntime = getMapThemeToggleRuntime()
): MapThemeToggleRuntime {
    mapThemeToggleRuntime ??= runtime;
    return mapThemeToggleRuntime;
}

function scheduleMapThemeToggleUpdate(
    callback: () => void,
    runtime: MapThemeToggleRuntime
): void {
    const timeout = runtime.setTimeout(() => {
        mapThemeToggleUpdateTimers.delete(timeout);
        callback();
    }, 50);

    mapThemeToggleUpdateTimers.add(timeout);
}

function invokeCurrentMapThemeToggleUpdate(): void {
    try {
        currentMapThemeToggleUpdate?.();
    } catch {
        /* ignore */
    }
}

function ensureMapThemeToggleListenersInstalled(
    runtime: MapThemeToggleRuntime
): void {
    if (mapThemeToggleListenersInstalled) {
        return;
    }

    mapThemeToggleListenersInstalled = true;
    mapThemeToggleListenersController = runtime.createAbortController();

    runtime.addDocumentListener(
        "themechange",
        invokeCurrentMapThemeToggleUpdate,
        {
            signal: mapThemeToggleListenersController.signal,
        }
    );
    runtime.addDocumentListener(
        MAP_THEME_EVENTS.CHANGED,
        invokeCurrentMapThemeToggleUpdate,
        {
            signal: mapThemeToggleListenersController.signal,
        }
    );
}

/**
 * Registers the updater for the currently mounted map theme toggle.
 *
 * The document listeners are installed once and call the latest registered
 * updater so map re-renders do not leak listeners.
 *
 * @param updateButtonState - Callback that refreshes the toggle affordance.
 */
export function registerMapThemeToggleUpdater(
    updateButtonState: () => void,
    runtime: MapThemeToggleRuntime = getMapThemeToggleRuntime()
): void {
    const stateRuntime = getMapThemeToggleStateRuntime(runtime);
    ensureMapThemeToggleListenersInstalled(stateRuntime);
    currentMapThemeToggleUpdate = () => {
        scheduleMapThemeToggleUpdate(updateButtonState, stateRuntime);
    };
}

/**
 * Reset module state for isolated tests.
 */
export function resetMapThemeToggleStateForTests(
    runtime: MapThemeToggleRuntime = getMapThemeToggleStateRuntime()
): void {
    mapThemeToggleListenersController?.abort();

    for (const timeout of mapThemeToggleUpdateTimers) {
        runtime.clearTimeout(timeout);
    }
    mapThemeToggleUpdateTimers.clear();

    currentMapThemeToggleUpdate = null;
    mapThemeToggleListenersController = null;
    mapThemeToggleListenersInstalled = false;
    mapThemeToggleRuntime = null;
}

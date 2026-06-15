/**
 * Module-owned state for map theme toggle listeners.
 */

import {
    getMapThemeToggleRuntime,
    type MapThemeToggleTimerHandle,
} from "./mapThemeToggleRuntime.js";

/**
 * Custom map theme event names emitted by the map theme toggle.
 */
export const MAP_THEME_EVENTS = {
    CHANGED: "mapThemeChanged",
} as const;

const mapThemeToggleRuntime = getMapThemeToggleRuntime();
const mapThemeToggleUpdateTimers = new Set<MapThemeToggleTimerHandle>();

let currentMapThemeToggleUpdate: (() => void) | null = null;

let mapThemeToggleListenersController: AbortController | null = null;

let mapThemeToggleListenersInstalled = false;

function scheduleMapThemeToggleUpdate(callback: () => void): void {
    const timeout = mapThemeToggleRuntime.setTimeout(() => {
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

function ensureMapThemeToggleListenersInstalled(): void {
    if (mapThemeToggleListenersInstalled) {
        return;
    }

    mapThemeToggleListenersInstalled = true;
    mapThemeToggleListenersController =
        mapThemeToggleRuntime.createAbortController();

    mapThemeToggleRuntime.addDocumentListener(
        "themechange",
        invokeCurrentMapThemeToggleUpdate,
        {
            signal: mapThemeToggleListenersController.signal,
        }
    );
    mapThemeToggleRuntime.addDocumentListener(
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
    updateButtonState: () => void
): void {
    ensureMapThemeToggleListenersInstalled();
    currentMapThemeToggleUpdate = () => {
        scheduleMapThemeToggleUpdate(updateButtonState);
    };
}

/**
 * Reset module state for isolated tests.
 */
export function resetMapThemeToggleStateForTests(): void {
    mapThemeToggleListenersController?.abort();

    for (const timeout of mapThemeToggleUpdateTimers) {
        mapThemeToggleRuntime.clearTimeout(timeout);
    }
    mapThemeToggleUpdateTimers.clear();

    currentMapThemeToggleUpdate = null;
    mapThemeToggleListenersController = null;
    mapThemeToggleListenersInstalled = false;
}

/**
 * @fileoverview Overlay/map helper selectors and setters.
 */

import { getState, setState } from "../core/stateManager.js";

const DEFAULT_SOURCE = "overlayState";

if (typeof globalThis !== "undefined" && (globalThis.window === undefined || globalThis.window === null)) {
    /** @type {any} */ (globalThis).window = globalThis;
}

/** @type {unknown[]} */
let overlayFilesSnapshot = [];
/** @type {number} */
let overlayMarkerCountSnapshot = 0;
/** @type {number|null} */
let highlightedOverlayIndexSnapshot = null;

/**
 * Clear overlay-specific state back to defaults.
 * @param {string} [source]
 */
export function clearOverlayState(source = `${DEFAULT_SOURCE}.clearOverlayState`) {
    commitOverlayFilesInternal([], `${source}.loadedFitFiles`, true);
    commitMarkerCountInternal(50, `${source}.mapMarkerCount`, false, true);
    commitHighlightedIndexInternal(null, `${source}.highlightedOverlayIndex`, true);
}

/**
 * Get the highlighted overlay index if present.
 * @returns {number|null}
 */
export function getHighlightedOverlayIndex() {
    const value = getState("overlays.highlightedOverlayIndex");
    if (typeof value === "number" && Number.isFinite(value)) {
        highlightedOverlayIndexSnapshot = value;
        return value;
    }

    const hydrated = hydrateOverlayScalarFromDescriptor(
        "_highlightedOverlayIdx",
        (val) => (typeof val === "number" && Number.isFinite(val) ? val : null),
        (normalized, source) => commitHighlightedIndexInternal(normalized, source, false)
    );
    if (typeof hydrated === "number") {
        highlightedOverlayIndexSnapshot = hydrated;
        return hydrated;
    }

    return highlightedOverlayIndexSnapshot;
}

/**
 * Retrieve currently loaded overlay files.
 * @returns {unknown[]}
 */
export function getOverlayFiles() {
    const files = getState("overlays.loadedFitFiles");
    if (Array.isArray(files) && files.length > 0) {
        overlayFilesSnapshot = [...files];
        return files;
    }

    const hydrated = hydrateOverlayArrayFromDescriptor("loadedFitFiles", (value, source) =>
        commitOverlayFilesInternal(value, source, false)
    );
    if (Array.isArray(hydrated) && hydrated.length > 0) {
        overlayFilesSnapshot = [...hydrated];
        return hydrated;
    }

    return overlayFilesSnapshot.length > 0 ? [...overlayFilesSnapshot] : Array.isArray(files) ? files : [];
}

/**
 * Read the current marker count limit.
 * @returns {number}
 */
export function getOverlayMarkerCount() {
    const value = getState("overlays.mapMarkerCount");
    const descriptorValue = hydrateOverlayScalarFromDescriptor(
        "mapMarkerCount",
        (val) => (typeof val === "number" && Number.isFinite(val) ? val : undefined),
        (normalized, source) => commitMarkerCountInternal(normalized, source, undefined, false)
    );

    if (typeof value === "number" && Number.isFinite(value) && (value > 0 || descriptorValue === undefined)) {
        overlayMarkerCountSnapshot = value;
        return value;
    }

    if (typeof descriptorValue === "number" && Number.isFinite(descriptorValue)) {
        overlayMarkerCountSnapshot = descriptorValue;
        return descriptorValue;
    }

    return overlayMarkerCountSnapshot;
}

/**
 * Update the highlighted overlay reference.
 * @param {number|null} index
 * @param {string} [source]
 */
export function setHighlightedOverlayIndex(index, source = `${DEFAULT_SOURCE}.setHighlightedOverlayIndex`) {
    commitHighlightedIndexInternal(index, source, true);
}

/**
 * Replace the overlay file list.
 * @param {unknown[]} files
 * @param {string} [source]
 */
export function setOverlayFiles(files, source = `${DEFAULT_SOURCE}.setOverlayFiles`) {
    commitOverlayFilesInternal(files, source, true);
}

/**
 * Update the overlay marker count limit.
 * @param {number} count
 * @param {string} [source]
 */
export function setOverlayMarkerCount(count, source = `${DEFAULT_SOURCE}.setOverlayMarkerCount`) {
    commitMarkerCountInternal(count, source, true, true);
}

function commitHighlightedIndexInternal(index, source, reflect = true) {
    setState("overlays.highlightedOverlayIndex", index, { source });
    highlightedOverlayIndexSnapshot = typeof index === "number" && Number.isFinite(index) ? index : null;
    if (reflect) {
        reflectLegacyGlobal("_highlightedOverlayIdx", index, source);
    }
}

function commitMarkerCountInternal(count, source, explicitOverride, reflect = true) {
    let value;
    if (typeof count === "number" && Number.isFinite(count)) {
        value = count;
    } else {
        const parsed = Number.parseInt(String(count), 10);
        if (Number.isFinite(parsed)) {
            value = parsed;
        } else {
            const existing = getState("overlays.mapMarkerCount");
            if (typeof existing === "number" && Number.isFinite(existing)) {
                value = existing;
            } else if (typeof overlayMarkerCountSnapshot === "number" && Number.isFinite(overlayMarkerCountSnapshot)) {
                value = overlayMarkerCountSnapshot;
            } else {
                value = 50;
            }
        }
    }

    overlayMarkerCountSnapshot = value;
    const previousExplicit = getState("overlays.mapMarkerCountExplicit");
    const explicitPreference =
        typeof explicitOverride === "boolean"
            ? explicitOverride
            : typeof previousExplicit === "boolean"
                ? previousExplicit
                : false;
    setState(
        "overlays",
        {
            mapMarkerCount: value,
            mapMarkerCountExplicit: explicitPreference,
        },
        { merge: true, source }
    );
    if (reflect) {
        reflectLegacyGlobal("mapMarkerCount", value, source);
    }
}

function commitOverlayFilesInternal(files, source, reflect = true) {
    const normalized = Array.isArray(files) ? [...files] : [];
    setState("overlays.loadedFitFiles", normalized, { source });
    overlayFilesSnapshot = [...normalized];
    if (reflect) {
        reflectLegacyGlobal("loadedFitFiles", normalized, source);
    }
}

function defineBridgeForTarget(target) {
    if (!target || typeof target !== "object") {
        return;
    }

    defineReactiveProperty(target, "loadedFitFiles", () => getOverlayFiles(), (value) => {
        commitOverlayFilesInternal(value, `${DEFAULT_SOURCE}.legacySetter.loadedFitFiles`, false);
    });

    defineReactiveProperty(target, "mapMarkerCount", () => getOverlayMarkerCount(), (value) => {
        commitMarkerCountInternal(Number(value), `${DEFAULT_SOURCE}.legacySetter.mapMarkerCount`, undefined, false);
    });

    defineReactiveProperty(target, "_highlightedOverlayIdx", () => getHighlightedOverlayIndex(), (value) => {
        commitHighlightedIndexInternal(
            typeof value === "number" && Number.isFinite(value) ? value : null,
            `${DEFAULT_SOURCE}.legacySetter.highlightedOverlayIndex`,
            false
        );
    });
}

function defineReactiveProperty(target, propName, getter, setter) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propName);
    if (descriptor && typeof descriptor.get === "function" && typeof descriptor.set === "function") {
        return;
    }

    const reactiveSetter = (value) => setter(value);

    Object.defineProperty(target, propName, {
        configurable: true,
        enumerable: false,
        get: getter,
        set: reactiveSetter,
    });

    if (descriptor && Object.hasOwn(descriptor, "value")) {
        reactiveSetter(descriptor.value);
    }
}

function initializeOverlayPropertyBridge() {
    if (typeof globalThis === "undefined" || !globalThis) {
        return;
    }

    const host = /** @type {any} */ (globalThis);
    defineBridgeForTarget(host);
    if (host.window && typeof host.window === "object") {
        defineBridgeForTarget(host.window);
    }
}

initializeOverlayPropertyBridge();

function hydrateOverlayArrayFromDescriptor(propName, commitFn) {
    if (typeof globalThis === "undefined" || !globalThis) {
        return;
    }

    const host = /** @type {any} */ (globalThis);
    const targets = [host, host.window && typeof host.window === "object" ? host.window : null];
    for (const target of targets) {
        if (!target) {
            continue;
        }

        const descriptor = Object.getOwnPropertyDescriptor(target, propName);
        if (descriptor && Object.hasOwn(descriptor, "value")) {
            const rawValue = descriptor.value;
            if (Array.isArray(rawValue) && rawValue.length > 0) {
                const normalized = [...rawValue];
                commitFn(normalized, `${DEFAULT_SOURCE}.hydrate.${propName}`);
                return normalized;
            }
        }
    }
}

function hydrateOverlayScalarFromDescriptor(propName, normalizer, commitFn) {
    if (typeof globalThis === "undefined" || !globalThis) {
        return;
    }

    const host = /** @type {any} */ (globalThis);
    const targets = [host, host.window && typeof host.window === "object" ? host.window : null];
    for (const target of targets) {
        if (!target) {
            continue;
        }

        const descriptor = Object.getOwnPropertyDescriptor(target, propName);
        if (descriptor && Object.hasOwn(descriptor, "value")) {
            const normalized = normalizer(descriptor.value);
            if (normalized !== undefined) {
                commitFn(normalized, `${DEFAULT_SOURCE}.hydrate.${propName}`);
                return normalized;
            }
        }
    }
}

function reflectLegacyGlobal(propName, value, logContext) {
    try {
        if (typeof globalThis === "undefined" || !globalThis) {
            return;
        }

        const host = /** @type {any} */ (globalThis);
        if (!host.window || typeof host.window !== "object") {
            host.window = host;
        }
        const descriptor = Object.getOwnPropertyDescriptor(host, propName);
        if (!descriptor || typeof descriptor.set !== "function") {
            host[propName] = value;
        }

        if (host.window && typeof host.window === "object") {
            const windowDescriptor = Object.getOwnPropertyDescriptor(host.window, propName);
            if (!windowDescriptor || typeof windowDescriptor.set !== "function") {
                host.window[propName] = value;
            }
        }
    } catch (error) {
        console.warn(`[overlayState] Failed to reflect ${propName} onto global scope via ${logContext}`, error);
    }
}

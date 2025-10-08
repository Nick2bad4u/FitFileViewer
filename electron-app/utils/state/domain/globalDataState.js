/**
 * @fileoverview Convenience helpers for interacting with the globalData branch of state.
 */

import * as stateManager from "../core/stateManager.js";

const DEFAULT_SOURCE = "globalDataState";

if (typeof globalThis !== "undefined" && (globalThis.window === undefined || globalThis.window === null)) {
    /** @type {any} */ (globalThis).window = globalThis;
}

/** @type {unknown} */
let globalDataSnapshot = null;

/**
 * Clear any loaded FIT data.
 * @param {string} [source]
 */
export function clearGlobalData(source = `${DEFAULT_SOURCE}.clearGlobalData`) {
    commitGlobalDataInternal(null, source, true);
}

/**
 * Retrieve the current global FIT data payload.
 * @returns {unknown}
 */
export function getGlobalData() {
    const host = typeof globalThis === "object" && globalThis ? /** @type {any} */ (globalThis) : undefined;
    const windowTarget = host && typeof host.window === "object" ? host.window : undefined;

    const descriptors = [
        { scope: "host", descriptor: host ? Object.getOwnPropertyDescriptor(host, "globalData") : undefined },
        {
            scope: "window",
            descriptor: windowTarget ? Object.getOwnPropertyDescriptor(windowTarget, "globalData") : undefined,
        },
    ];

    for (const { scope, descriptor } of descriptors) {
        if (!descriptor) {
            const existingState = safeGetState("globalData");
            if (globalDataSnapshot !== null || (existingState !== null && existingState !== undefined)) {
                commitGlobalDataInternal(null, `${DEFAULT_SOURCE}.synchronization.${scope}Missing`, false);
                globalDataSnapshot = null;
            }
            if (scope === "window") {
                return null;
            }
            continue;
        }

        if (Object.hasOwn(descriptor, "value")) {
            const rawValue = descriptor.value;
            if (rawValue === undefined || rawValue === null) {
                commitGlobalDataInternal(null, `${DEFAULT_SOURCE}.synchronization.${scope}Null`, false);
                globalDataSnapshot = null;
                return null;
            }

            commitGlobalDataInternal(rawValue, `${DEFAULT_SOURCE}.synchronization.${scope}Value`, false);
            globalDataSnapshot = rawValue;
            return rawValue;
        }
    }

    const data = safeGetState("globalData");
    if (data !== undefined && data !== null) {
        globalDataSnapshot = data;
        return data;
    }

    const hydrated = hydrateGlobalDataFromDescriptor((value, source) =>
        commitGlobalDataInternal(value, source, false)
    );
    if (hydrated !== undefined && hydrated !== null) {
        globalDataSnapshot = hydrated;
        return hydrated;
    }

    return globalDataSnapshot ?? data ?? null;
}

/**
 * Update the global FIT data payload.
 * @param {unknown} data
 * @param {string} [source]
 */
export function setGlobalData(data, source = `${DEFAULT_SOURCE}.setGlobalData`) {
    commitGlobalDataInternal(data, source, true);
}

const hasSetState = typeof Reflect.get(stateManager, "setState") === "function";
const hasGetState = typeof Reflect.get(stateManager, "getState") === "function";

/**
 * Safely read from the application state store.
 * @param {string} path
 * @returns {unknown}
 */
function safeGetState(path) {
    let result;
    if (hasGetState) {
        try {
            const getter = Reflect.get(stateManager, "getState");
            if (typeof getter === "function") {
                result = getter(path);
            }
        } catch {
            result = undefined;
        }
    }
    return result;
}

/**
 * Safely set a value in the application state store when available.
 * @param {unknown} value
 * @param {string} source
 */
function safeSetGlobalData(value, source) {
    if (!hasSetState) {
        return;
    }
    try {
        const setter = Reflect.get(stateManager, "setState");
        if (typeof setter === "function") {
            setter("globalData", value, { source });
        }
    } catch {
        // Ignore failures so that legacy globals still function for callers relying on window.globalData.
    }
}

initializeGlobalDataBridge();

function commitGlobalDataInternal(value, source, reflect = true) {
    safeSetGlobalData(value, source);
    globalDataSnapshot = value;
    if (reflect) {
        reflectLegacyGlobalData(value, source);
    }
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

function hydrateGlobalDataFromDescriptor(commitFn) {
    if (typeof globalThis === "undefined" || !globalThis) {
        return;
    }

    const host = /** @type {any} */ (globalThis);
    const targets = [host, host.window && typeof host.window === "object" ? host.window : null];
    for (const target of targets) {
        if (!target) {
            continue;
        }

        const descriptor = Object.getOwnPropertyDescriptor(target, "globalData");
        if (descriptor && Object.hasOwn(descriptor, "value")) {
            const rawValue = descriptor.value;
            if (rawValue !== undefined && rawValue !== null) {
                commitFn(rawValue, `${DEFAULT_SOURCE}.hydrateFromDescriptor`);
                return rawValue;
            }
        }
    }
}

function initializeGlobalDataBridge() {
    if (typeof globalThis === "undefined" || !globalThis) {
        return;
    }

    const host = /** @type {any} */ (globalThis);
    defineReactiveProperty(host, "globalData", () => getGlobalData(), (value) => {
        commitGlobalDataInternal(value, `${DEFAULT_SOURCE}.legacySetter.globalData`, false);
    });

    if (host.window && typeof host.window === "object") {
        defineReactiveProperty(host.window, "globalData", () => getGlobalData(), (value) => {
            commitGlobalDataInternal(value, `${DEFAULT_SOURCE}.legacySetter.windowGlobalData`, false);
        });
    }
}

function reflectLegacyGlobalData(value, source) {
    try {
        if (typeof globalThis === "undefined" || !globalThis) {
            return;
        }

        const host = /** @type {any} */ (globalThis);
        if (!host.window || typeof host.window !== "object") {
            host.window = host;
        }
        const descriptor = Object.getOwnPropertyDescriptor(host, "globalData");
        if (!descriptor || typeof descriptor.set !== "function") {
            host.globalData = value;
        }

        if (host.window && typeof host.window === "object") {
            const windowDescriptor = Object.getOwnPropertyDescriptor(host.window, "globalData");
            if (!windowDescriptor || typeof windowDescriptor.set !== "function") {
                host.window.globalData = value;
            }
        }
    } catch (error) {
        console.warn(`[globalDataState] Failed to reflect globalData onto global scope via ${source}`, error);
    }
}

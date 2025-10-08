/**
 * @fileoverview Zone/threshold state helpers for charts and analytics.
 */

import { getState, setState } from "../core/stateManager.js";

const DEFAULT_SOURCE = "zoneState";

if (typeof globalThis !== "undefined" && (globalThis.window === undefined || globalThis.window === null)) {
    /** @type {any} */ (globalThis).window = globalThis;
}

/** @type {unknown[]} */
let heartRateZoneSnapshot = [];
/** @type {unknown[]} */
let powerZoneSnapshot = [];
/** @type {Set<string>} */
const reflectionGuards = new Set();

/**
 * Clear both heart-rate and power zone caches.
 * @param {string} [source]
 */
export function clearZoneData(source = `${DEFAULT_SOURCE}.clearZoneData`) {
    commitHeartRateZonesInternal([], `${source}.heartRate`, true);
    commitPowerZonesInternal([], `${source}.power`, true);
}

/**
 * Retrieve heart-rate zones.
 * @returns {unknown[]}
 */
export function getHeartRateZones() {
    const zones = getState("zones.heartRate");
    if (Array.isArray(zones) && zones.length > 0) {
        heartRateZoneSnapshot = [...zones];
        return zones;
    }

    const hydrated = hydrateZonesFromDescriptor("heartRateZones", (value, source) =>
        commitHeartRateZonesInternal(value, source, false)
    );
    if (Array.isArray(hydrated) && hydrated.length > 0) {
        heartRateZoneSnapshot = [...hydrated];
        return hydrated;
    }

    return heartRateZoneSnapshot.length > 0 ? [...heartRateZoneSnapshot] : Array.isArray(zones) ? zones : [];
}

/**
 * Retrieve power zones.
 * @returns {unknown[]}
 */
export function getPowerZones() {
    const zones = getState("zones.power");
    if (Array.isArray(zones) && zones.length > 0) {
        powerZoneSnapshot = [...zones];
        return zones;
    }

    const hydrated = hydrateZonesFromDescriptor("powerZones", (value, source) =>
        commitPowerZonesInternal(value, source, false)
    );
    if (Array.isArray(hydrated) && hydrated.length > 0) {
        powerZoneSnapshot = [...hydrated];
        return hydrated;
    }

    return powerZoneSnapshot.length > 0 ? [...powerZoneSnapshot] : Array.isArray(zones) ? zones : [];
}

/**
 * Update heart-rate zones.
 * @param {unknown[]} zones
 * @param {string} [source]
 */
export function setHeartRateZones(zones, source = `${DEFAULT_SOURCE}.setHeartRateZones`) {
    commitHeartRateZonesInternal(zones, source, true);
}

/**
 * Update power zones.
 * @param {unknown[]} zones
 * @param {string} [source]
 */
export function setPowerZones(zones, source = `${DEFAULT_SOURCE}.setPowerZones`) {
    commitPowerZonesInternal(zones, source, true);
}

function applyReflectionToTarget(target, propName, value) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propName);
    const guardScope = target === globalThis ? "global" : target === globalThis.window ? "window" : "target";
    const guardKey = `${propName}:${guardScope}`;

    if (descriptor && typeof descriptor.set === "function") {
        if (reflectionGuards.has(guardKey)) {
            return;
        }
        reflectionGuards.add(guardKey);
        try {
            descriptor.set.call(target, value);
        } finally {
            reflectionGuards.delete(guardKey);
        }
        return;
    }

    if (!descriptor || Object.hasOwn(descriptor, "writable") || Object.hasOwn(descriptor, "value")) {
        target[propName] = value;
    }
}

function hydrateZonesFromDescriptor(propName, commitFn) {
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
                commitFn(normalized, `${DEFAULT_SOURCE}.hydrate.${propName}`, false);
                return normalized;
            }
        }
    }
}

initializeZoneBridge();

function commitHeartRateZonesInternal(zones, source, reflect = true) {
    const normalized = Array.isArray(zones) ? [...zones] : [];
    setState("zones.heartRate", normalized, { source });
    heartRateZoneSnapshot = [...normalized];
    if (reflect) {
        reflectLegacyZoneProperty("heartRateZones", normalized, source);
    }
}

function commitPowerZonesInternal(zones, source, reflect = true) {
    const normalized = Array.isArray(zones) ? [...zones] : [];
    setState("zones.power", normalized, { source });
    powerZoneSnapshot = [...normalized];
    if (reflect) {
        reflectLegacyZoneProperty("powerZones", normalized, source);
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

function initializeZoneBridge() {
    if (typeof globalThis === "undefined" || !globalThis) {
        return;
    }

    const host = /** @type {any} */ (globalThis);
    defineReactiveProperty(host, "heartRateZones", () => getHeartRateZones(), (value) => {
        commitHeartRateZonesInternal(value, `${DEFAULT_SOURCE}.legacySetter.heartRate`, false);
    });

    defineReactiveProperty(host, "powerZones", () => getPowerZones(), (value) => {
        commitPowerZonesInternal(value, `${DEFAULT_SOURCE}.legacySetter.power`, false);
    });

    if (host.window && typeof host.window === "object") {
        defineReactiveProperty(host.window, "heartRateZones", () => getHeartRateZones(), (value) => {
            commitHeartRateZonesInternal(value, `${DEFAULT_SOURCE}.legacySetter.windowHeartRate`, false);
        });

        defineReactiveProperty(host.window, "powerZones", () => getPowerZones(), (value) => {
            commitPowerZonesInternal(value, `${DEFAULT_SOURCE}.legacySetter.windowPower`, false);
        });
    }
}

function reflectLegacyZoneProperty(propName, value, source) {
    try {
        if (typeof globalThis === "undefined" || !globalThis) {
            return;
        }

        const host = /** @type {any} */ (globalThis);
        if (!host.window || typeof host.window !== "object") {
            host.window = host;
        }
        applyReflectionToTarget(host, propName, value);

        if (host.window && typeof host.window === "object") {
            applyReflectionToTarget(host.window, propName, value);
        }
    } catch (error) {
        console.warn(`[zoneState] Failed to reflect ${propName} onto global scope via ${source}`, error);
    }
}

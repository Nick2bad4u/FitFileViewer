/**
 * Shared utilities for tab state management.
 */

// Prefer dynamic state manager accessor to avoid stale imports across suites
import * as __StateMgr from "../../state/core/stateManager.js";

// Resolve document by preferring the canonical test-provided document
// (`__vitest_effective_document__`) first, then falling back to the active
// global/window document. This avoids cross-realm mismatches across the full
// test suite.
/**
 * @returns {Document}
 */
export function getDoc() {
    /** @type {any[]} */
    const candidates = [];

    // Canonical Vitest document (preferred)
    try {
        // @ts-ignore
        if (
            typeof __vitest_effective_document__ !== "undefined" &&
            __vitest_effective_document__
        ) {
            // @ts-ignore
            candidates.push(__vitest_effective_document__);
        }
    } catch {
        /* ignore */
    }

    // Local realm document (JSDOM/Electron)
    try {
        // @ts-ignore
        if (typeof document !== "undefined" && document) {
            // @ts-ignore
            candidates.push(document);
        }
    } catch {
        /* ignore */
    }

    // Global document (other realms)
    try {
        if (
            typeof globalThis !== "undefined" &&
            /** @type {any} */ (globalThis).document
        ) {
            candidates.push(/** @type {any} */ (globalThis).document);
        }
    } catch {
        /* ignore */
    }

    for (const candidate of candidates) {
        if (
            candidate &&
            typeof candidate.getElementById === "function" &&
            typeof candidate.querySelectorAll === "function"
        ) {
            return /** @type {Document} */ (candidate);
        }
    }

    // Final fallback (should exist in JSDOM/Electron)
    // @ts-ignore
    return /** @type {Document} */ (document);
}

// Retrieve state manager functions. Prefer the module namespace (so Vitest mocks are respected),
// And only fall back to a canonical global mock if module functions are unavailable.
/** @returns {{ getState: any; setState: any; subscribe: any }} */
export function getStateMgr() {
    try {
        const sm = /** @type {any} */ (__StateMgr);
        const getState =
            sm && typeof sm.getState === "function" ? sm.getState : undefined;
        const setState =
            sm && typeof sm.setState === "function" ? sm.setState : undefined;
        const subscribe =
            sm && typeof sm.subscribe === "function" ? sm.subscribe : undefined;
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    try {
        // @ts-ignore
        const eff =
            typeof __vitest_effective_stateManager__ !== "undefined" &&
            /** @type {any} */ (__vitest_effective_stateManager__);
        if (eff && typeof eff === "object") {
            const getState =
                typeof eff.getState === "function"
                    ? eff.getState
                    : __StateMgr.getState;
            const setState =
                typeof eff.setState === "function"
                    ? eff.setState
                    : __StateMgr.setState;
            const subscribe =
                typeof eff.subscribe === "function"
                    ? eff.subscribe
                    : __StateMgr.subscribe;
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }

    return {
        getState: __StateMgr.getState,
        setState: __StateMgr.setState,
        subscribe: __StateMgr.subscribe,
    };
}

/**
 * Shared utilities for tab state management.
 */

// Prefer dynamic state manager accessor to avoid stale imports across suites
import * as __StateMgr from "../../state/core/stateManager.js";
import {
    getTabTestDocumentForTests,
    getTabTestStateManagerForTests,
} from "./tabTestEnvironment.js";

type StateGetter = typeof __StateMgr.getState;
type StateSetter = typeof __StateMgr.setState;
type StateSubscriber = typeof __StateMgr.subscribe;

type StateManagerAccess = {
    getState: StateGetter;
    setState: StateSetter;
    subscribe: StateSubscriber;
};

function isDocumentLike(candidate: unknown): candidate is Document {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "getElementById" in candidate &&
        typeof candidate.getElementById === "function" &&
        "querySelectorAll" in candidate &&
        typeof candidate.querySelectorAll === "function"
    );
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
    return candidate !== null && typeof candidate === "object";
}

/**
 * Resolve the active document used by the tab-state manager.
 */
export function getDoc(): Document {
    const candidates: unknown[] = [];

    const testDocument = getTabTestDocumentForTests();
    if (testDocument) {
        candidates.push(testDocument);
    }

    // Local realm document (JSDOM/Electron)
    try {
        if (typeof document !== "undefined" && document) {
            candidates.push(document);
        }
    } catch {
        /* ignore */
    }

    // Global document (other realms)
    try {
        if (
            typeof globalThis !== "undefined" &&
            "document" in globalThis &&
            globalThis.document
        ) {
            candidates.push(globalThis.document);
        }
    } catch {
        /* ignore */
    }

    for (const candidate of candidates) {
        if (isDocumentLike(candidate)) {
            return candidate;
        }
    }

    // Final fallback (should exist in JSDOM/Electron)
    return document;
}

/**
 * Retrieve state manager functions.
 *
 * Prefer the module namespace so Vitest mocks are respected, then fall back to
 * a module-local test override when tests provide one.
 */
export function getStateMgr(): StateManagerAccess {
    try {
        const getState =
            typeof __StateMgr.getState === "function"
                ? __StateMgr.getState
                : undefined;
        const setState =
            typeof __StateMgr.setState === "function"
                ? __StateMgr.setState
                : undefined;
        const subscribe =
            typeof __StateMgr.subscribe === "function"
                ? __StateMgr.subscribe
                : undefined;
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    try {
        const eff = getTabTestStateManagerForTests();
        if (isRecord(eff)) {
            const getState =
                typeof eff["getState"] === "function"
                    ? (eff["getState"] as StateGetter)
                    : __StateMgr.getState;
            const setState =
                typeof eff["setState"] === "function"
                    ? (eff["setState"] as StateSetter)
                    : __StateMgr.setState;
            const subscribe =
                typeof eff["subscribe"] === "function"
                    ? (eff["subscribe"] as StateSubscriber)
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

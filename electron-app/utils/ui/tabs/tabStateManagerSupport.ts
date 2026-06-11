/**
 * Shared utilities for tab state management.
 */

import {
    getRendererCoreStateManager,
    getRequiredRendererCoreStateManager,
    toRendererStateManagerAccess,
    type RendererStateGetter,
    type RendererStateManagerAccess,
    type RendererStateSetter,
    type RendererStateSubscriber,
} from "../../state/domain/rendererStateManagerAccess.js";
import {
    getTabTestDocumentForTests,
    getTabTestStateManagerForTests,
} from "./tabTestEnvironment.js";

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
 */
export function getStateMgr(): RendererStateManagerAccess {
    try {
        const stateManager = getRendererCoreStateManager();
        if (stateManager) {
            return stateManager;
        }
    } catch {
        /* Ignore errors */
    }
    try {
        const eff = getTabTestStateManagerForTests();
        const effectiveStateManager = toRendererStateManagerAccess(eff);
        if (effectiveStateManager) {
            return effectiveStateManager;
        }

        if (isRecord(eff)) {
            const fallbackStateManager = getRequiredRendererCoreStateManager();
            const getState =
                typeof eff["getState"] === "function"
                    ? (eff["getState"] as RendererStateGetter)
                    : fallbackStateManager.getState;
            const setState =
                typeof eff["setState"] === "function"
                    ? (eff["setState"] as RendererStateSetter)
                    : fallbackStateManager.setState;
            const subscribe =
                typeof eff["subscribe"] === "function"
                    ? (eff["subscribe"] as RendererStateSubscriber)
                    : fallbackStateManager.subscribe;
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }

    return getRequiredRendererCoreStateManager();
}

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
import { getTabDocumentRuntime } from "./tabDocumentRuntime.js";

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
    return candidate !== null && typeof candidate === "object";
}

/**
 * Resolve the active document used by the tab-state manager.
 */
export function getDoc(): Document {
    const documentRef = getTabDocumentRuntime().getDocument(
        getTabTestDocumentForTests()
    );
    if (!documentRef) {
        throw new TypeError(
            "tabStateManagerSupport requires a document runtime"
        );
    }

    return documentRef;
}

export function isTabElement(value: unknown): value is Element {
    return getTabDocumentRuntime().isElement(value);
}

export function isTabHTMLElement(value: unknown): value is HTMLElement {
    return getTabDocumentRuntime().isHTMLElement(value);
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

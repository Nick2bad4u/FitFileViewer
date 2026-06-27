/**
 * Shared utilities for tab state management.
 */

import {
    getRendererCoreStateManager,
    getRequiredRendererCoreStateManager,
    type RendererStateManagerAccess,
} from "../../state/domain/rendererStateManagerAccess.js";
import { getTabDocumentRuntime } from "./tabDocumentRuntime.js";

/**
 * Resolve the active document used by the tab-state manager.
 */
export function getDoc(): Document {
    const documentRef = getTabDocumentRuntime().getDocument();
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

    return getRequiredRendererCoreStateManager();
}

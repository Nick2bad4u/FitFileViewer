import { getTabDocumentRuntime } from "./tabDocumentRuntime.js";

/**
 * Safely return a DOM document, preferring an effective Vitest realm when
 * present.
 */
export function getDoc(): Document {
    const documentRef = getTabDocumentRuntime().getDocument();
    if (!documentRef) {
        throw new TypeError("tabStateManagerDoc requires a document runtime");
    }

    return documentRef;
}

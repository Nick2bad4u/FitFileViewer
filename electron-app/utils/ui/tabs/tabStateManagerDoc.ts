import { getTabTestDocumentForTests } from "./tabTestEnvironment.js";
import { getTabDocumentRuntime } from "./tabDocumentRuntime.js";

const tabDocumentRuntime = getTabDocumentRuntime();

/**
 * Safely return a DOM document, preferring an effective Vitest realm when
 * present.
 */
export function getDoc(): Document {
    return (
        tabDocumentRuntime.getDocument(getTabTestDocumentForTests()) ?? document
    );
}

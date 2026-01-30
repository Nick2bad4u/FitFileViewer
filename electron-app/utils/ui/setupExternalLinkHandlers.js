import { attachExternalLinkHandlers } from "./links/externalLinkHandlers.js";
import { showNotification } from "./notifications/showNotification.js";

/**
 * Initialize external link handlers and return a cleanup callback.
 *
 * @param {{
 *     cleanupExternalLinkHandlers: (() => void) | null;
 *     setCleanup: (cleanup: (() => void) | null) => void;
 * }} params
 */
export function setupExternalLinkHandlers({
    cleanupExternalLinkHandlers,
    setCleanup,
}) {
    // Idempotent: remove prior handlers if re-initialized.
    try {
        if (typeof cleanupExternalLinkHandlers === "function") {
            cleanupExternalLinkHandlers();
        }
    } catch {
        /* ignore */
    }

    // Attach to the document to cover content inserted dynamically (modals, map attributions, etc.).
    const cleanup = attachExternalLinkHandlers({
        onOpenExternalError: () => {
            // Match legacy behavior + strict test expectation.
            showNotification("Failed to open link in your browser.", "error");
        },
        root: document,
    });

    setCleanup(cleanup);
}

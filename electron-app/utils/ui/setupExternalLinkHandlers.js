import { attachExternalLinkHandlers } from "./links/externalLinkHandlers.js";
import { showNotification } from "./notifications/showNotification.js";
/**
 * Initialize external link handlers and store a cleanup callback.
 *
 * @param options - Current cleanup state and setter.
 */
export function setupExternalLinkHandlers({
    cleanupExternalLinkHandlers,
    setCleanup,
}) {
    try {
        cleanupExternalLinkHandlers?.();
    } catch {
        // Ignore stale cleanup failures during renderer reinitialization.
    }
    const cleanup = attachExternalLinkHandlers({
        onOpenExternalError: () => {
            void showNotification(
                "Failed to open link in your browser.",
                "error"
            );
        },
        root: document,
    });
    setCleanup(cleanup);
}

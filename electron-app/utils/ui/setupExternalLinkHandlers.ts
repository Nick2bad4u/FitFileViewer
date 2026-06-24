import { attachExternalLinkHandlers } from "./links/externalLinkHandlers.js";
import { showNotification } from "./notifications/showNotification.js";
import type { RendererElectronApiScope } from "../runtime/electronApiRuntime.js";

type CleanupFunction = () => void;

type SetupExternalLinkHandlersOptions = {
    readonly cleanupExternalLinkHandlers: CleanupFunction | null;
    readonly electronApiScope?: RendererElectronApiScope | undefined;
    readonly setCleanup: (cleanup: CleanupFunction | null) => void;
};

/**
 * Initialize external link handlers and store a cleanup callback.
 *
 * @param options - Current cleanup state and setter.
 */
export function setupExternalLinkHandlers({
    cleanupExternalLinkHandlers,
    electronApiScope,
    setCleanup,
}: SetupExternalLinkHandlersOptions): void {
    try {
        cleanupExternalLinkHandlers?.();
    } catch {
        // Ignore stale cleanup failures during renderer reinitialization.
    }

    const cleanup = attachExternalLinkHandlers({
        electronApiScope,
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

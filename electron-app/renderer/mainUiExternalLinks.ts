import { addEventListenerWithCleanup } from "../utils/ui/mainUiDomUtils.js";
import { setupExternalLinkHandlers } from "../utils/ui/setupExternalLinkHandlers.js";

export interface MainUiExternalLinkLifecycle {
    cleanup: () => void;
    install: () => void;
}

export interface MainUiExternalLinkLifecycleOptions {
    readonly documentRef?: Document;
}

export function createMainUiExternalLinkLifecycle({
    documentRef = document,
}: MainUiExternalLinkLifecycleOptions = {}): MainUiExternalLinkLifecycle {
    let cleanupExternalLinkHandlers: (() => void) | null = null;

    const initialize = (): void => {
        setupExternalLinkHandlers({
            cleanupExternalLinkHandlers,
            setCleanup: (cleanup) => {
                cleanupExternalLinkHandlers = cleanup;
            },
        });
    };

    return {
        cleanup(): void {
            try {
                if (typeof cleanupExternalLinkHandlers === "function") {
                    cleanupExternalLinkHandlers();
                }
            } finally {
                cleanupExternalLinkHandlers = null;
            }
        },
        install(): void {
            if (documentRef.readyState === "loading") {
                addEventListenerWithCleanup(
                    documentRef,
                    "DOMContentLoaded",
                    initialize,
                    { once: true }
                );
                return;
            }

            initialize();
        },
    };
}

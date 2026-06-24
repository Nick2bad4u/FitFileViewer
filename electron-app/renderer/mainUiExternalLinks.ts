import { addEventListenerWithCleanup } from "../utils/ui/mainUiDomUtils.js";
import { setupExternalLinkHandlers } from "../utils/ui/setupExternalLinkHandlers.js";
import { getMainUiRuntimeEnvironment } from "./mainUiRuntimeEnvironment.js";
import type { RendererElectronApiScope } from "../utils/runtime/electronApiRuntime.js";

export interface MainUiExternalLinkLifecycle {
    cleanup: () => void;
    install: () => void;
}

export interface MainUiExternalLinkLifecycleOptions {
    readonly documentRef?: Document;
    readonly electronApiScope?: RendererElectronApiScope | undefined;
}

const mainUiRuntimeEnvironment = getMainUiRuntimeEnvironment();

export function createMainUiExternalLinkLifecycle({
    documentRef = mainUiRuntimeEnvironment.documentRef,
    electronApiScope,
}: MainUiExternalLinkLifecycleOptions = {}): MainUiExternalLinkLifecycle {
    let cleanupExternalLinkHandlers: (() => void) | null = null;

    const initialize = (): void => {
        setupExternalLinkHandlers({
            cleanupExternalLinkHandlers,
            electronApiScope,
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

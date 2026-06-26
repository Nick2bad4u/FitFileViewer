import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import type { ElectronShellExternalApi } from "../../../shared/preloadApi.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import { getExternalLinkHandlersRuntime } from "./externalLinkHandlersRuntime.js";

type CleanupFunction = () => void;

type AttachExternalLinkHandlersOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
    readonly onOpenExternalError?: (url: string, error: Error) => void;
    readonly root: EventTarget | null | undefined;
};

interface ElectronApiWithExternalOpen {
    openExternal?: ElectronShellExternalApi["openExternal"];
}

/**
 * Wires click and keyboard activation for links marked with
 * `data-external-link` within a root.
 *
 * @param params - Handler options.
 *
 * @returns Cleanup callback for the delegated listeners.
 */
export function attachExternalLinkHandlers({
    electronApiScope,
    root,
    onOpenExternalError,
}: AttachExternalLinkHandlersOptions): CleanupFunction {
    if (!root || typeof root.addEventListener !== "function") {
        return () => {};
    }

    const runtime = getExternalLinkHandlersRuntime();
    let cleanupFunctions: CleanupFunction[] = [
        addEventListenerWithCleanup(root, "click", (event) => {
            const anchor = runtime.resolveExternalLinkAnchor(event.target);

            if (!anchor) {
                return;
            }

            const rawHref = anchor.getAttribute("href") ?? anchor.href;
            const validated = validateExternalHttpUrl(rawHref);

            event.preventDefault();
            event.stopPropagation();

            if (validated !== null) {
                openExternal(
                    validated,
                    onOpenExternalError,
                    runtime,
                    electronApiScope
                );
            }
        }),
        addEventListenerWithCleanup(root, "keydown", (event) => {
            if (!runtime.isKeyboardEvent(event)) {
                return;
            }

            if (event.key !== "Enter") {
                return;
            }

            const anchor = runtime.resolveExternalLinkAnchor(event.target);

            if (!anchor) {
                return;
            }

            const rawHref = anchor.getAttribute("href") ?? anchor.href;
            const validated = validateExternalHttpUrl(rawHref);

            event.preventDefault();
            event.stopPropagation();

            if (validated !== null) {
                openExternal(
                    validated,
                    onOpenExternalError,
                    runtime,
                    electronApiScope
                );
            }
        }),
    ];

    return () => {
        const activeCleanups = cleanupFunctions;
        cleanupFunctions = [];

        for (const cleanup of activeCleanups) {
            try {
                cleanup();
            } catch {
                // Ignore cleanup failures from partially detached test DOMs.
            }
        }
    };
}

function openExternal(
    url: string,
    onOpenExternalError: ((url: string, error: Error) => void) | undefined,
    runtime = getExternalLinkHandlersRuntime(),
    electronApiScope?: RendererElectronApiScope
): void {
    const api = getOpenExternalApi(electronApiScope);

    if (typeof api?.openExternal === "function") {
        void Promise.resolve(api.openExternal(url)).catch((error: unknown) => {
            if (typeof onOpenExternalError !== "function") {
                return;
            }

            try {
                const normalizedError =
                    error instanceof Error ? error : new Error(String(error));
                onOpenExternalError(url, normalizedError);
            } catch {
                // Ignore observer failures.
            }
        });
        return;
    }

    try {
        runtime.openBrowserWindow(url, "_blank", "noopener,noreferrer");
    } catch {
        // Ignore fallback failures outside normal browser contexts.
    }
}

function getOpenExternalApi(
    scope?: RendererElectronApiScope
): ElectronApiWithExternalOpen | null {
    return getRendererElectronApi(isElectronApiWithExternalOpen, scope);
}

function isElectronApiWithExternalOpen(
    value: unknown
): value is ElectronApiWithExternalOpen {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return "openExternal" in value && typeof value.openExternal === "function";
}

function validateExternalHttpUrl(url: unknown): string | null {
    if (typeof url !== "string") {
        return null;
    }

    const trimmed = url.trim();

    if (!trimmed || trimmed.length > 4096 || /\s/u.test(trimmed)) {
        return null;
    }

    for (const character of trimmed) {
        const codePoint = character.codePointAt(0);

        if (
            codePoint !== undefined &&
            (codePoint < 0x20 || codePoint === 0x7f)
        ) {
            return null;
        }
    }

    let parsed: URL;

    try {
        parsed = new URL(trimmed);
    } catch {
        return null;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
    }

    if (parsed.username || parsed.password) {
        return null;
    }

    return trimmed;
}

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
/**
 * Wires click and keyboard activation for links marked with
 * `data-external-link` within a root.
 *
 * @param params - Handler options.
 *
 * @returns Cleanup callback for the delegated listeners.
 */
export function attachExternalLinkHandlers({ root, onOpenExternalError }) {
    if (!root || typeof root.addEventListener !== "function") {
        return () => {};
    }
    let cleanupFunctions = [
        addEventListenerWithCleanup(root, "click", (event) => {
            const anchor = resolveExternalLinkAnchor(event.target);
            if (!anchor) {
                return;
            }
            const rawHref = anchor.getAttribute("href") ?? anchor.href;
            const validated = validateExternalHttpUrl(rawHref);
            event.preventDefault();
            event.stopPropagation();
            if (validated) {
                openExternal(validated, onOpenExternalError);
            }
        }),
        addEventListenerWithCleanup(root, "keydown", (event) => {
            if (!(event instanceof KeyboardEvent)) {
                return;
            }
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }
            const anchor = resolveExternalLinkAnchor(event.target);
            if (!anchor) {
                return;
            }
            const rawHref = anchor.getAttribute("href") ?? anchor.href;
            const validated = validateExternalHttpUrl(rawHref);
            event.preventDefault();
            event.stopPropagation();
            if (validated) {
                openExternal(validated, onOpenExternalError);
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
function openExternal(url, onOpenExternalError) {
    const api = getOpenExternalApi();
    if (typeof api?.openExternal === "function") {
        void Promise.resolve(api.openExternal(url)).catch((error) => {
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
        window.open(url, "_blank", "noopener,noreferrer");
    } catch {
        // Ignore fallback failures outside normal browser contexts.
    }
}
function getOpenExternalApi() {
    const globalApi = globalThis.electronAPI;
    const windowApi =
        typeof globalThis.window === "object"
            ? globalThis.window.electronAPI
            : undefined;
    const api = globalApi ?? windowApi;
    if (api === null || typeof api !== "object") {
        return null;
    }
    return api;
}
function resolveExternalLinkAnchor(target) {
    if (!(target instanceof Element)) {
        return null;
    }
    const anchor = target.closest("a[data-external-link]");
    return anchor instanceof HTMLAnchorElement ? anchor : null;
}
function validateExternalHttpUrl(url) {
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
    let parsed;
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

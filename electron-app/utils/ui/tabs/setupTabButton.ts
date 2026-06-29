import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";

type CleanupFunction = () => void;

type SetupTabButtonWithCache = typeof setupTabButton & {
    cache?: Map<string, HTMLElement>;
};

export interface SetupTabButtonOptions {
    readonly documentRef: Document;
}

type TabButtonElement = HTMLElement & {
    _setupTabButtonCleanup?: CleanupFunction;
};

/**
 * Sets up a tab button by assigning a click event handler to it.
 *
 * @param id - The ID of the button element.
 * @param handler - The event handler function to be executed on click.
 * @param options - Explicit DOM lookup dependencies.
 *
 * @returns Cleanup function to remove the event listener, or undefined if setup
 *   failed.
 */
export function setupTabButton(
    id: unknown,
    handler: unknown,
    { documentRef }: SetupTabButtonOptions
): CleanupFunction | undefined {
    if (
        id === null ||
        id === undefined ||
        typeof id !== "string" ||
        id.trim() === ""
    ) {
        console.warn("Invalid button id provided.");
        return undefined;
    }

    if (typeof handler !== "function") {
        console.warn("Invalid handler provided. It must be a function.");
        return undefined;
    }
    const clickHandler = handler as EventListener;

    const fn = setupTabButton as SetupTabButtonWithCache;
    fn.cache ??= new Map<string, HTMLElement>();
    const { cache } = fn;
    let btn: HTMLElement | null | undefined = cache.get(id);

    if (btn) {
        // Verify cached element is still in DOM
        if (!btn.isConnected) {
            console.warn(
                `Cached button with id "${id}" is no longer in DOM. Refreshing cache.`
            );
            cache.delete(id);
            btn = querySelectorByIdFlexible(documentRef, `#${id}`);
            if (btn) {
                cache.set(id, btn);
            } else {
                console.warn(
                    `Button with id "${id}" not found after cache refresh.`
                );
                return undefined;
            }
        }
    } else {
        btn = querySelectorByIdFlexible(documentRef, `#${id}`);
        if (btn) {
            cache.set(id, btn);
        } else {
            console.warn(
                `Button with id "${id}" not found. Ensure the element exists in the DOM.`
            );
            return undefined;
        }
    }

    // Clean up any existing handlers to prevent memory leaks
    const tabButton = btn as TabButtonElement;
    if (tabButton._setupTabButtonCleanup) {
        tabButton._setupTabButtonCleanup();
    }

    // Use centralized event listener manager for automatic cleanup tracking
    const cleanup = addEventListenerWithCleanup(
        tabButton,
        "click",
        clickHandler
    );

    // Store cleanup function for potential manual cleanup
    tabButton._setupTabButtonCleanup = cleanup;

    return cleanup;
}

/**
 * Internal cache map for button elements keyed by id.
 */
// Initialize the cache property definition so TypeScript (checkJs) recognizes it
Object.assign(setupTabButton, {
    cache: (setupTabButton as SetupTabButtonWithCache).cache,
});

/**
 * Clears the cache and removes all event handlers Useful for cleanup during
 * page navigation or testing
 */
export function clearTabButtonCache(): void {
    const { cache } = setupTabButton as SetupTabButtonWithCache;
    if (cache) {
        // Clean up event handlers before clearing cache
        for (const btn of cache.values()) {
            const tabButton = btn as TabButtonElement;
            if (tabButton._setupTabButtonCleanup) {
                tabButton._setupTabButtonCleanup();
                delete tabButton._setupTabButtonCleanup;
            }
        }
        cache.clear();
    }
}

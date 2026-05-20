/**
 * Sets up a tab button by assigning a click event handler to it.
 *
 * @param id - The ID of the button element.
 * @param handler - The event handler function to be executed on click.
 * @returns Cleanup function to remove the event listener, or void if setup failed.
 */
export function setupTabButton(
    id: unknown,
    handler: unknown
): (() => void) | void;
/** Static properties attached to setupTabButton. */
export namespace setupTabButton {
    /** Internal cache map for button elements keyed by id. */
    let cache: Map<string, HTMLElement> | undefined;
}
/**
 * Clears the cache and removes all event handlers Useful for cleanup during
 * page navigation or testing
 */
export function clearTabButtonCache(): void;

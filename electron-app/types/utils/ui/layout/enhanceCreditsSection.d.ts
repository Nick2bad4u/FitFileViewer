/**
 * Calculates whether the credits footer content overflows its container and
 * applies marquee styling when necessary. The marquee animation pauses on hover
 * and adapts to window resizes or content changes via
 * ResizeObserver/MutationObserver fallbacks.
 *
 * @returns {void}
 */
export function setupCreditsMarquee(): void;
/**
 * Removes registered observers and inline styles applied by
 * {@link setupCreditsMarquee}.
 *
 * @returns {void}
 */
export function teardownCreditsMarquee(): void;

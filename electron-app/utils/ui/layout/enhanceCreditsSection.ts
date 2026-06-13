/**
 * Utilities for enhancing the footer credits section. When the available width
 * is insufficient the credits text transitions into a marquee-style animation
 * that scrolls horizontally without wrapping to additional lines.
 */

import {
    getCreditsMarqueeRuntime,
    type CreditsMarqueeRuntime,
} from "./enhanceCreditsSectionRuntime.js";

const CREDITS_SECTION_SELECTOR = "body > .credits-section";
const MARQUEE_CLASS = "credits-marquee";
const SECTION_ACTIVE_CLASS = "credits-section--marquee-active";

let cleanupCallbacks: (() => void)[] = [];

/**
 * Calculates whether the credits footer content overflows its container and
 * applies marquee styling when necessary. The marquee animation pauses on hover
 * and adapts to window resizes or content changes via
 * ResizeObserver/MutationObserver fallbacks.
 */
export function setupCreditsMarquee(
    runtime: CreditsMarqueeRuntime = getCreditsMarqueeRuntime()
): void {
    teardownCreditsMarquee();

    const sections = runtime.queryCreditsSections(CREDITS_SECTION_SELECTOR);
    for (const section of sections) {
        const footer = section.querySelector("footer");
        if (!runtime.isHTMLElement(footer)) {
            continue;
        }

        let resizeObserver: ResizeObserver | undefined;
        /**
         * Applies or removes marquee styles based on computed overflow.
         */
        const updateMarquee = (): void => {
            footer.classList.remove(MARQUEE_CLASS);
            section.classList.remove(SECTION_ACTIVE_CLASS);
            footer.style.removeProperty("--credits-scroll-distance");
            footer.style.removeProperty("--credits-scroll-duration");

            const availableWidth = section.clientWidth;
            const contentWidth = footer.scrollWidth;
            if (
                !availableWidth ||
                !contentWidth ||
                contentWidth <= availableWidth
            ) {
                return;
            }

            const scrollDistance = Math.max(
                0,
                contentWidth - availableWidth + 32
            );
            const durationSeconds = Math.min(
                45,
                Math.max(16, scrollDistance / 20)
            );

            footer.style.setProperty(
                "--credits-scroll-distance",
                `${scrollDistance}px`
            );
            footer.style.setProperty(
                "--credits-scroll-duration",
                `${durationSeconds}s`
            );
            footer.classList.add(MARQUEE_CLASS);
            section.classList.add(SECTION_ACTIVE_CLASS);
        };

        // Observe size/content changes
        resizeObserver = runtime.createResizeObserver(() => updateMarquee());
        if (resizeObserver) {
            resizeObserver.observe(section);
            resizeObserver.observe(footer);
        } else {
            const listenerController = runtime.createAbortController();
            const resizeHandler = (): void => updateMarquee();
            runtime.addResizeListener(resizeHandler, {
                passive: true,
                signal: listenerController.signal,
            });
            cleanupCallbacks.push(() => {
                listenerController.abort();
                runtime.removeResizeListener(resizeHandler);
            });
        }

        const mutationObserver = runtime.createMutationObserver(() =>
            updateMarquee()
        );
        mutationObserver.observe(footer, {
            childList: true,
            characterData: true,
            subtree: true,
        });

        const animationHandle = runtime.requestAnimationFrame(() =>
            updateMarquee()
        );

        cleanupCallbacks.push(() => {
            if (animationHandle !== undefined) {
                runtime.cancelAnimationFrame(animationHandle);
            }
            mutationObserver.disconnect();
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            footer.classList.remove(MARQUEE_CLASS);
            section.classList.remove(SECTION_ACTIVE_CLASS);
            footer.style.removeProperty("--credits-scroll-distance");
            footer.style.removeProperty("--credits-scroll-duration");
        });
    }
}

/**
 * Removes registered observers and inline styles applied by
 * {@link setupCreditsMarquee}.
 */
export function teardownCreditsMarquee(): void {
    for (const cleanup of cleanupCallbacks) {
        try {
            cleanup();
        } catch (error) {
            console.warn(
                "[creditsMarquee] Failed to clean up observer:",
                error
            );
        }
    }
    cleanupCallbacks = [];
}

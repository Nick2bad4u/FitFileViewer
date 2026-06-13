import {
    getUnifiedControlBarRuntime,
    type UnifiedControlBarRuntime,
    type UnifiedControlBarTimerHandle,
} from "./unifiedControlBarRuntime.js";

type FilenameAutoScrollState = {
    abortController: AbortController;
    disconnect: () => void;
    resizeHandler: EventListener;
    timers: UnifiedControlBarTimerHandle[];
};

const FILENAME_CONTAINER_RESERVED_WIDTH_PX = 50;
const FILENAME_LABEL_GAP_PX = 8;
const FILENAME_SCROLL_PADDING_PX = 20;
const FILENAME_SCROLL_INITIAL_DELAY_MS = 200;
const FILENAME_SCROLL_SECONDARY_DELAY_MS = 500;
const CONTROL_BAR_INITIAL_DELAY_MS = 200;
const CONTROL_BAR_RETRY_DELAY_MS = 100;
const CONTROL_BAR_MAX_RETRIES = 50;

const controlBarTimers = new Set<UnifiedControlBarTimerHandle>();
const filenameAutoScrollStates = new WeakMap<
    HTMLElement,
    FilenameAutoScrollState
>();
const trackedFilenameAutoScrollElements = new Set<HTMLElement>();

function clearControlBarTimers(): void {
    const runtime = getUnifiedControlBarRuntime();
    for (const timer of controlBarTimers) {
        runtime.clearTimeout(timer);
    }
    controlBarTimers.clear();
}

function scheduleControlBarCheck(
    callback: () => void,
    delayMs: number
): UnifiedControlBarTimerHandle {
    const runtime = getUnifiedControlBarRuntime();
    const timer = runtime.setTimeout(() => {
        controlBarTimers.delete(timer);
        callback();
    }, delayMs);
    controlBarTimers.add(timer);
    return timer;
}

function getActiveFilenameElement(
    runtime: UnifiedControlBarRuntime
): HTMLElement | null {
    return runtime.querySelector("#active_file_name");
}

function cleanupExistingFilenameAutoScrollState(
    filenameElement: HTMLElement,
    runtime = getUnifiedControlBarRuntime()
): void {
    const existingState = filenameAutoScrollStates.get(filenameElement);
    if (!existingState) {
        return;
    }

    existingState.disconnect();
    existingState.abortController.abort();
    runtime.removeResizeListener(existingState.resizeHandler);
    for (const timer of existingState.timers) {
        runtime.clearTimeout(timer);
    }
    filenameAutoScrollStates.delete(filenameElement);
    trackedFilenameAutoScrollElements.delete(filenameElement);
}

export function resetUnifiedControlBarStateForTests(): void {
    clearControlBarTimers();
    const runtime = getUnifiedControlBarRuntime();
    for (const filenameElement of trackedFilenameAutoScrollElements) {
        cleanupExistingFilenameAutoScrollState(filenameElement, runtime);
    }
    trackedFilenameAutoScrollElements.clear();
}

/**
 * Adds auto-scroll animation to active filename
 */
export function initFilenameAutoScroll(): void {
    const runtime = getUnifiedControlBarRuntime();
    const filenameElement = getActiveFilenameElement(runtime);
    if (!filenameElement) {
        return;
    }

    cleanupExistingFilenameAutoScrollState(filenameElement, runtime);

    // Helper to check if filename needs scrolling.
    const checkScroll = () => {
        const container = filenameElement.parentElement;
        if (!container) return;

        // Find the scrollable filename text span
        const filenameText =
            filenameElement.querySelector<HTMLElement>(".filename-text");
        if (!filenameText) {
            filenameElement.classList.remove("scrolling");
            return;
        }

        const activeLabel =
            filenameElement.querySelector<HTMLElement>(".active-label");
        const containerWidth =
            container.offsetWidth - FILENAME_CONTAINER_RESERVED_WIDTH_PX;
        const labelWidth = activeLabel
            ? activeLabel.offsetWidth + FILENAME_LABEL_GAP_PX
            : 0;
        const availableWidth = containerWidth - labelWidth;
        const filenameWidth = filenameText.scrollWidth;

        if (filenameWidth > availableWidth) {
            // Enable scrolling animation
            const scrollDistance =
                filenameWidth - availableWidth + FILENAME_SCROLL_PADDING_PX;
            filenameElement.classList.add("scrolling");
            filenameText.style.setProperty(
                "--scroll-distance",
                `${scrollDistance}px`
            );
        } else {
            // Disable scrolling animation
            filenameElement.classList.remove("scrolling");
        }
    };

    // Create observer for filename changes
    const observer = runtime.createMutationObserver(checkScroll);
    observer.observe(filenameElement, {
        characterData: true,
        childList: true,
        subtree: true,
    });

    // Check on window resize
    const abortController = runtime.createAbortController();
    const resizeHandler: EventListener = () => checkScroll();
    runtime.addResizeListener(resizeHandler, {
        signal: abortController.signal,
    });
    const timers = [
        runtime.setTimeout(checkScroll, FILENAME_SCROLL_INITIAL_DELAY_MS),
        runtime.setTimeout(checkScroll, FILENAME_SCROLL_SECONDARY_DELAY_MS),
    ];

    // Keep idempotency and cleanup state private to this module.
    filenameAutoScrollStates.set(filenameElement, {
        abortController,
        disconnect: () => observer.disconnect(),
        resizeHandler,
        timers,
    });
    trackedFilenameAutoScrollElements.add(filenameElement);
}

/**
 * Creates the unified control bar and moves existing controls into it
 */
export function initUnifiedControlBar(): void {
    const runtime = getUnifiedControlBarRuntime();
    // Check if already initialized
    if (runtime.querySelector(".app-control-bar")) {
        return;
    }

    clearControlBarTimers();

    // Create the control bar container
    const controlBar = runtime.createElement("div");
    controlBar.className = "app-control-bar";
    controlBar.setAttribute("role", "toolbar");
    controlBar.setAttribute("aria-label", "Application controls");

    let retryCount = 0;

    // Wait for DOM to be ready, then move controls into the bar
    const checkAndMoveControls = () => {
        // Find the fullscreen button wrapper
        const fullscreenWrapper = runtime.querySelector(
            "#global-fullscreen-btn-wrapper, .fullscreen-btn-wrapper"
        );

        // Find the color switcher
        const colorSwitcher = runtime.querySelector(
            "#quick-color-switcher, .quick-color-switcher"
        );

        if (fullscreenWrapper || colorSwitcher) {
            // Add to body first if not already there
            if (!controlBar.parentElement) {
                runtime.getBody().append(controlBar);
            }

            // Move color switcher first (left side of bar)
            if (colorSwitcher && !controlBar.contains(colorSwitcher)) {
                // Remove from original position
                colorSwitcher.remove();
                controlBar.append(colorSwitcher);
            }

            // Move fullscreen button (right side of bar)
            if (fullscreenWrapper && !controlBar.contains(fullscreenWrapper)) {
                // Remove from original position
                fullscreenWrapper.remove();
                controlBar.append(fullscreenWrapper);
            }

            // If we found both, we're done
            if (colorSwitcher && fullscreenWrapper) {
                clearControlBarTimers();
                return;
            }
        }

        // If controls not found yet or incomplete, try again
        retryCount += 1;
        if (retryCount < CONTROL_BAR_MAX_RETRIES) {
            scheduleControlBarCheck(
                checkAndMoveControls,
                CONTROL_BAR_RETRY_DELAY_MS
            );
        }
    };

    // Start checking for controls with a slight delay to ensure both are created
    scheduleControlBarCheck(checkAndMoveControls, CONTROL_BAR_INITIAL_DELAY_MS);
}

const FILENAME_CONTAINER_RESERVED_WIDTH_PX = 50;
const FILENAME_LABEL_GAP_PX = 8;
const FILENAME_SCROLL_PADDING_PX = 20;
const FILENAME_SCROLL_INITIAL_DELAY_MS = 200;
const FILENAME_SCROLL_SECONDARY_DELAY_MS = 500;
const CONTROL_BAR_INITIAL_DELAY_MS = 200;
const CONTROL_BAR_RETRY_DELAY_MS = 100;
const CONTROL_BAR_MAX_RETRIES = 50;
const controlBarTimers = new Set();
function clearControlBarTimers() {
    for (const timer of controlBarTimers) {
        window.clearTimeout(timer);
    }
    controlBarTimers.clear();
}
function scheduleControlBarCheck(callback, delayMs) {
    const timer = window.setTimeout(() => {
        controlBarTimers.delete(timer);
        callback();
    }, delayMs);
    controlBarTimers.add(timer);
    return timer;
}
function getActiveFilenameElement() {
    const candidate = document.getElementById("active_file_name");
    return candidate instanceof HTMLElement ? candidate : null;
}
function cleanupExistingFilenameAutoScrollState(filenameElement) {
    const existingState = filenameElement.__ffvFilenameAutoScrollState;
    if (!existingState) {
        return;
    }
    existingState.disconnect();
    existingState.abortController.abort();
    window.removeEventListener("resize", existingState.resizeHandler);
    for (const timer of existingState.timers) {
        window.clearTimeout(timer);
    }
    delete filenameElement.__ffvFilenameAutoScrollState;
}
/**
 * Adds auto-scroll animation to active filename
 */
export function initFilenameAutoScroll() {
    const filenameElement = getActiveFilenameElement();
    if (!filenameElement) {
        return;
    }
    cleanupExistingFilenameAutoScrollState(filenameElement);
    // Helper to check if filename needs scrolling.
    const checkScroll = () => {
        const container = filenameElement.parentElement;
        if (!container) return;
        // Find the scrollable filename text span
        const filenameText = filenameElement.querySelector(".filename-text");
        if (!filenameText) {
            filenameElement.classList.remove("scrolling");
            return;
        }
        const activeLabel = filenameElement.querySelector(".active-label");
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
    const observer = new MutationObserver(checkScroll);
    observer.observe(filenameElement, {
        characterData: true,
        childList: true,
        subtree: true,
    });
    // Check on window resize
    const abortController = new AbortController();
    const resizeHandler = () => checkScroll();
    window.addEventListener("resize", resizeHandler, {
        signal: abortController.signal,
    });
    const timers = [
        window.setTimeout(checkScroll, FILENAME_SCROLL_INITIAL_DELAY_MS),
        window.setTimeout(checkScroll, FILENAME_SCROLL_SECONDARY_DELAY_MS),
    ];
    // Store idempotency + cleanup state on the element.
    filenameElement.__ffvFilenameAutoScrollState = {
        abortController,
        disconnect: () => observer.disconnect(),
        resizeHandler,
        timers,
    };
}
/**
 * Creates the unified control bar and moves existing controls into it
 */
export function initUnifiedControlBar() {
    // Check if already initialized
    if (document.querySelector(".app-control-bar")) {
        return;
    }
    clearControlBarTimers();
    // Create the control bar container
    const controlBar = document.createElement("div");
    controlBar.className = "app-control-bar";
    controlBar.setAttribute("role", "toolbar");
    controlBar.setAttribute("aria-label", "Application controls");
    let retryCount = 0;
    // Wait for DOM to be ready, then move controls into the bar
    const checkAndMoveControls = () => {
        // Find the fullscreen button wrapper
        const fullscreenWrapper = document.querySelector(
            "#global-fullscreen-btn-wrapper, .fullscreen-btn-wrapper"
        );
        // Find the color switcher
        const colorSwitcher = document.querySelector(
            "#quick-color-switcher, .quick-color-switcher"
        );
        if (fullscreenWrapper || colorSwitcher) {
            // Add to body first if not already there
            if (!controlBar.parentElement) {
                document.body.append(controlBar);
            }
            // Move color switcher first (left side of bar)
            if (colorSwitcher && !controlBar.contains(colorSwitcher)) {
                // Remove from original position
                if (colorSwitcher.parentElement) {
                    colorSwitcher.parentElement.removeChild(colorSwitcher);
                }
                controlBar.append(colorSwitcher);
            }
            // Move fullscreen button (right side of bar)
            if (fullscreenWrapper && !controlBar.contains(fullscreenWrapper)) {
                // Remove from original position
                if (fullscreenWrapper.parentElement) {
                    fullscreenWrapper.parentElement.removeChild(
                        fullscreenWrapper
                    );
                }
                controlBar.append(fullscreenWrapper);
            }
            // If we found both, we're done
            if (colorSwitcher && fullscreenWrapper) {
                clearControlBarTimers();
                return;
            }
        }
        // If controls not found yet or incomplete, try again
        retryCount++;
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

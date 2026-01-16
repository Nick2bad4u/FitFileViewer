/**
 * @fileoverview Unified Control Bar
 * @description Creates a unified bar combining fullscreen and color switcher controls
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

/**
 * Adds auto-scroll animation to active filename
 */
export function initFilenameAutoScroll() {
    const filenameElement = document.getElementById("activeFileName");
    if (!filenameElement) {
        return;
    }

    /** @type {any} */
    const elAny = filenameElement;
    const stateKey = "__ffvFilenameAutoScrollState";
    const existingState = elAny[stateKey];
    if (existingState && typeof existingState === "object") {
        try {
            if (typeof existingState.disconnect === "function") {
                existingState.disconnect();
            }
            if (typeof existingState.resizeHandler === "function") {
                window.removeEventListener("resize", existingState.resizeHandler);
            }
        } catch {
            /* ignore */
        }
    }

    // Function to check if filename needs scrolling
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
        const containerWidth = container.offsetWidth - 50; // Account for close button
        const labelWidth = activeLabel ? activeLabel.offsetWidth + 8 : 0;
        const availableWidth = containerWidth - labelWidth;
        const filenameWidth = filenameText.scrollWidth;

        if (filenameWidth > availableWidth) {
            // Enable scrolling animation
            const scrollDistance = filenameWidth - availableWidth + 20; // +20 for padding
            filenameElement.classList.add("scrolling");
            filenameText.style.setProperty("--scroll-distance", `${scrollDistance}px`);
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
    const resizeHandler = () => checkScroll();
    window.addEventListener("resize", resizeHandler);

    // Store idempotency + cleanup state on the element.
    elAny[stateKey] = {
        disconnect: () => observer.disconnect(),
        resizeHandler,
    };

    // Initial check with delay to ensure styles are applied
    setTimeout(checkScroll, 200);
    setTimeout(checkScroll, 500);
}

/**
 * Creates the unified control bar and moves existing controls into it
 */
export function initUnifiedControlBar() {
    // Check if already initialized
    if (document.querySelector(".app-control-bar")) {
        return;
    }

    // Create the control bar container
    const controlBar = document.createElement("div");
    controlBar.className = "app-control-bar";
    controlBar.setAttribute("role", "toolbar");
    controlBar.setAttribute("aria-label", "Application controls");

    let retryCount = 0;
    const maxRetries = 50; // Try for up to 5 seconds

    // Wait for DOM to be ready, then move controls into the bar
    const checkAndMoveControls = () => {
        // Find the fullscreen button wrapper
        const fullscreenWrapper = document.querySelector("#global-fullscreen-btn-wrapper, .fullscreen-btn-wrapper");

        // Find the color switcher
        const colorSwitcher = document.querySelector("#quick-color-switcher, .quick-color-switcher");

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
                    fullscreenWrapper.parentElement.removeChild(fullscreenWrapper);
                }
                controlBar.append(fullscreenWrapper);
            }

            // If we found both, we're done
            if (colorSwitcher && fullscreenWrapper) {
                return;
            }
        }

        // If controls not found yet or incomplete, try again
        retryCount++;
        if (retryCount < maxRetries) {
            setTimeout(checkAndMoveControls, 100);
        }
    };

    // Start checking for controls with a slight delay to ensure both are created
    setTimeout(checkAndMoveControls, 200);
}

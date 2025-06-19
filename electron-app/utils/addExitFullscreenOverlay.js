/**
 * Fullscreen overlay configuration and constants
 * @readonly
 */
const FULLSCREEN_CONFIG = {
    CSS_CLASSES: {
        OVERLAY: "exit-fullscreen-overlay",
        THEMED_BTN: "themed-btn",
        EXIT_BTN: "exit-fullscreen-btn",
        ICON: "fullscreen-exit-icon",
        INLINE_SVG: "inline-svg",
    },
    BUTTON_TITLE: "Exit Fullscreen",
    ICON_SIZE: {
        WIDTH: 28,
        HEIGHT: 28,
        STROKE_WIDTH: 2,
    },
    MESSAGES: {
        NO_FULLSCREEN_WARNING: "No element is currently in fullscreen mode.",
        EXIT_ERROR: "Failed to exit fullscreen mode:",
    },
};

/**
 * Adds an exit fullscreen overlay button to the specified container
 * 
 * The button allows users to exit fullscreen mode and is styled according to the app's theme.
 * Uses CSS classes for consistent styling and handles fullscreen API errors gracefully.
 *
 * @param {HTMLElement} container - The DOM element to which the overlay button will be added
 * @throws {TypeError} If container is not a valid DOM element
 * @example
 * // Add exit fullscreen overlay to a chart container
 * addExitFullscreenOverlay(document.getElementById('chart-container'));
 */
export function addExitFullscreenOverlay(container) {
    // Input validation
    if (!container || !(container instanceof HTMLElement)) {
        throw new TypeError("Container must be a valid DOM element");
    }

    // Prevent duplicate overlays
    const existingOverlay = container.querySelector(`.${FULLSCREEN_CONFIG.CSS_CLASSES.OVERLAY}`);
    if (existingOverlay) {
        console.debug("[addExitFullscreenOverlay] Overlay already exists, skipping creation");
        return;
    }

    try {
        const exitButton = createExitButton();
        container.appendChild(exitButton);
    } catch (error) {
        console.error("[addExitFullscreenOverlay] Failed to create overlay:", error);
        throw error;
    }
}

/**
 * Creates the exit fullscreen button element with proper styling and event handling
 * @returns {HTMLButtonElement} The configured exit button element
 * @private
 */
function createExitButton() {
    const button = document.createElement("button");
    
    // Apply CSS classes for styling
    button.className = [
        FULLSCREEN_CONFIG.CSS_CLASSES.OVERLAY,
        FULLSCREEN_CONFIG.CSS_CLASSES.THEMED_BTN,
        FULLSCREEN_CONFIG.CSS_CLASSES.EXIT_BTN,
    ].join(" ");
    
    button.title = FULLSCREEN_CONFIG.BUTTON_TITLE;
    button.innerHTML = createButtonHTML();
    
    // Add click event handler
    button.onclick = handleExitFullscreen;
    
    return button;
}

/**
 * Creates the HTML content for the exit fullscreen button
 * @returns {string} The HTML string for the button content
 * @private
 */
function createButtonHTML() {
    const { WIDTH, HEIGHT, STROKE_WIDTH } = FULLSCREEN_CONFIG.ICON_SIZE;
    
    return `
        <span class="${FULLSCREEN_CONFIG.CSS_CLASSES.ICON}" aria-hidden="true">
            <!-- Material Design Exit Fullscreen Icon -->
            <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="https://www.w3.org/2000/svg" class="${FULLSCREEN_CONFIG.CSS_CLASSES.INLINE_SVG}">
                <title>Exit Fullscreen Icon</title>
                <path d="M9 19H5V23" stroke="currentColor" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 9H23V5" stroke="currentColor" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 19H23V23" stroke="currentColor" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 9H5V5" stroke="currentColor" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </span>
    `;
}

/**
 * Handles the exit fullscreen button click event
 * @param {Event} event - The click event
 * @private
 */
function handleExitFullscreen(event) {
    event.stopPropagation();
    
    try {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch((error) => {
                console.error(`[addExitFullscreenOverlay] ${FULLSCREEN_CONFIG.MESSAGES.EXIT_ERROR}`, error);
            });
        } else {
            console.warn(`[addExitFullscreenOverlay] ${FULLSCREEN_CONFIG.MESSAGES.NO_FULLSCREEN_WARNING}`);
        }
    } catch (error) {
        console.error(`[addExitFullscreenOverlay] ${FULLSCREEN_CONFIG.MESSAGES.EXIT_ERROR}`, error);
    }
}

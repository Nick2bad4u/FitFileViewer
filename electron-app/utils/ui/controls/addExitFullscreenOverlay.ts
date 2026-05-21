const FULLSCREEN_CONFIG = {
    BUTTON_TITLE: "Exit Fullscreen",
    CSS_CLASSES: {
        EXIT_BTN: "exit-fullscreen-btn",
        ICON: "fullscreen-exit-icon",
        INLINE_SVG: "inline-svg",
        OVERLAY: "exit-fullscreen-overlay",
        THEMED_BTN: "themed-btn",
    },
    ICON_SIZE: {
        HEIGHT: 28,
        STROKE_WIDTH: 2,
        WIDTH: 28,
    },
    MESSAGES: {
        EXIT_ERROR: "Failed to exit fullscreen mode:",
        NO_FULLSCREEN_WARNING: "No element is currently in fullscreen mode.",
    },
} as const;

const SVG_NS = "http://www.w3.org/2000/svg";
const ICON_PATHS = [
    "M9 19H5V23",
    "M19 9H23V5",
    "M19 19H23V23",
    "M9 9H5V5",
] as const;

/**
 * Adds an exit fullscreen overlay button to the specified container.
 *
 * The button allows users to exit fullscreen mode and is styled according to
 * the app's theme. Uses CSS classes for consistent styling and handles
 * fullscreen API errors gracefully.
 *
 * @example // Add exit fullscreen overlay to a chart container
 * addExitFullscreenOverlay(document.getElementById("chart-container"));
 *
 * @throws TypeError If container is not a valid DOM element.
 */
export function addExitFullscreenOverlay(container: HTMLElement): void {
    // Input validation
    if (!container || !(container instanceof HTMLElement)) {
        throw new TypeError("Container must be a valid DOM element");
    }

    // Prevent duplicate overlays
    const existingOverlay = container.querySelector<HTMLElement>(
        `.${FULLSCREEN_CONFIG.CSS_CLASSES.OVERLAY}`
    );
    if (existingOverlay) {
        console.debug(
            "[addExitFullscreenOverlay] Overlay already exists, skipping creation"
        );
        return;
    }

    try {
        const exitButton = createExitButton();
        container.append(exitButton);
    } catch (error) {
        console.error(
            "[addExitFullscreenOverlay] Failed to create overlay:",
            error
        );
        throw error;
    }
}

/**
 * Creates the DOM content for the exit fullscreen button.
 */
function createButtonContent(): HTMLSpanElement {
    const { HEIGHT, STROKE_WIDTH, WIDTH } = FULLSCREEN_CONFIG.ICON_SIZE;
    const icon = document.createElement("span");
    icon.className = FULLSCREEN_CONFIG.CSS_CLASSES.ICON;
    icon.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.classList.add(FULLSCREEN_CONFIG.CSS_CLASSES.INLINE_SVG);
    svg.setAttribute("width", String(WIDTH));
    svg.setAttribute("height", String(HEIGHT));
    svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
    svg.setAttribute("fill", "none");

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = "Exit Fullscreen Icon";
    svg.append(title);

    for (const d of ICON_PATHS) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", String(STROKE_WIDTH));
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        svg.append(path);
    }

    icon.append(svg);

    return icon;
}

/**
 * Creates the exit fullscreen button element with proper styling and event
 * handling.
 */
function createExitButton(): HTMLButtonElement {
    const button = document.createElement("button");
    const listenerController = new AbortController();
    button.type = "button";

    // Apply CSS classes for styling
    button.className = [
        FULLSCREEN_CONFIG.CSS_CLASSES.OVERLAY,
        FULLSCREEN_CONFIG.CSS_CLASSES.THEMED_BTN,
        FULLSCREEN_CONFIG.CSS_CLASSES.EXIT_BTN,
    ].join(" ");

    button.title = FULLSCREEN_CONFIG.BUTTON_TITLE;
    button.setAttribute("aria-label", FULLSCREEN_CONFIG.BUTTON_TITLE);
    button.append(createButtonContent());

    // Add click event handler
    button.addEventListener("click", handleExitFullscreen, {
        signal: listenerController.signal,
    });

    return button;
}

/**
 * Handles the exit fullscreen button click event.
 */
function handleExitFullscreen(event: Event): void {
    event.stopPropagation();

    try {
        if (document.fullscreenElement) {
            void document.exitFullscreen().catch((error: unknown) => {
                logExitError(error);
            });
        } else {
            console.warn(
                `[addExitFullscreenOverlay] ${FULLSCREEN_CONFIG.MESSAGES.NO_FULLSCREEN_WARNING}`
            );
        }
    } catch (error) {
        console.error(
            `[addExitFullscreenOverlay] ${FULLSCREEN_CONFIG.MESSAGES.EXIT_ERROR}`,
            error
        );
    }
}

function logExitError(error: unknown): void {
    console.error(
        `[addExitFullscreenOverlay] ${FULLSCREEN_CONFIG.MESSAGES.EXIT_ERROR}`,
        error
    );
}

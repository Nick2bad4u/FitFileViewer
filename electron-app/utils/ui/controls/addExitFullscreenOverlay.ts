import {
    getAddExitFullscreenOverlayRuntime,
    type AddExitFullscreenOverlayRuntime,
} from "./addExitFullscreenOverlayRuntime.js";

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

const ICON_PATHS = [
    "M9 9H5V5",
    "M19 9H23V5",
    "M9 19H5V23",
    "M19 19H23V23",
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
export function addExitFullscreenOverlay(
    container: HTMLElement | null | undefined
): void {
    const runtime = getAddExitFullscreenOverlayRuntime();

    // Input validation
    if (container == null || !runtime.isHTMLElement(container)) {
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
        const exitButton = createExitButton(runtime);
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
function createButtonContent(
    runtime: AddExitFullscreenOverlayRuntime
): HTMLSpanElement {
    const { HEIGHT, STROKE_WIDTH, WIDTH } = FULLSCREEN_CONFIG.ICON_SIZE;
    const icon = runtime.createElement("span");
    icon.className = FULLSCREEN_CONFIG.CSS_CLASSES.ICON;
    icon.setAttribute("aria-hidden", "true");

    const svg = runtime.createSvgElement("svg");
    svg.classList.add(FULLSCREEN_CONFIG.CSS_CLASSES.INLINE_SVG);
    svg.setAttribute("width", String(WIDTH));
    svg.setAttribute("height", String(HEIGHT));
    svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
    svg.setAttribute("fill", "none");

    const title = runtime.createSvgElement("title");
    title.textContent = "Exit Fullscreen Icon";
    svg.append(title);

    for (const d of ICON_PATHS) {
        const path = runtime.createSvgElement("path");
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
function createExitButton(
    runtime: AddExitFullscreenOverlayRuntime
): HTMLButtonElement {
    const button = runtime.createButton();
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
    button.append(createButtonContent(runtime));

    // Add click event handler
    button.addEventListener(
        "click",
        (event) => {
            void handleExitFullscreen(event, runtime);
        },
        {
            signal: listenerController.signal,
        }
    );

    return button;
}

/**
 * Handles the exit fullscreen button click event.
 */
async function handleExitFullscreen(
    event: Event,
    runtime: AddExitFullscreenOverlayRuntime
): Promise<void> {
    event.stopPropagation();

    try {
        if (runtime.getFullscreenElement()) {
            await runtime.exitFullscreen();
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

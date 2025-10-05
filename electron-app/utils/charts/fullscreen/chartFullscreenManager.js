/**
 * Overlay-based fullscreen manager for chart wrappers.
 * Provides a custom fullscreen experience that avoids browser fullscreen APIs
 * to prevent layout reflows and expensive chart re-renders.
 */

const ACTIVE_WRAPPER_CLASS = "chart-wrapper--fullscreen";
const BODY_ACTIVE_CLASS = "chart-fullscreen-active";
const OVERLAY_ID = "chart-fullscreen-overlay";

function getWindowLike() {
    const root = typeof globalThis === "object" ? /** @type {any} */ (globalThis) : {};
    if (root.window && typeof root.window.addEventListener === "function") {
        return root.window;
    }
    return root;
}

/** @type {HTMLElement|null} */
let activeWrapper = null;
/** @type {HTMLElement|null} */
let overlayElement = null;
/** @type {HTMLElement|null} */
let overlayContent = null;
/** @type {HTMLElement|null} */
let placeholderElement = null;
/** @type {{title?: string, onEnter?: () => void, onExit?: () => void}} */
let activeOptions = {};

/** @type {Set<(state: {active: boolean, wrapper: HTMLElement|null}) => void>} */
const listeners = new Set();

const handleKeydown = (event) => {
    if (event.key === "Escape" && activeWrapper) {
        event.stopPropagation();
        exitChartFullscreen();
    }
};

/**
 * Enter fullscreen mode for the chart wrapper.
 * @param {HTMLElement} wrapper
 * @param {{title?: string, onEnter?: () => void, onExit?: () => void}} [options]
 */
export function enterChartFullscreen(wrapper, options) {
    if (!(wrapper instanceof HTMLElement)) {
        return;
    }
    if (activeWrapper === wrapper) {
        return;
    }

    exitChartFullscreen();

    activeOptions = options || {};
    placeholderElement = document.createElement("div");
    placeholderElement.className = "chart-fullscreen-placeholder";
    if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(placeholderElement, wrapper);
    }

    const overlay = ensureOverlay();
    overlayContent = overlay.querySelector("[data-role=\"content\"]");
    if (overlayContent) {
        overlayContent.append(wrapper);
    } else {
        overlay.append(wrapper);
    }

    activeWrapper = wrapper;
    wrapper.classList.add(ACTIVE_WRAPPER_CLASS);
    document.body.classList.add(BODY_ACTIVE_CLASS);
    updateOverlayHeader(activeOptions.title || wrapper.dataset.chartTitle || "Chart");

    getWindowLike().addEventListener("keydown", handleKeydown, { once: false, passive: false });

    if (typeof activeOptions.onEnter === "function") {
        try {
            activeOptions.onEnter();
        } catch {
            /* ignore */
        }
    }

    notifyListeners(true);
}

/**
 * Exit fullscreen mode if active.
 */
export function exitChartFullscreen() {
    if (!activeWrapper) {
        return;
    }

    if (placeholderElement && placeholderElement.parentNode) {
        placeholderElement.replaceWith(activeWrapper);
    }

    activeWrapper.classList.remove(ACTIVE_WRAPPER_CLASS);
    document.body.classList.remove(BODY_ACTIVE_CLASS);

    if (typeof activeOptions.onExit === "function") {
        try {
            activeOptions.onExit();
        } catch {
            /* ignore */
        }
    }

    cleanupOverlay();
    getWindowLike().removeEventListener("keydown", handleKeydown);

    const wrapper = activeWrapper;
    activeWrapper = null;
    activeOptions = {};
    notifyListeners(false, wrapper);
}

/**
 * Check if any chart is currently in fullscreen.
 * @param {HTMLElement} [wrapper]
 * @returns {boolean}
 */
export function isChartFullscreenActive(wrapper) {
    if (!activeWrapper) {
        return false;
    }
    return wrapper ? activeWrapper === wrapper : true;
}

/**
 * Subscribe to fullscreen state changes.
 * @param {(state: {active: boolean, wrapper: HTMLElement|null}) => void} listener
 * @returns {() => void} Cleanup function.
 */
export function subscribeToChartFullscreen(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Toggle fullscreen for the provided wrapper element.
 * @param {HTMLElement} wrapper
 * @param {{title?: string, onEnter?: () => void, onExit?: () => void}} [options]
 */
export function toggleChartFullscreen(wrapper, options) {
    if (activeWrapper === wrapper) {
        exitChartFullscreen();
        return;
    }
    enterChartFullscreen(wrapper, options);
}

function cleanupOverlay() {
    if (overlayElement) {
        overlayElement.remove();
    }
    overlayElement = null;
    overlayContent = null;
    if (placeholderElement) {
        placeholderElement.remove();
    }
    placeholderElement = null;
}

function ensureOverlay() {
    if (overlayElement && overlayElement.parentNode) {
        return overlayElement;
    }

    overlayElement = document.createElement("div");
    overlayElement.id = OVERLAY_ID;
    overlayElement.className = "chart-fullscreen-overlay";
    overlayElement.innerHTML = `
        <div class="chart-fullscreen-overlay__backdrop" data-role="backdrop"></div>
        <div class="chart-fullscreen-overlay__panel">
            <header class="chart-fullscreen-overlay__header">
                <span class="chart-fullscreen-overlay__title" data-role="title">Chart</span>
                <button type="button" class="chart-fullscreen-overlay__close" data-role="close" aria-label="Exit fullscreen">
                    <iconify-icon icon="mdi:close" width="22" height="22" aria-hidden="true"></iconify-icon>
                </button>
            </header>
            <div class="chart-fullscreen-overlay__content" data-role="content"></div>
        </div>
    `;

    const closeButton = overlayElement.querySelector('[data-role="close"]');
    if (closeButton instanceof HTMLElement) {
        closeButton.addEventListener("click", () => exitChartFullscreen());
    }
    const backdrop = overlayElement.querySelector('[data-role="backdrop"]');
    if (backdrop instanceof HTMLElement) {
        backdrop.addEventListener("click", () => exitChartFullscreen());
    }

    document.body.append(overlayElement);
    overlayElement.focus({ preventScroll: true });
    return overlayElement;
}

function notifyListeners(isActive, wrapperOverride) {
    const state = { active: isActive, wrapper: wrapperOverride || activeWrapper };
    for (const listener of listeners) {
        try {
            listener(state);
        } catch {
            /* ignore */
        }
    }
}

function updateOverlayHeader(title) {
    if (!overlayElement) {
        return;
    }
    const titleNode = overlayElement.querySelector('[data-role="title"]');
    if (titleNode) {
        titleNode.textContent = title || "Chart";
    }
}

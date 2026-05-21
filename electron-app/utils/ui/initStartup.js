/**
 * Renderer startup hook for small UI initializers.
 *
 * This file exists so index.html does not need inline scripts. Removing inline
 * scripts allows a stricter Content Security Policy.
 */
import { initFitBrowserFeatureGate } from "./browser/initFitBrowserFeatureGate.js";
import { addEventListenerWithCleanup } from "./events/eventListenerManager.js";
import { initQuickColorSwitcher } from "./quickColorSwitcher.js";
import {
    initFilenameAutoScroll,
    initUnifiedControlBar,
} from "./unifiedControlBar.js";
/**
 * Run the renderer startup initializers that are safe after DOMContentLoaded.
 */
export function runStartupInitializers() {
    initQuickColorSwitcher();
    initUnifiedControlBar();
    initFilenameAutoScroll();
    initFitBrowserFeatureGate();
}
addEventListenerWithCleanup(
    document,
    "DOMContentLoaded",
    runStartupInitializers
);

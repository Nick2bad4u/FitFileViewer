/**
 * Renderer startup hook for small UI initializers.
 *
 * This file exists so index.html does not need inline scripts. Removing inline
 * scripts allows a stricter Content Security Policy.
 */

import { initFitBrowserFeatureGate } from "./browser/initFitBrowserFeatureGate.js";
import { addEventListenerWithCleanup } from "./events/eventListenerManager.js";
import {
    getInitStartupRuntime,
    type InitStartupRuntime,
} from "./initStartupRuntime.js";
import { initQuickColorSwitcher } from "./quickColorSwitcher.js";
import {
    initFilenameAutoScroll,
    initUnifiedControlBar,
} from "./unifiedControlBar.js";

/**
 * Run the renderer startup initializers that are safe after DOMContentLoaded.
 */
export function runStartupInitializers(): void {
    initQuickColorSwitcher();
    initUnifiedControlBar();
    initFilenameAutoScroll();
    initFitBrowserFeatureGate();
}

export function registerStartupInitializers(
    runtime: InitStartupRuntime = getInitStartupRuntime()
): (() => void) | undefined {
    const documentTarget = runtime.getDocumentTarget();
    if (!documentTarget) {
        return undefined;
    }

    return addEventListenerWithCleanup(
        documentTarget,
        "DOMContentLoaded",
        runStartupInitializers
    );
}

registerStartupInitializers();

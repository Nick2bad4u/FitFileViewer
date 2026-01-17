/**
 * @fileoverview Renderer startup hook for small UI initializers.
 *
 * This file exists so index.html does not need inline scripts.
 * Removing inline scripts allows a stricter Content Security Policy.
 */

import { initQuickColorSwitcher } from "./quickColorSwitcher.js";
import { initFilenameAutoScroll, initUnifiedControlBar } from "./unifiedControlBar.js";

document.addEventListener("DOMContentLoaded", () => {
    initQuickColorSwitcher();
    initUnifiedControlBar();
    initFilenameAutoScroll();
});

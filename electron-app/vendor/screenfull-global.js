// Ensure screenfull is available as a global for legacy code paths that expect window.screenfull.
// We import the ESM entry point directly from node_modules and assign it to globalThis.
import screenfull from "../node_modules/screenfull/index.js";

if (!globalThis.screenfull) {
    globalThis.screenfull = screenfull;
}

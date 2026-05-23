// Ensure screenfull is available as a global for legacy code paths that expect window.screenfull.
// Keep the dependency as a curated local browser asset instead of loading from node_modules at runtime.
import screenfull from "./screenfull.js";

if (!globalThis.screenfull) {
    globalThis.screenfull = screenfull;
}

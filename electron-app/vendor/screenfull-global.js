// Make screenfull available as a global
// We import the ESM entry point directly from node_modules and assign it to globalThis.
import screenfull from "../node_modules/screenfull/index.js";

if (!globalThis.screenfull) {
    globalThis.screenfull = screenfull;
}

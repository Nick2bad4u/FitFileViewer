import { setupListeners as setupLifecycleListeners } from "./lifecycle/listeners.js";

/**
 * Legacy listener entrypoint kept for existing renderer imports.
 */
export const setupListeners: typeof setupLifecycleListeners =
    setupLifecycleListeners;

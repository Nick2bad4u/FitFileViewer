/* eslint-disable no-barrel-files/no-barrel-files -- Stable app/lifecycle entry point for existing runtime imports. */
/**
 * Re-exports all modules in the app/lifecycle category.
 */
export * from "./appActions.js";
export * from "./lifecycleListenerCleanupRegistry.js";
export * from "./listeners.js";
export * from "./listenersResize.js";
export * from "./menuIpcListeners.js";
export * from "./recentFilesContextMenu.js";
export * from "./resourceManager.js";
/* eslint-enable no-barrel-files/no-barrel-files */

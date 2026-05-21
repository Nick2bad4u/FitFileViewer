/* eslint-disable no-barrel-files/no-barrel-files -- Stable app category entry point for existing runtime imports. */
/**
 * Re-exports all subcategories in the app category.
 */
import * as appInitialization from "./initialization/index.js";
import * as appLifecycle from "./lifecycle/index.js";
import * as appMenu from "./menu/index.js";
export { getCurrentSettings, getDefaultSettings, reRenderChartsAfterSettingChange, resetAllSettings, } from "./initialization/getCurrentSettings.js";
export { loadSharedConfiguration } from "./initialization/loadSharedConfiguration.js";
export { loadVersionInfo } from "./initialization/loadVersionInfo.js";
export { clearNotification, getCurrentNotification, initializeRendererUtils, isLoading, setLoading, showError, showInfo, showNotification, showSuccess, showWarning, } from "./initialization/rendererUtils.js";
export { cleanup as cleanupWindow, setupWindow } from "./initialization/setupWindow.js";
export { clearSystemInfoCache, updateSystemInfo, } from "./initialization/updateSystemInfo.js";
export { AppActions, AppSelectors, StateMiddleware, stateMiddleware, useComputed, useState, } from "./lifecycle/appActions.js";
export { setupListeners } from "./lifecycle/listeners.js";
export { registerChartResizeListener } from "./lifecycle/listenersResize.js";
export { registerMenuIpcListeners } from "./lifecycle/menuIpcListeners.js";
export { attachRecentFilesContextMenu } from "./lifecycle/recentFilesContextMenu.js";
export { addShutdownHook, cleanup as cleanupResources, cleanupAll, getStats, list, register, registerChart, registerInterval, registerMap, registerObserver, registerTimer, registerWorker, resourceManager, shutdown, unregister, } from "./lifecycle/resourceManager.js";
export * from "./menu/index.js";
export default {
    initialization: appInitialization,
    lifecycle: appLifecycle,
    menu: appMenu,
};
/* eslint-enable no-barrel-files/no-barrel-files */

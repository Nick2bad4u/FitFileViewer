/* eslint-disable no-barrel-files/no-barrel-files -- Stable app category entry point for named runtime imports. */
/**
 * Re-exports all subcategories in the app category.
 */

export { isLoading, setLoading } from "../ui/loading/syncRendererLoading.js";
export {
    clearNotification,
    getCurrentNotification,
    showError,
    showInfo,
    showNotification,
    showSuccess,
    showWarning,
} from "../ui/notifications/syncRendererNotifications.js";
export type {
    NotificationType,
    RendererNotification,
} from "../ui/notifications/syncRendererNotifications.js";
export { initializeRendererStateBindings } from "../ui/rendererStateBindings.js";
export {
    getCurrentSettings,
    getDefaultSettings,
    reRenderChartsAfterSettingChange,
    resetAllSettings,
} from "./initialization/getCurrentSettings.js";
export type {
    ChartSettings,
    FieldColorMap,
    ResettableElement,
} from "./initialization/getCurrentSettings.js";
export { loadSharedConfiguration } from "./initialization/loadSharedConfiguration.js";
export { loadVersionInfo } from "./initialization/loadVersionInfo.js";
export {
    cleanup as cleanupWindow,
    setupWindow,
} from "./initialization/setupWindow.js";
export {
    clearSystemInfoCache,
    updateSystemInfo,
} from "./initialization/updateSystemInfo.js";
export type {
    SystemInfoField,
    SystemInfoRecord,
} from "./initialization/updateSystemInfo.js";

export { AppActions, AppSelectors } from "./lifecycle/appActions.js";
export { setupListeners } from "./lifecycle/listeners.js";
export type {
    FileOpeningStateRef,
    SetupListenersOptions,
} from "./lifecycle/listeners.js";
export { registerChartResizeListener } from "./lifecycle/listenersResize.js";
export { registerMenuIpcListeners } from "./lifecycle/menuIpcListeners.js";
export { attachRecentFilesContextMenu } from "./lifecycle/recentFilesContextMenu.js";
export { resourceManager } from "./lifecycle/resourceManager.js";
export * from "./menu/index.js";
/* eslint-enable no-barrel-files/no-barrel-files */

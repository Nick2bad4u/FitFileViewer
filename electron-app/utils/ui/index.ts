/* eslint-disable no-barrel-files/no-barrel-files -- Stable ui category entry point for existing runtime imports. */
/**
 * Re-exports all subcategories in the ui category.
 */
import * as uiComponents from "./components/index.js";
import * as uiControls from "./controls/index.js";
import * as uiModals from "./modals/index.js";
import * as uiNotifications from "./notifications/index.js";
import * as uiTabs from "./tabs/index.js";

export * from "./components/index.js";
export * from "./controls/index.js";
export * from "./modals/index.js";
export * from "./notifications/index.js";
export * from "./tabs/index.js";

export default {
    components: uiComponents,
    controls: uiControls,
    modals: uiModals,
    notifications: uiNotifications,
    tabs: uiTabs,
};
/* eslint-enable no-barrel-files/no-barrel-files */

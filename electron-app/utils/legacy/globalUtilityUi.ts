import { setTabButtonsEnabled } from "../ui/controls/enableTabButtons.js";
import { showNotification } from "../ui/notifications/showNotification.js";
import { updateActiveTab } from "../ui/tabs/updateActiveTab.js";
import { updateTabVisibility } from "../ui/tabs/updateTabVisibility.js";

/** Legacy UI utilities exposed through the global utility bridge. */
export const uiUtilityExports = Object.freeze({
    setTabButtonsEnabled,
    showNotification,
    updateActiveTab,
    updateTabVisibility,
});

/**
 * Re-exports all subcategories in the app category
 *
 * @file Main Category Barrel Export for app
 */

import * as appInitialization from "./initialization/index.js";
import * as appLifecycle from "./lifecycle/index.js";
import * as appMenu from "./menu/index.js";

export * from "./initialization/index.js";
export * from "./lifecycle/index.js";
export * from "./menu/index.js";

export default {
    initialization: appInitialization,
    lifecycle: appLifecycle,
    menu: appMenu,
};

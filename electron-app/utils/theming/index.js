/**
 * Re-exports all subcategories in the theming category
 *
 * @file Main Category Barrel Export for theming
 */

import * as themingCore from "./core/index.js";
import * as themingSpecific from "./specific/index.js";

export * from "./core/index.js";
export * from "./specific/index.js";

export default {
    core: themingCore,
    specific: themingSpecific,
};

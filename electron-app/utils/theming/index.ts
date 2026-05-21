/* eslint-disable no-barrel-files/no-barrel-files -- Stable theming category entry point for existing runtime imports. */
/**
 * Re-exports all subcategories in the theming category.
 */
import * as themingCore from "./core/index.js";
import * as themingSpecific from "./specific/index.js";

export * from "./core/index.js";
export * from "./specific/index.js";

export default {
    core: themingCore,
    specific: themingSpecific,
};
/* eslint-enable no-barrel-files/no-barrel-files */

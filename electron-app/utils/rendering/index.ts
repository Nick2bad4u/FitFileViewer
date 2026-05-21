/* eslint-disable no-barrel-files/no-barrel-files -- Stable rendering category entry point for existing runtime imports. */
/**
 * Re-exports all subcategories in the rendering category.
 */
import * as renderingComponents from "./components/index.js";
import * as renderingCore from "./core/index.js";

export * from "./components/index.js";
export * from "./core/index.js";

export default {
    components: renderingComponents,
    core: renderingCore,
};
/* eslint-enable no-barrel-files/no-barrel-files */

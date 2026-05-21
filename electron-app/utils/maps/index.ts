/* eslint-disable no-barrel-files/no-barrel-files -- Stable maps category entry point for existing runtime imports. */
/**
 * Re-exports all subcategories in the maps category.
 */
import * as mapControls from "./controls/index.js";
import * as mapCore from "./core/index.js";
import * as mapLayers from "./layers/index.js";

export * from "./core/index.js";

export default {
    controls: mapControls,
    core: mapCore,
    layers: mapLayers,
};
/* eslint-enable no-barrel-files/no-barrel-files */

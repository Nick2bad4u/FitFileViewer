/**
 * Re-exports all subcategories in the rendering category
 *
 * @file Main Category Barrel Export for rendering
 */
import * as renderingComponents from "./components/index.js";
import * as renderingCore from "./core/index.js";

export * from "./components/index.js"; // Component creation utilities
export * from "./core/index.js"; // Core rendering APIs
// Helpers export omitted to avoid duplicate symbol conflicts; import from './helpers/...'

export default {
    components: renderingComponents,
    core: renderingCore,
};

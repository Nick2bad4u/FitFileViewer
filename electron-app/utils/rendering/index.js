/**
 * @fileoverview Main Category Barrel Export for rendering
 * @description Re-exports all subcategories in the rendering category
 */
export * from "./core/index.js"; // Core rendering APIs
export * from "./components/index.js"; // Component creation utilities
// Helpers export omitted to avoid duplicate symbol conflicts; import from './helpers/...'

/**
 * @fileoverview Main Category Barrel Export for state
 * @description Re-exports all subcategories in the state category
 */
export * from "./core/index.js";
// Replace wildcard to prevent duplicate exports of core state functions
export { getState, setState, subscribe, updateState } from "./core/index.js";
export * from "./domain/index.js";
export * from "./integration/index.js";

/* eslint-disable no-barrel-files/no-barrel-files -- Stable state category entry point for named runtime imports. */
/**
 * Re-exports all subcategories in the state category.
 */

export * from "./core/index.js";
// Replace wildcard to prevent duplicate exports of core state functions.
export { getState, setState, subscribe, updateState } from "./core/index.js";
export * from "./domain/index.js";
export * from "./integration/index.js";
/* eslint-enable no-barrel-files/no-barrel-files */

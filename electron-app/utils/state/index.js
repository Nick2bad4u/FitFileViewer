/**
 * Re-exports all subcategories in the state category
 *
 * @file Main Category Barrel Export for state
 */

import * as stateCore from "./core/index.js";
import * as stateDomain from "./domain/index.js";
import * as stateIntegration from "./integration/index.js";

export * from "./core/index.js";
// Replace wildcard to prevent duplicate exports of core state functions
export { getState, setState, subscribe, updateState } from "./core/index.js";
export * from "./domain/index.js";
export * from "./integration/index.js";

export default {
    core: stateCore,
    domain: stateDomain,
    integration: stateIntegration,
};

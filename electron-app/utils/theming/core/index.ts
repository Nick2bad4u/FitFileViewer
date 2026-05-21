/* eslint-disable no-barrel-files/no-barrel-files -- Stable theming/core entry point for existing runtime imports. */
/**
 * Re-exports all modules in the theming/core category.
 */
export { setupTheme } from "./setupTheme.js";
export type { SetupThemeOptions } from "./setupTheme.js";
export * from "./theme.js";
/* eslint-enable no-barrel-files/no-barrel-files */

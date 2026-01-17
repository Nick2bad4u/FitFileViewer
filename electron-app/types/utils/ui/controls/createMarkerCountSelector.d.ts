/**
 * @typedef {ReturnType<typeof getThemeColors>} ThemeColors
 */
/**
 * Creates a marker count selector for controlling data point density on the map
 * @param {Function} onChange - Callback function when marker count changes
 * @returns {HTMLElement} The configured marker count selector container
 */
/**
 * Creates a marker count selector for controlling data point density on the map.
 * Adds wheel support and persists a global `window.mapMarkerCount` value used by map rendering.
 *
 * Contract:
 *  - onChange(number) is called with 0 to mean "all" markers, else the numeric limit.
 *  - Global window.mapMarkerCount is always kept in sync (0 => all).
 *  - Returned element is a container div with a label + select.
 *
 * @param {(count:number)=>void} [onChange] callback invoked when selection changes
 * @returns {HTMLDivElement} container element
 */
export function createMarkerCountSelector(onChange?: (count: number) => void): HTMLDivElement;
export type ThemeColors = ReturnType<typeof getThemeColors>;
import { getThemeColors } from "../../charts/theming/getThemeColors.js";

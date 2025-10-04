/**
 * Creates a density toggle control that allows users to switch between spacious and dense table layouts.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.storageKey - The localStorage key to persist the density preference
 * @param {(density: 'spacious' | 'dense') => void} options.onChange - Callback when density changes
 * @param {'spacious' | 'dense'} [options.defaultDensity='spacious'] - Default density mode
 * @param {boolean} [options.showLabel=false] - Whether to show a label next to the button
 * @param {string} [options.labelText='Density:'] - Text for the label
 * @returns {HTMLElement} The density toggle control element (button or container with label)
 *
 * @example
 * const toggle = createDensityToggle({
 *   storageKey: 'summaryTableDensity',
 *   showLabel: true,
 *   onChange: (density) => {
 *     container.classList.toggle('density-dense', density === 'dense');
 *     container.classList.toggle('density-spacious', density === 'spacious');
 *   }
 * });
 */
export function createDensityToggle({ defaultDensity, labelText, onChange, showLabel, storageKey }: {
    storageKey: string;
    onChange: (density: "spacious" | "dense") => void;
    defaultDensity?: "spacious" | "dense" | undefined;
    showLabel?: boolean | undefined;
    labelText?: string | undefined;
}): HTMLElement;
/**
 * Gets the saved density preference for a given storage key
 * @param {string} storageKey - The localStorage key
 * @param {'spacious' | 'dense'} [defaultDensity='spacious'] - Default if not found
 * @returns {'spacious' | 'dense'} The density preference
 */
export function getDensityPreference(storageKey: string, defaultDensity?: "spacious" | "dense"): "spacious" | "dense";
//# sourceMappingURL=createDensityToggle.d.ts.map
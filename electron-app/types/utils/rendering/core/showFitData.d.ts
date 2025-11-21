/**
 * Shows FIT data in the UI and updates application state
 * Used by Electron main process to display loaded FIT file data
 *
 * @param {Object} data - Parsed FIT file data
 * @param {string} [filePath] - Path to the FIT file
 * @param {Object} [options={}] - Display options
 * @param {boolean} [options.resetRenderStates=true] - Whether to reset rendering states
 * @param {boolean} [options.updateUI=true] - Whether to update UI elements
 *
 * @example
 * // Show FIT data with default options
 * showFitData(parsedData, "/path/to/file.fit");
 *
 * @example
 * // Show data without resetting render states
 * showFitData(parsedData, "/path/to/file.fit", { resetRenderStates: false });
 *
 * @public
 */
export function showFitData(
    data: Object,
    filePath?: string,
    options?: {
        resetRenderStates?: boolean | undefined;
        updateUI?: boolean | undefined;
    }
): void;
export type FitDataObject = {
    /**
     * - Cached filename for performance
     */
    cachedFileName?: string;
    /**
     * - Cached filepath for performance
     */
    cachedFilePath?: string;
};
export type DisplayOptions = {
    /**
     * - Whether to reset rendering states
     */
    resetRenderStates?: boolean;
    /**
     * - Whether to update UI elements
     */
    updateUI?: boolean;
};
//# sourceMappingURL=showFitData.d.ts.map

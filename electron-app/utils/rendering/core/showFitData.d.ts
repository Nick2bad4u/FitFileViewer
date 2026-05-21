/** Display options accepted by the legacy FIT data renderer. */
export type ShowFitDataOptions = {
    resetRenderStates?: boolean;
    updateUI?: boolean;
};

/** Renders parsed FIT data into the main UI and updates related state. */
export function showFitData(
    data: Record<string, unknown>,
    filePath?: string,
    options?: ShowFitDataOptions
): void;

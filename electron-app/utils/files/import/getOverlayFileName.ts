import { getState } from "../../state/core/stateManager.js";

type LoadedFitFile = {
    readonly filePath?: unknown;
};

const ERROR_MESSAGES = {
    INVALID_INDEX: "Index must be a non-negative integer",
    INVALID_LOADED_FILES: "Loaded FIT files data is not an array",
    STATE_ACCESS_ERROR: "Failed to access overlay file state:",
} as const;

/**
 * Gets the filename for a loaded FIT file overlay by index.
 *
 * Safely retrieves the file path from the loaded FIT files state with proper
 * validation. Returns an empty string if the index is out of bounds or file
 * data is unavailable.
 *
 * @example
 * ```ts
 * const filename = getOverlayFileName(0);
 * ```
 *
 * @throws TypeError when idx is not a non-negative integer.
 */
export function getOverlayFileName(idx: number): string {
    if (!Number.isInteger(idx) || idx < 0) {
        throw new TypeError(ERROR_MESSAGES.INVALID_INDEX);
    }

    try {
        const loadedFitFiles = getState<unknown>("globalData.loadedFitFiles");

        if (!Array.isArray(loadedFitFiles)) {
            console.warn(
                `[getOverlayFileName] ${ERROR_MESSAGES.INVALID_LOADED_FILES}`
            );
            return "";
        }

        const fileData = loadedFitFiles[idx] as LoadedFitFile | undefined;
        if (
            fileData &&
            typeof fileData.filePath === "string" &&
            fileData.filePath.trim()
        ) {
            return fileData.filePath;
        }

        return "";
    } catch (error) {
        console.error(
            `[getOverlayFileName] ${ERROR_MESSAGES.STATE_ACCESS_ERROR}`,
            error
        );
        return "";
    }
}

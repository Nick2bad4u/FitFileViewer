import { getLoadedFitFiles } from "../../state/domain/loadedFitFilesState.js";

const ERROR_MESSAGES = {
    INVALID_INDEX: "Index must be a non-negative integer",
    INVALID_LOADED_FILES: "Loaded FIT files data is not an array",
    STATE_ACCESS_ERROR: "Failed to access overlay file state:",
} as const;

function getLoadedFitFilePath(value: unknown): string {
    if (!isRecord(value)) {
        return "";
    }

    const filePath = value["filePath"];
    return typeof filePath === "string" && filePath.trim() ? filePath : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Gets the filename for a loaded FIT file overlay by index.
 *
 * Safely retrieves the file path from the loaded FIT files state with proper
 * validation. Returns an empty string if the index is out of bounds or file
 * data is unavailable.
 *
 * @example
 *
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
        const loadedFitFiles = getLoadedFitFiles();

        if (!Array.isArray(loadedFitFiles)) {
            console.warn(
                `[getOverlayFileName] ${ERROR_MESSAGES.INVALID_LOADED_FILES}`
            );
            return "";
        }

        return getLoadedFitFilePath(loadedFitFiles[idx]);
    } catch (error) {
        console.error(
            `[getOverlayFileName] ${ERROR_MESSAGES.STATE_ACCESS_ERROR}`,
            error
        );
        return "";
    }
}

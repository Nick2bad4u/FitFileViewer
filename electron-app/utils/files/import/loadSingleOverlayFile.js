import {
    getFitFileBufferValidationError,
    isFitFileArrayBuffer,
    MAX_FIT_FILE_BYTES,
} from "./fitFileValidation.js";
import {
    getFitMessageRows,
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "./fitParsePayload.js";
/**
 * Loads one FIT file as a map overlay.
 */
export async function loadSingleOverlayFile(file) {
    try {
        const preflightError = validateOverlayFilePreflight(file);
        if (preflightError) {
            return { error: preflightError, success: false };
        }
        const arrayBuffer = await readOverlayArrayBuffer(file);
        const bufferValidationError =
            getFitFileBufferValidationError(arrayBuffer);
        if (bufferValidationError) {
            return {
                error: bufferValidationError,
                success: false,
            };
        }
        if (!isFitFileArrayBuffer(arrayBuffer)) {
            return {
                error: "Failed to read file as ArrayBuffer",
                success: false,
            };
        }
        const api = resolveOverlayElectronAPI();
        if (!api) {
            return {
                error: "No file data or decoder not available",
                success: false,
            };
        }
        const result = await api.decodeFitFile(arrayBuffer);
        const parseErrorMessage = result
            ? getFitParseErrorMessage(result)
            : null;
        if (!result || parseErrorMessage) {
            return {
                error: parseErrorMessage?.display || "Failed to parse FIT file",
                success: false,
            };
        }
        const messages = unwrapFitParseMessages(result);
        const recordMesgs = getFitMessageRows(messages, "recordMesgs");
        if (!hasValidLocationRecords(recordMesgs)) {
            return {
                error: "No valid location data found in file",
                success: false,
            };
        }
        return { data: toOverlayFitData(messages), success: true };
    } catch (error) {
        console.error(
            "[loadSingleOverlayFile] Error processing file:",
            getOverlayFileName(file),
            error
        );
        return {
            error: getErrorMessage(error),
            success: false,
        };
    }
}
function toOverlayFitData(messages) {
    return messages;
}
function validateOverlayFilePreflight(file) {
    const { name, size } = file;
    if (!isFitName(name)) {
        return "Only .fit files can be loaded as overlays";
    }
    if (
        typeof size === "number" &&
        Number.isFinite(size) &&
        size > MAX_FIT_FILE_BYTES
    ) {
        return "File size exceeds 100MB limit";
    }
    return "";
}
function isFitName(name) {
    return typeof name === "string" && name.trim().length > 0
        ? /\.fit$/iu.test(name.trim())
        : true;
}
function getOverlayFileGlobal() {
    return globalThis;
}
function resolveOverlayElectronAPI() {
    const { electronAPI } = getOverlayFileGlobal();
    if (!electronAPI || typeof electronAPI.decodeFitFile !== "function") {
        return undefined;
    }
    return {
        decodeFitFile: electronAPI.decodeFitFile,
    };
}
async function readOverlayArrayBuffer(file) {
    if (typeof file.arrayBuffer === "function") {
        return file.arrayBuffer();
    }
    if (file instanceof Blob) {
        if (typeof Response !== "undefined") {
            try {
                return await new Response(file).arrayBuffer();
            } catch {
                // Fall back to FileReader below.
            }
        }
        return readFileWithFileReader(file);
    }
    return undefined;
}
function readFileWithFileReader(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const controller = new AbortController();
        reader.addEventListener(
            "load",
            () => {
                controller.abort();
                resolve(
                    reader.result instanceof ArrayBuffer
                        ? reader.result
                        : undefined
                );
            },
            { signal: controller.signal }
        );
        reader.addEventListener(
            "error",
            () => {
                controller.abort();
                reject(new Error("Failed to read file"));
            },
            { signal: controller.signal }
        );
        reader.readAsArrayBuffer(file);
    });
}
function hasValidLocationRecords(records) {
    if (!records || records.length === 0) {
        return false;
    }
    return records.some((record) => hasNumericLocation(record));
}
function hasNumericLocation(record) {
    const positionLat = record["positionLat"];
    const positionLong = record["positionLong"];
    return typeof positionLat === "number" && typeof positionLong === "number";
}
function getOverlayFileName(file) {
    return typeof file === "object" && file ? file.name : undefined;
}
function getErrorMessage(error) {
    return error instanceof Error && error.message
        ? error.message
        : "Unknown error processing file";
}

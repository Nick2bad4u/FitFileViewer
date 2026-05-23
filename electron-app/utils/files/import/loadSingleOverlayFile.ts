import {
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "./fitParsePayload.js";
import type { FitDecodeResult } from "../../../shared/fit";

/** Decoded FIT data used by map overlay loading. */
export type OverlayFitData = {
    cachedFilePath?: string;
    error?: string;
    recordMesgs?: unknown[];
    [key: string]: unknown;
};

/** Result returned after attempting to load and validate one overlay file. */
export type OverlayLoadResult =
    | {
          data: OverlayFitData;
          success: true;
      }
    | {
          error: string;
          success: false;
      };

type OverlayElectronAPI = {
    decodeFitFile?: (
        arrayBuffer: ArrayBuffer
    ) => Promise<FitDecodeResult | undefined>;
};

type OverlayFileGlobal = typeof globalThis & {
    electronAPI?: OverlayElectronAPI;
};

type OverlayFileLike = {
    arrayBuffer?: () => Promise<ArrayBuffer>;
    name?: unknown;
    size?: unknown;
};

const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

/**
 * Loads one FIT file as a map overlay.
 */
export async function loadSingleOverlayFile(
    file: File | OverlayFileLike
): Promise<OverlayLoadResult> {
    try {
        const preflightError = validateOverlayFilePreflight(file);
        if (preflightError) {
            return { error: preflightError, success: false };
        }

        const arrayBuffer = await readOverlayArrayBuffer(file);
        if (!(arrayBuffer instanceof ArrayBuffer)) {
            return {
                error: "Failed to read file as ArrayBuffer",
                success: false,
            };
        }

        if (arrayBuffer.byteLength === 0) {
            return {
                error: "Selected file appears to be empty",
                success: false,
            };
        }

        if (arrayBuffer.byteLength > MAX_FIT_FILE_BYTES) {
            return { error: "File size exceeds 100MB limit", success: false };
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

        const fitData = unwrapFitParseMessages(result) as OverlayFitData;
        if (!hasValidLocationRecords(fitData.recordMesgs)) {
            return {
                error: "No valid location data found in file",
                success: false,
            };
        }

        return { data: fitData, success: true };
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

function validateOverlayFilePreflight(file: File | OverlayFileLike): string {
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

function isFitName(name: unknown): boolean {
    return typeof name === "string" && name.trim().length > 0
        ? /\.fit$/iu.test(name.trim())
        : true;
}

function getOverlayFileGlobal(): OverlayFileGlobal {
    return globalThis as OverlayFileGlobal;
}

function resolveOverlayElectronAPI():
    | {
          decodeFitFile: (
              arrayBuffer: ArrayBuffer
          ) => Promise<FitDecodeResult | undefined>;
      }
    | undefined {
    const { electronAPI } = getOverlayFileGlobal();
    if (!electronAPI || typeof electronAPI.decodeFitFile !== "function") {
        return undefined;
    }

    return {
        decodeFitFile: electronAPI.decodeFitFile,
    };
}

async function readOverlayArrayBuffer(
    file: File | OverlayFileLike
): Promise<ArrayBuffer | undefined> {
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

function readFileWithFileReader(file: Blob): Promise<ArrayBuffer | undefined> {
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

function hasValidLocationRecords(records: unknown): boolean {
    if (!Array.isArray(records) || records.length === 0) {
        return false;
    }

    return records.some((record) => hasNumericLocation(record));
}

function hasNumericLocation(record: unknown): boolean {
    if (!record || typeof record !== "object") {
        return false;
    }

    const { positionLat, positionLong } = record as {
        positionLat?: unknown;
        positionLong?: unknown;
    };

    return typeof positionLat === "number" && typeof positionLong === "number";
}

function getOverlayFileName(file: File | OverlayFileLike): unknown {
    return typeof file === "object" && file ? file.name : undefined;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error && error.message
        ? error.message
        : "Unknown error processing file";
}

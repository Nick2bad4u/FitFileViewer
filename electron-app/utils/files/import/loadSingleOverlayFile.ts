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
import type { FitMessageRow, FitMessages } from "../../../shared/fit";
import type { ElectronFileApi } from "../../../shared/preloadApi.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import {
    getLoadSingleOverlayFileRuntime,
    type LoadSingleOverlayFileRuntime,
    type LoadSingleOverlayFileRuntimeScope,
} from "./loadSingleOverlayFileRuntime.js";

/** Decoded FIT data used by map overlay loading. */
export type OverlayFitData = {
    cachedFilePath?: string;
    error?: string;
    recordMesgs?: FitMessageRow[];
    [messageName: string]: FitMessageRow[] | string | undefined;
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

interface OverlayElectronAPI {
    decodeFitFile: ElectronFileApi["decodeFitFile"];
}

type OverlayFileLike = {
    arrayBuffer?: () => Promise<ArrayBuffer>;
    name?: unknown;
    size?: unknown;
};

type LoadSingleOverlayFileOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
    readonly runtimeScope?: LoadSingleOverlayFileRuntimeScope | undefined;
};

function loadSingleOverlayFileRuntime(): LoadSingleOverlayFileRuntime {
    return getLoadSingleOverlayFileRuntime();
}

/**
 * Loads one FIT file as a map overlay.
 */
export async function loadSingleOverlayFile(
    file: File | OverlayFileLike,
    { electronApiScope, runtimeScope }: LoadSingleOverlayFileOptions = {}
): Promise<OverlayLoadResult> {
    try {
        const runtime = runtimeScope
            ? getLoadSingleOverlayFileRuntime(runtimeScope)
            : loadSingleOverlayFileRuntime();
        const preflightError = validateOverlayFilePreflight(file);
        if (preflightError) {
            return { error: preflightError, success: false };
        }

        const arrayBuffer = await readOverlayArrayBuffer(file, runtime);
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

        const api = resolveOverlayElectronAPI(electronApiScope);
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

function toOverlayFitData(messages: FitMessages): OverlayFitData {
    return messages;
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

function resolveOverlayElectronAPI(
    electronApiScope: RendererElectronApiScope | undefined
): OverlayElectronAPI | undefined {
    const electronAPI = getRendererElectronApi<OverlayElectronAPI>(
        isOverlayElectronAPI,
        electronApiScope
    );
    if (!electronAPI) {
        return undefined;
    }

    return {
        decodeFitFile: electronAPI.decodeFitFile,
    };
}

function isOverlayElectronAPI(value: unknown): value is OverlayElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return typeof (value as OverlayElectronAPI).decodeFitFile === "function";
}

async function readOverlayArrayBuffer(
    file: File | OverlayFileLike,
    runtime: LoadSingleOverlayFileRuntime
): Promise<ArrayBuffer | undefined> {
    if (typeof file.arrayBuffer === "function") {
        return file.arrayBuffer();
    }

    if (file instanceof Blob) {
        const responseRead = runtime.readBlobArrayBufferWithResponse(file);
        if (responseRead) {
            try {
                return await responseRead;
            } catch {
                // Fall back to FileReader below.
            }
        }

        return readFileWithFileReader(file, runtime);
    }

    return undefined;
}

function readFileWithFileReader(
    file: Blob,
    runtime: LoadSingleOverlayFileRuntime
): Promise<ArrayBuffer | undefined> {
    return new Promise((resolve, reject) => {
        const reader = runtime.createFileReader();
        const controller = runtime.createAbortController();
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

function hasValidLocationRecords(
    records: readonly FitMessageRow[] | undefined
): boolean {
    if (!records || records.length === 0) {
        return false;
    }

    return records.some((record) => hasNumericLocation(record));
}

function hasNumericLocation(record: FitMessageRow): boolean {
    const positionLat = record["positionLat"];
    const positionLong = record["positionLong"];

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

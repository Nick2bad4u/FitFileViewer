import { getActiveFitRawData } from "./activeFitRawDataState.js";
import { FitFileSelectors } from "./fitFileState.js";

type MetadataSource = Record<string, unknown>;

export type ActiveFitFileMetadata = {
    cachedFilePath: null | string;
    currentFilePath: null | string;
    fallbackName: null | string;
    loadedFilePath: null | string;
    storageIdentity: null | string;
};

export function getActiveFitFileMetadata({
    fallbackName,
    sourceData,
}: {
    fallbackName?: unknown;
    sourceData?: null | MetadataSource;
} = {}): ActiveFitFileMetadata {
    const currentFilePath = normalizePath(FitFileSelectors.getCurrentFile());
    const rawData = getActiveFitRawData();
    const cachedFilePath =
        getPathFromRecord(rawData, "cachedFilePath") ??
        getPathFromRecord(sourceData, "cachedFilePath");
    const loadedFilePath = normalizePath(
        FitFileSelectors.getLoadedFiles()[0]?.filePath
    );
    const safeFallbackName = normalizePath(fallbackName);

    return {
        cachedFilePath,
        currentFilePath,
        fallbackName: safeFallbackName,
        loadedFilePath,
        storageIdentity:
            currentFilePath ??
            cachedFilePath ??
            loadedFilePath ??
            safeFallbackName,
    };
}

function getPathFromRecord(
    value: null | MetadataSource | undefined,
    key: string
): null | string {
    if (value === null || value === undefined) {
        return null;
    }

    return normalizePath(value[key]);
}

function normalizePath(value: unknown): null | string {
    return typeof value === "string" && value.trim().length > 0 ? value : null;
}

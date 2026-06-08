import {
    FitFileSelectors,
    fitFileStateManager,
    type LoadedFitFile,
} from "./fitFileState.js";

/**
 * Returns the active file plus overlay FIT-file entries.
 */
export function getLoadedFitFiles(): LoadedFitFile[] {
    return FitFileSelectors.getLoadedFiles();
}

export type OverlayLoadedFitFile = {
    file: LoadedFitFile;
    fileIndex: number;
    overlayIndex: number;
};

/**
 * Returns overlay FIT-file entries with their original loaded-file index.
 */
export function getOverlayLoadedFitFiles(): OverlayLoadedFitFile[] {
    return getLoadedFitFiles()
        .slice(1)
        .map((file, overlayIndex) => ({
            file,
            fileIndex: overlayIndex + 1,
            overlayIndex,
        }));
}

/**
 * Stores loaded FIT files in explicit state.
 */
export function setLoadedFitFiles(
    files: readonly LoadedFitFile[],
    source = "loadedFitFilesState.setLoadedFitFiles"
): LoadedFitFile[] {
    const nextFiles = [...files];
    fitFileStateManager.setLoadedFiles(nextFiles, source);
    return [...nextFiles];
}

export function appendLoadedFitFile(
    entry: LoadedFitFile,
    source = "loadedFitFilesState.appendLoadedFitFile"
): LoadedFitFile[] {
    return setLoadedFitFiles([...getLoadedFitFiles(), entry], source);
}

export function removeLoadedFitFileAt(
    index: number,
    source = "loadedFitFilesState.removeLoadedFitFileAt"
): LoadedFitFile[] {
    if (!Number.isInteger(index) || index < 0) {
        return getLoadedFitFiles();
    }

    const files = getLoadedFitFiles();
    if (index >= files.length) {
        return files;
    }

    files.splice(index, 1);
    return setLoadedFitFiles(files, source);
}

export function keepOnlyLoadedFitFileAt(
    index: number,
    source = "loadedFitFilesState.keepOnlyLoadedFitFileAt"
): LoadedFitFile[] {
    const files = getLoadedFitFiles();
    const selected =
        Number.isInteger(index) && index >= 0 ? files[index] : null;
    return setLoadedFitFiles(selected ? [selected] : [], source);
}

export function clearOverlayLoadedFitFiles(
    source = "loadedFitFilesState.clearOverlayLoadedFitFiles"
): LoadedFitFile[] {
    return setLoadedFitFiles(getLoadedFitFiles().slice(0, 1), source);
}

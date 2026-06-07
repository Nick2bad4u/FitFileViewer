type ShownFilesListAfterUpdateCallback = () => void;
type ShownFilesListUpdater = () => void;

let currentShownFilesListUpdater: ShownFilesListUpdater | null = null;

const afterUpdateCallbacks = new Set<ShownFilesListAfterUpdateCallback>();

export function registerShownFilesListAfterUpdate(
    callback: ShownFilesListAfterUpdateCallback
): () => void {
    afterUpdateCallbacks.add(callback);

    return () => {
        afterUpdateCallbacks.delete(callback);
    };
}

export function setShownFilesListUpdater(
    updater: ShownFilesListUpdater
): () => void {
    currentShownFilesListUpdater = updater;

    return () => {
        if (currentShownFilesListUpdater === updater) {
            currentShownFilesListUpdater = null;
        }
    };
}

export function updateShownFilesList(): void {
    currentShownFilesListUpdater?.();

    for (const callback of afterUpdateCallbacks) {
        try {
            callback();
        } catch (error) {
            console.error(
                "[shownFilesListUpdater] Failed to run after-update callback:",
                error
            );
        }
    }
}

/**
 * Mutable flag shared with the file-opening workflow.
 */
export type FileOpeningStateRef = {
    current: boolean;
};

/**
 * Parameters required to wire renderer DOM and IPC listeners.
 */
export type SetupListenersOptions = {
    handleOpenFile(options: {
        isOpeningFileRef: FileOpeningStateRef;
        openFileBtn: HTMLButtonElement;
        setLoading: (loading: boolean) => void;
        showNotification: (
            message: string,
            type?: string,
            duration?: number
        ) => void;
    }): unknown;
    isOpeningFileRef: FileOpeningStateRef;
    openFileBtn?: HTMLButtonElement | null;
    setLoading(loading: boolean): void;
    showAboutModal(...args: unknown[]): unknown;
    showNotification(message: string, type?: string, duration?: number): void;
    showUpdateNotification(...args: unknown[]): unknown;
};

/**
 * Sets up all event listeners for the FitFileViewer application UI and IPC.
 */
export function setupListeners(options: SetupListenersOptions): void;

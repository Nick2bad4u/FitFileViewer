/** Legacy FIT-file state manager singleton. */
export const fitFileStateManager: {
    handleFileLoadingError?: (error: Error) => void;
    startFileLoading?: (filePath: string) => void;
};

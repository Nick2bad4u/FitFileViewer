export namespace LoadingOverlay {
    /**
     * Hides the loading overlay
     */
    function hide(): void;
    /**
     * Shows a loading overlay with progress text
     * @param {string} progressText - Text to display
     * @param {string} fileName - Optional filename to display
     */
    function show(progressText: string, fileName?: string): void;
}

/**
 * @fileoverview Recent files context menu wiring.
 * @description Extracted from utils/app/lifecycle/listeners.js to reduce complexity and file size.
 */
/**
 * Attach the “Recent Files” context menu behavior to the Open File button.
 *
 * This function intentionally preserves the original behavior (including debug logging)
 * because the menu behavior is heavily covered by strict tests.
 *
 * @param {Object} params
 * @param {HTMLButtonElement} params.openFileBtn
 * @param {(isLoading: boolean) => void} params.setLoading
 * @param {(message: string, type?: string, durationMs?: number) => void} params.showNotification
 */
export function attachRecentFilesContextMenu({
    openFileBtn,
    setLoading,
    showNotification,
}: {
    openFileBtn: HTMLButtonElement;
    setLoading: (isLoading: boolean) => void;
    showNotification: (message: string, type?: string, durationMs?: number) => void;
}): void;

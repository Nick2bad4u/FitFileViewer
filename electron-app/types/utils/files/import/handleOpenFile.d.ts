export const __TEST_ONLY_exposedStateManager: typeof stateManager;
/**
 * Handles file opening logic with comprehensive error handling and state management
 *
 * @param {Object} params - Configuration object for file opening
 * @param {Object} params.isOpeningFileRef - Reference object to track opening state
 * @param {HTMLElement} params.openFileBtn - Open file button element
 * @param {Function} params.setLoading - Function to set loading state
 * @param {Function} params.showNotification - Function to show notifications
 * @param {Object} [options={}] - Additional options
 * @param {number} [options.timeout=30000] - Timeout for file operations in milliseconds
 * @param {boolean} [options.validateFileSize=true] - Whether to validate file size
 * @returns {Promise<boolean>} True if file was successfully opened and processed
 *
 * @example
 * // Basic usage
 * const success = await handleOpenFile({
 *   isOpeningFileRef: { value: false },
 *   openFileBtn: document.getElementById('openFileBtn'),
 *   setLoading: (loading) => showLoadingSpinner(loading),
 *   showNotification: (msg, type) => displayMessage(msg, type)
 * });
 *
 * @public
 */
export function handleOpenFile({ isOpeningFileRef, openFileBtn, setLoading, showNotification }: {
    isOpeningFileRef: Object;
    openFileBtn: HTMLElement;
    setLoading: Function;
    showNotification: Function;
}, options?: {
    timeout?: number | undefined;
    validateFileSize?: boolean | undefined;
}): Promise<boolean>;
export function logWithContext(message: any, level?: string, context?: {}): void;
/**
 * Updates UI state during file opening process
 * @param {Object} uiElements - UI elements to update
 * @param {boolean} isLoading - Whether to show loading state
 * @param {boolean} isOpening - Whether file opening is in progress
 * @private
 */
export function updateUIState(uiElements: Object, isLoading: boolean, isOpening: boolean): void;
/**
 * Validates that all required Electron API methods are available.
 * @returns {boolean}
 */
export function validateElectronAPI(): boolean;
import * as stateManager from "../../state/core/stateManager.js";
//# sourceMappingURL=handleOpenFile.d.ts.map
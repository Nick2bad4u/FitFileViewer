/**
 * Sets up all event listeners for the FitFileViewer application UI and IPC.
 *
 * @param {Object} params - The parameters object.
 * @param {HTMLButtonElement} params.openFileBtn - The "Open File" button
 *   element.
 * @param {Object} params.isOpeningFileRef - Reference object to track file
 *   opening state.
 * @param {Function} params.setLoading - Function to show/hide loading overlay.
 * @param {Function} params.showNotification - Function to display notifications
 *   to the user.
 * @param {Function} params.handleOpenFile - Function to handle file opening
 *   logic.
 * @param {Function} params.showUpdateNotification - Function to display update
 *   notifications.
 * @param {Function} params.showAboutModal - Function to display the About modal
 *   dialog.
 */
export function setupListeners({
    handleOpenFile,
    isOpeningFileRef,
    openFileBtn,
    setLoading,
    showAboutModal,
    showNotification,
    showUpdateNotification,
}: {
    openFileBtn: HTMLButtonElement;
    isOpeningFileRef: Object;
    setLoading: Function;
    showNotification: Function;
    handleOpenFile: Function;
    showUpdateNotification: Function;
    showAboutModal: Function;
}): void;

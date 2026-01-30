/**
 * Create or reuse the main application window and wire core lifecycle handlers.
 *
 * @param {Object} options
 * @param {Function} options.browserWindowRef
 * @param {Function} options.getAppState
 * @param {Function} options.setAppState
 * @param {Function} options.safeCreateAppMenu
 * @param {any} options.CONSTANTS
 * @param {Function} options.getThemeFromRenderer
 * @param {Function} options.sendToRenderer
 * @param {Function} options.resolveAutoUpdater
 * @param {Function} options.setupAutoUpdater
 * @param {Function} options.logWithContext
 *
 * @returns {Promise<any>}
 */
export function initializeMainWindow({
    browserWindowRef,
    getAppState,
    setAppState,
    safeCreateAppMenu,
    CONSTANTS,
    getThemeFromRenderer,
    sendToRenderer,
    resolveAutoUpdater,
    setupAutoUpdater,
    logWithContext,
}: {
    browserWindowRef: Function;
    getAppState: Function;
    setAppState: Function;
    safeCreateAppMenu: Function;
    CONSTANTS: any;
    getThemeFromRenderer: Function;
    sendToRenderer: Function;
    resolveAutoUpdater: Function;
    setupAutoUpdater: Function;
    logWithContext: Function;
}): Promise<any>;

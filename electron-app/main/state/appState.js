const {
    mainProcessState,
} = require("../../utils/state/integration/mainProcessStateManager");
const { CONSTANTS } = require("../constants");

/** @type {any} */
let fitParserSettingsConf;

/**
 * Clears all event handlers registered within the main process state (used by
 * dev helpers/tests).
 */
function cleanupEventHandlers() {
    mainProcessState.cleanupEventHandlers();
}

/**
 * Returns the current value for a state key from the main process state
 * manager.
 *
 * @param {string} statePath - Dot-notation state path (e.g.
 *   "fitFile.lastResult").
 *
 * @returns {any} Stored state value.
 */
function getAppState(statePath) {
    return mainProcessState.get(statePath);
}

/**
 * Lazily resolves the configuration store used for fit parser decoder settings.
 * The factory mirrors the previous implementation to keep test hooks
 * unchanged.
 *
 * @returns {any} Electron-conf instance or null when unavailable.
 */
function resolveFitParserSettingsConf() {
    if (fitParserSettingsConf !== undefined) {
        return fitParserSettingsConf;
    }

    try {
        const { Conf } = require("electron-conf");
        fitParserSettingsConf = new Conf({
            name: CONSTANTS.SETTINGS_CONFIG_NAME,
        });
    } catch {
        fitParserSettingsConf = null;
    }

    return fitParserSettingsConf;
}

/**
 * Persists a value into main process state.
 *
 * @param {string} statePath - Dot-notation path to update.
 * @param {any} value - Value to persist.
 * @param {Record<string, any>} [options={}] - Additional metadata forwarded to
 *   the state manager. Default is `{}`
 */
function setAppState(statePath, value, options = {}) {
    return mainProcessState.set(statePath, value, options);
}

module.exports = {
    cleanupEventHandlers,
    getAppState,
    mainProcessState,
    resolveFitParserSettingsConf,
    setAppState,
};

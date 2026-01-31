/**
 * State history tracking utilities for the core state manager.
 */

/**
 * State change history for debugging.
 *
 * @type {Object[]}
 */
const stateHistory = [];

/**
 * Clear state change history.
 */
function clearStateHistory() {
    stateHistory.length = 0;
    console.log("[StateManager] State history cleared");
}

/**
 * Get state change history for debugging.
 *
 * @returns {Object[]} Array of state changes
 */
function getStateHistory() {
    return [...stateHistory];
}

export { clearStateHistory, getStateHistory, stateHistory };

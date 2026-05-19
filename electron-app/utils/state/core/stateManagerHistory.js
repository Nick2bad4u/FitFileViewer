/**
 * Mutable state change history used by the core state manager.
 */
export const stateHistory = [];
/**
 * Clears state change history.
 */
export function clearStateHistory() {
    stateHistory.length = 0;
    console.log("[StateManager] State history cleared");
}
/**
 * Gets a snapshot of state change history for debugging.
 *
 * @returns Array of state changes.
 */
export function getStateHistory() {
    return [...stateHistory];
}

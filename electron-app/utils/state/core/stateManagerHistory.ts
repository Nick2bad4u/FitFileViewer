/**
 * State change record stored for debugging.
 */
export type StateHistoryEntry = {
    readonly newValue: unknown;
    readonly oldValue: unknown;
    readonly path: string;
    readonly source: string;
    readonly timestamp: number;
};

/**
 * Mutable state change history used by the core state manager.
 */
export const stateHistory: StateHistoryEntry[] = [];

/**
 * Clears state change history.
 */
export function clearStateHistory(): void {
    stateHistory.length = 0;
    console.log("[StateManager] State history cleared");
}

/**
 * Gets a snapshot of state change history for debugging.
 *
 * @returns Array of state changes.
 */
export function getStateHistory(): StateHistoryEntry[] {
    return [...stateHistory];
}

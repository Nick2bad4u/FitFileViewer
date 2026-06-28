import {
    getStateHistory,
    type StateUpdateOptions,
} from "../../state/core/stateManager.js";

export type ChartStateUpdateOptions = StateUpdateOptions;

/** Reads chart state history through the centralized state manager. */
export function callGetStateHistory(): unknown[] {
    try {
        return getStateHistory();
    } catch {
        return [];
    }
}

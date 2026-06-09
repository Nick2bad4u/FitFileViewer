import { subscribe } from "../../state/core/stateManager.js";

let currentAvailabilityUpdater: (() => void) | null = null;
let unsubscribeFromFitData: (() => void) | null = null;

export function registerAddFitOverlayButtonAvailabilityUpdater(
    updateAvailability: () => void
): void {
    currentAvailabilityUpdater = updateAvailability;

    if (unsubscribeFromFitData) {
        return;
    }

    unsubscribeFromFitData = subscribe("fitFile.rawData", () => {
        try {
            currentAvailabilityUpdater?.();
        } catch {
            /* ignore */
        }
    });
}

export function resetAddFitOverlayButtonStateForTests(): void {
    try {
        unsubscribeFromFitData?.();
    } finally {
        currentAvailabilityUpdater = null;
        unsubscribeFromFitData = null;
    }
}

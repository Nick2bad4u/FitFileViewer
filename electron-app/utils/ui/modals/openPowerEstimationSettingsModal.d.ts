import type { PowerEstimationSettings } from "../../data/processing/estimateCyclingPower.js";

export function openPowerEstimationSettingsModal(params: {
    hasRealPower: boolean;
    onApply: (settings: PowerEstimationSettings) => void;
}): void;

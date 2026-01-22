import { applyEstimatedPowerToRecords, hasPowerData } from "../../data/processing/estimateCyclingPower.js";
import { openPowerEstimationSettingsModal } from "../modals/openPowerEstimationSettingsModal.js";

/**
 * @param {{
 *  getData: () => {
 *      recordMesgs?: Array<Record<string, unknown>>,
 *      sessionMesgs?: Array<Record<string, unknown>>,
 *      loadedFitFiles?: Array<{ data?: { recordMesgs?: Array<Record<string, unknown>>, sessionMesgs?: Array<Record<string, unknown>> } }>
 *  } | null,
 *  onAfterApply: () => void
 * }} params
 * @returns {HTMLButtonElement}
 */
export function createPowerEstimationButton({ getData, onAfterApply }) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-action-btn";
    btn.title = "Estimated power settings";
    btn.textContent = "⚡ Est Power";

    btn.addEventListener("click", () => {
        const data = getData();
        const recordMesgs = Array.isArray(data?.recordMesgs) ? data.recordMesgs : [];
        const hasRealPower = hasPowerData(recordMesgs);

        openPowerEstimationSettingsModal({
            hasRealPower,
            onApply: (settings) => {
                const currentData = getData();
                /** @type {Set<unknown>} */
                const seen = new Set();

                /**
                 * @param {Array<Record<string, unknown>>} recs
                 * @param {Array<Record<string, unknown>> | undefined} sessionMesgs
                 */
                const applyTo = (recs, sessionMesgs) => {
                    if (!Array.isArray(recs) || recs.length === 0) return;
                    if (seen.has(recs)) return;
                    seen.add(recs);
                    applyEstimatedPowerToRecords({ recordMesgs: recs, sessionMesgs, settings });
                };

                // Apply to the active file's records (if any)
                {
                    const recs = Array.isArray(currentData?.recordMesgs) ? currentData.recordMesgs : [];
                    const sessionMesgs = Array.isArray(currentData?.sessionMesgs)
                        ? currentData.sessionMesgs
                        : undefined;
                    applyTo(recs, sessionMesgs);
                }

                // Also apply to any overlay files currently shown on the map.
                // This ensures tooltips update consistently when the user changes estimation parameters.
                if (Array.isArray(currentData?.loadedFitFiles)) {
                    for (const fitFile of currentData.loadedFitFiles) {
                        const recs = Array.isArray(fitFile?.data?.recordMesgs) ? fitFile.data.recordMesgs : [];
                        const sessionMesgs = Array.isArray(fitFile?.data?.sessionMesgs)
                            ? fitFile.data.sessionMesgs
                            : undefined;
                        applyTo(recs, sessionMesgs);
                    }
                }

                onAfterApply();
            },
        });
    });

    return btn;
}

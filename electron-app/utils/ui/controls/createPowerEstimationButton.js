import {
    applyEstimatedPowerToRecords,
    hasPowerData,
} from "../../data/processing/estimateCyclingPower.js";
import { openPowerEstimationSettingsModal } from "../modals/openPowerEstimationSettingsModal.js";
/** Creates the map toolbar button that opens estimated-power settings. */
export function createPowerEstimationButton({ getData, onAfterApply }) {
    const btn = document.createElement("button");
    const listenerController = new AbortController();
    btn.type = "button";
    btn.className = "map-action-btn";
    btn.title = "Estimated power settings";
    btn.textContent = "⚡ Est Power";
    btn.addEventListener(
        "click",
        () => {
            const data = getData();
            const recordMesgs = getRecordMessages(data);
            const hasRealPower = hasPowerData(recordMesgs);
            openPowerEstimationSettingsModal({
                hasRealPower,
                onApply: (settings) => {
                    applyPowerEstimationToCurrentData(
                        getData(),
                        settings,
                        onAfterApply
                    );
                },
            });
        },
        { signal: listenerController.signal }
    );
    return btn;
}
function applyPowerEstimationToCurrentData(
    currentData,
    settings,
    onAfterApply
) {
    const seen = new Set();
    applyToRecordSet(
        seen,
        getRecordMessages(currentData),
        getSessionMessages(currentData),
        settings
    );
    for (const fitFile of getLoadedFitFiles(currentData)) {
        applyToRecordSet(
            seen,
            getRecordMessages(fitFile.data ?? null),
            getSessionMessages(fitFile.data ?? null),
            settings
        );
    }
    onAfterApply();
}
function applyToRecordSet(seen, recordMesgs, sessionMesgs, settings) {
    if (recordMesgs.length === 0 || seen.has(recordMesgs)) {
        return;
    }
    seen.add(recordMesgs);
    applyEstimatedPowerToRecords(
        sessionMesgs === undefined
            ? { recordMesgs, settings }
            : {
                  recordMesgs,
                  sessionMesgs,
                  settings,
              }
    );
}
function getLoadedFitFiles(data) {
    return Array.isArray(data?.loadedFitFiles) ? data.loadedFitFiles : [];
}
function getRecordMessages(data) {
    return Array.isArray(data?.recordMesgs) ? data.recordMesgs : [];
}
function getSessionMessages(data) {
    return Array.isArray(data?.sessionMesgs) ? data.sessionMesgs : undefined;
}

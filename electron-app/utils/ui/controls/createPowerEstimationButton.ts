import {
    applyEstimatedPowerToRecords,
    hasPowerData,
    type PowerEstimationSettings,
} from "../../data/processing/estimateCyclingPower.js";
import { getLoadedFitFiles } from "../../state/domain/loadedFitFilesState.js";
import { openPowerEstimationSettingsModal } from "../modals/openPowerEstimationSettingsModal.js";
import { getCreatePowerEstimationButtonRuntime } from "./createPowerEstimationButtonRuntime.js";

interface FitRecordContainer {
    readonly recordMesgs?: Record<string, unknown>[];
    readonly sessionMesgs?: Record<string, unknown>[];
}

/** Dependencies used by the estimated-power map action button. */
export interface CreatePowerEstimationButtonParams {
    readonly getData: () => FitRecordContainer | null;
    readonly onAfterApply: () => void;
}

/** Creates the map toolbar button that opens estimated-power settings. */
export function createPowerEstimationButton({
    getData,
    onAfterApply,
}: CreatePowerEstimationButtonParams): HTMLButtonElement {
    const runtime = getCreatePowerEstimationButtonRuntime();
    const btn = runtime.createButton();
    const listenerController = runtime.createAbortController();
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
    currentData: FitRecordContainer | null,
    settings: PowerEstimationSettings,
    onAfterApply: () => void
): void {
    const seen = new Set<Record<string, unknown>[]>();

    applyToRecordSet(
        seen,
        getRecordMessages(currentData),
        getSessionMessages(currentData),
        settings
    );

    for (const fitFile of getLoadedFitFiles()) {
        applyToRecordSet(
            seen,
            getRecordMessages(fitFile.data ?? null),
            getSessionMessages(fitFile.data ?? null),
            settings
        );
    }

    onAfterApply();
}

function applyToRecordSet(
    seen: Set<Record<string, unknown>[]>,
    recordMesgs: Record<string, unknown>[],
    sessionMesgs: Record<string, unknown>[] | undefined,
    settings: PowerEstimationSettings
): void {
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

function getRecordMessages(
    data: FitRecordContainer | null
): Record<string, unknown>[] {
    return Array.isArray(data?.recordMesgs) ? data.recordMesgs : [];
}

function getSessionMessages(
    data: FitRecordContainer | null
): Record<string, unknown>[] | undefined {
    return Array.isArray(data?.sessionMesgs) ? data.sessionMesgs : undefined;
}

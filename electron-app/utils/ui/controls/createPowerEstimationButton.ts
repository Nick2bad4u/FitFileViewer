import {
    applyEstimatedPowerToRecords,
    hasPowerData,
    type PowerEstimationSettings,
} from "../../data/processing/estimateCyclingPower.js";
import { openPowerEstimationSettingsModal } from "../modals/openPowerEstimationSettingsModal.js";

interface FitRecordContainer {
    readonly loadedFitFiles?: readonly {
        readonly data?: FitRecordContainer;
    }[];
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

function getLoadedFitFiles(
    data: FitRecordContainer | null
): NonNullable<FitRecordContainer["loadedFitFiles"]> {
    const loadedFitFiles: unknown = data?.loadedFitFiles;
    return isLoadedFitFiles(loadedFitFiles) ? loadedFitFiles : [];
}

function isLoadedFitFiles(
    value: unknown
): value is NonNullable<FitRecordContainer["loadedFitFiles"]> {
    return Array.isArray(value);
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

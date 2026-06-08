import {
    getActiveFitMessageArray,
    getActiveFitRawData,
} from "./activeFitRawDataState.js";
import type { RawFitData } from "./fitFileState.js";

export type FitActivityRecord = Record<string, unknown>;

export type ActiveFitActivityData = {
    eventMesgs: FitActivityRecord[];
    lapMesgs: FitActivityRecord[];
    rawData: RawFitData | null;
    recordMesgs: FitActivityRecord[];
    sessionMesgs: FitActivityRecord[];
    timeInZoneMesgs: FitActivityRecord[];
};

export function getActiveFitActivityData(): ActiveFitActivityData {
    return {
        eventMesgs: getActiveFitMessageArray<FitActivityRecord>("eventMesgs"),
        lapMesgs: getActiveFitMessageArray<FitActivityRecord>("lapMesgs"),
        rawData: getActiveFitRawData(),
        recordMesgs: getActiveFitMessageArray<FitActivityRecord>("recordMesgs"),
        sessionMesgs:
            getActiveFitMessageArray<FitActivityRecord>("sessionMesgs"),
        timeInZoneMesgs:
            getActiveFitMessageArray<FitActivityRecord>("timeInZoneMesgs"),
    };
}

export function hasActiveFitRecords(): boolean {
    return getActiveFitActivityData().recordMesgs.length > 0;
}

export function getActiveFitPowerInput(): {
    recordMesgs: FitActivityRecord[];
    sessionMesgs?: FitActivityRecord[];
} {
    const activityData = getActiveFitActivityData();
    return activityData.sessionMesgs.length > 0
        ? {
              recordMesgs: activityData.recordMesgs,
              sessionMesgs: activityData.sessionMesgs,
          }
        : {
              recordMesgs: activityData.recordMesgs,
          };
}

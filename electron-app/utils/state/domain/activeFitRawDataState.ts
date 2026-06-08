import { FitFileSelectors, type RawFitData } from "./fitFileState.js";
import { setState, type StateUpdateOptions } from "../core/stateManager.js";

export type ActiveFitMessageRecord = Record<string, unknown>;

const ACTIVE_FIT_RAW_DATA_PATH = "fitFile.rawData";

export function getActiveFitRawData(): RawFitData | null {
    return FitFileSelectors.getRawData();
}

export function setActiveFitRawData(
    value: RawFitData | null | undefined,
    options: StateUpdateOptions = {}
): void {
    setState(ACTIVE_FIT_RAW_DATA_PATH, value ?? null, {
        source: "activeFitRawDataState",
        ...options,
    });
}

export function getActiveFitMessageArray<
    T extends ActiveFitMessageRecord = ActiveFitMessageRecord,
>(key: string, sourceData?: unknown): T[] {
    const rawData =
        sourceData === undefined ? getActiveFitRawData() : sourceData;

    if (
        rawData === null ||
        typeof rawData !== "object" ||
        Array.isArray(rawData)
    ) {
        return [];
    }

    const messages = (rawData as Record<string, unknown>)[key];
    return Array.isArray(messages)
        ? messages.filter((message): message is T =>
              isFitMessageRecord(message)
          )
        : [];
}

function isFitMessageRecord<T extends ActiveFitMessageRecord>(
    value: unknown
): value is T {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

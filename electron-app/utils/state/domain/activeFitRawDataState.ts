import { FitFileSelectors, type RawFitData } from "./fitFileState.js";
import {
    setState,
    subscribe,
    type StateUpdateOptions,
} from "../core/stateManager.js";

export type ActiveFitMessageRecord = Record<string, unknown>;
type ActiveFitRawDataListener = (data: RawFitData | null) => void;
type ActiveFitRawDataChangeListener = (
    data: RawFitData | null,
    previousData: RawFitData | null
) => void;

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

export function subscribeToActiveFitRawData(
    listener: ActiveFitRawDataListener
): () => void {
    return subscribe(ACTIVE_FIT_RAW_DATA_PATH, (data) => {
        listener(normalizeActiveFitRawData(data));
    });
}

export function subscribeToActiveFitRawDataChange(
    listener: ActiveFitRawDataChangeListener
): () => void {
    return subscribe(ACTIVE_FIT_RAW_DATA_PATH, (data, previousData) => {
        listener(
            normalizeActiveFitRawData(data),
            normalizeActiveFitRawData(previousData)
        );
    });
}

export function getActiveFitMessageArray<
    T extends ActiveFitMessageRecord = ActiveFitMessageRecord,
>(key: string, sourceData?: unknown): T[] {
    const rawData =
        sourceData === undefined ? getActiveFitRawData() : sourceData;

    const activeRawData = normalizeActiveFitRawData(rawData);
    if (activeRawData === null) {
        return [];
    }

    const messages = getActiveFitRawDataProperty(activeRawData, key);
    return Array.isArray(messages)
        ? messages.filter((message): message is T =>
              isFitMessageRecord(message)
          )
        : [];
}

function getActiveFitRawDataProperty(data: RawFitData, key: string): unknown {
    return Object.getOwnPropertyDescriptor(data, key)?.value;
}

function isFitMessageRecord<T extends ActiveFitMessageRecord>(
    value: unknown
): value is T {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeActiveFitRawData(value: unknown): RawFitData | null {
    return isActiveFitRawData(value) ? value : null;
}

function isActiveFitRawData(value: unknown): value is RawFitData {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

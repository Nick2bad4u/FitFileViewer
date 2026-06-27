/**
 * Lap number lookup utility for FitFileViewer.
 *
 * Determines which FIT lap message contains a record index. Invalid lap records
 * are skipped so a single corrupt lap does not block later valid laps.
 */

const LOG_PREFIX = "[LapLookup]";

interface LapMessage {
    end_index: number;
    start_index: number;
    total_distance?: number;
    total_elapsed_time?: number;
    total_timer_time?: number;
}

interface InvalidInput {
    error: string;
    isValid: false;
}

interface ValidInput {
    idx: number;
    isValid: true;
    lapMesgs: readonly unknown[];
}

type InputValidation = InvalidInput | ValidInput;
type LapIndexCandidate = {
    end_index: unknown;
    start_index: unknown;
};

/**
 * Determines the 1-based lap number for a data point index, or `null` when the
 * index is invalid or outside all valid lap ranges.
 */
export function getLapNumForIdx(
    idx: unknown,
    lapMesgs: unknown
): number | null {
    try {
        const validation = validateInputs(idx, lapMesgs);
        if (!validation.isValid) {
            console.warn(`${LOG_PREFIX} ${validation.error}`);
            return null;
        }

        for (const [lapIndex, lap] of validation.lapMesgs.entries()) {
            if (!lap) {
                continue;
            }

            if (!isValidLap(lap, lapIndex)) {
                continue;
            }

            if (
                validation.idx >= lap.start_index &&
                validation.idx <= lap.end_index
            ) {
                return lapIndex + 1;
            }
        }

        return null;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error determining lap number for index ${String(idx)}:`,
            error
        );
        return null;
    }
}

function isValidLap(lap: unknown, lapIndex: number): lap is LapMessage {
    if (!lap || typeof lap !== "object") {
        console.warn(
            `${LOG_PREFIX} Invalid lap object at index ${lapIndex}:`,
            lap
        );
        return false;
    }

    if (!hasLapIndexProperties(lap)) {
        console.warn(
            `${LOG_PREFIX} Lap at index ${lapIndex} missing numeric start_index or end_index:`,
            lap
        );
        return false;
    }

    const { end_index: endIndex, start_index: startIndex } = lap;
    if (typeof startIndex !== "number" || typeof endIndex !== "number") {
        console.warn(
            `${LOG_PREFIX} Lap at index ${lapIndex} missing numeric start_index or end_index:`,
            lap
        );
        return false;
    }

    if (startIndex < 0 || endIndex < 0) {
        console.warn(
            `${LOG_PREFIX} Lap at index ${lapIndex} has negative indices:`,
            lap
        );
        return false;
    }

    if (startIndex > endIndex) {
        console.warn(
            `${LOG_PREFIX} Lap at index ${lapIndex} has start_index > end_index:`,
            lap
        );
        return false;
    }

    return true;
}

function hasLapIndexProperties(lap: object): lap is LapIndexCandidate {
    return "start_index" in lap && "end_index" in lap;
}

function validateInputs(idx: unknown, lapMesgs: unknown): InputValidation {
    if (typeof idx !== "number" || !Number.isFinite(idx) || idx < 0) {
        return {
            error: `Invalid index: must be a non-negative finite number, got ${String(idx)}`,
            isValid: false,
        };
    }

    if (!Array.isArray(lapMesgs)) {
        return {
            error: `Invalid lapMesgs: must be an array, got ${typeof lapMesgs}`,
            isValid: false,
        };
    }

    if (lapMesgs.length === 0) {
        return {
            error: "lapMesgs array is empty",
            isValid: false,
        };
    }

    return {
        idx,
        isValid: true,
        lapMesgs,
    };
}

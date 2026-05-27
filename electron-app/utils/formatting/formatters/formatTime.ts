import { CONVERSION_FACTORS } from "../../config/index.js";
import { getChartSetting } from "../../state/domain/settingsStateManager.js";
import {
    convertTimeUnits,
    TIME_UNITS,
    type TimeUnit,
} from "../converters/convertTimeUnits.js";

const TIME_FORMAT_CONSTANTS = {
    FALLBACK_VALUE: "0:00",
    PAD_CHAR: "0",
    PAD_LENGTH: 2,
} as const;

/**
 * Formats seconds into MM:SS or HH:MM:SS format, optionally using user units.
 */
export function formatTime(seconds: unknown, useUserUnits = false): string {
    if (seconds === null || seconds === undefined) {
        console.warn("[formatTime] Invalid seconds value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    if (typeof seconds !== "number") {
        console.warn("[formatTime] Invalid seconds value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    if (!Number.isFinite(seconds)) {
        console.warn("[formatTime] Invalid seconds value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    if (seconds < 0) {
        console.warn("[formatTime] Negative time value:", seconds);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }

    return formatTimeInternal(seconds, useUserUnits);
}

function formatAsTimeString(seconds: number): string {
    const hours = Math.floor(seconds / CONVERSION_FACTORS.SECONDS_PER_HOUR);
    const minutes = Math.floor(
        (seconds % CONVERSION_FACTORS.SECONDS_PER_HOUR) /
            CONVERSION_FACTORS.SECONDS_PER_MINUTE
    );
    const secs = Math.floor(seconds % CONVERSION_FACTORS.SECONDS_PER_MINUTE);

    if (hours > 0) {
        return `${hours}:${padTimePart(minutes)}:${padTimePart(secs)}`;
    }
    return `${minutes}:${padTimePart(secs)}`;
}

function formatTimeInternal(seconds: number, useUserUnits: boolean): string {
    try {
        if (useUserUnits) {
            return formatWithUserUnits(seconds);
        }
        return formatAsTimeString(seconds);
    } catch (error) {
        console.error("[formatTime] Time formatting failed:", error);
        return TIME_FORMAT_CONSTANTS.FALLBACK_VALUE;
    }
}

function formatWithUserUnits(seconds: number): string {
    const timeUnits = resolveTimeUnits(getChartSetting("timeUnits"));

    try {
        const convertedValue = convertTimeUnits(seconds, timeUnits);

        switch (timeUnits) {
            case TIME_UNITS.HOURS: {
                return `${convertedValue.toFixed(2)}h`;
            }
            case TIME_UNITS.MINUTES: {
                return `${convertedValue.toFixed(1)}m`;
            }
            case TIME_UNITS.SECONDS: {
                return formatAsTimeString(seconds);
            }
        }
    } catch (error) {
        console.error("[formatTime] Error in convertTimeUnits:", error);
        throw error;
    }
}

function padTimePart(value: number): string {
    return value
        .toString()
        .padStart(
            TIME_FORMAT_CONSTANTS.PAD_LENGTH,
            TIME_FORMAT_CONSTANTS.PAD_CHAR
        );
}

function resolveTimeUnits(value: unknown): TimeUnit {
    if (
        value === TIME_UNITS.MINUTES ||
        value === TIME_UNITS.HOURS ||
        value === TIME_UNITS.SECONDS
    ) {
        return value;
    }
    return TIME_UNITS.SECONDS;
}

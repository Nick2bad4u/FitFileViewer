/**
 * Summary field patching utility for FitFileViewer.
 *
 * Provides consistent formatting and validation for loosely shaped FIT summary
 * data fields before they are displayed.
 */
import { formatDistance } from "../../formatting/formatters/formatDistance.js";
import { formatDuration } from "../../formatting/formatters/formatDuration.js";
const PATCH_CONSTANTS = {
    DECIMAL_PLACES: {
        CADENCE: 0,
        CALORIES: 0,
        DEFAULT: 2,
        HEART_RATE: 0,
        HIGH_PRECISION: 3,
        POWER: 0,
        TEMPERATURE: 1,
    },
    FIELD_MAPPINGS: {
        CADENCE: [
            "avg_cadence",
            "avgCadence",
            "max_cadence",
            "maxCadence",
            "avg_fractional_cadence",
            "avgFractionalCadence",
        ],
        DISTANCE: ["total_distance", "totalDistance"],
        HEART_RATE: [
            "avg_heart_rate",
            "avgHeartRate",
            "max_heart_rate",
            "maxHeartRate",
        ],
        POWER: [
            "avg_power",
            "avgPower",
            "max_power",
            "maxPower",
            "normalized_power",
            "normalizedPower",
            "total_work",
            "totalWork",
        ],
        SPEED: [
            "avg_speed",
            "avgSpeed",
            "max_speed",
            "maxSpeed",
            "enhanced_avg_speed",
            "enhancedAvgSpeed",
            "enhanced_max_speed",
            "enhancedMaxSpeed",
        ],
        TEMPERATURE: [
            "avg_temperature",
            "avgTemperature",
            "max_temperature",
            "maxTemperature",
        ],
        TIME: [
            "total_timer_time",
            "totalTimerTime",
            "total_elapsed_time",
            "totalElapsedTime",
        ],
    },
    LOG_PREFIX: "[SummaryPatcher]",
};
/**
 * Updates summary fields to human-readable display values.
 *
 * @param obj - Summary object containing metrics to patch.
 * @param options - Patching options.
 *
 * @returns The patched object, using the same reference as the input.
 *
 * @throws Error If validation fails or a formatter throws.
 */
export function patchSummaryFields(obj, options = {}) {
    const config = {
        preserveOriginal: false,
        skipValidation: false,
        ...options,
    };
    try {
        if (!config.skipValidation && !isSummaryRecord(obj)) {
            throw new Error("Invalid input: expected object");
        }
        const backup = config.preserveOriginal ? { ...obj } : null;
        try {
            patchDistance(obj);
            patchTime(obj);
            patchSpeed(obj);
            patchPowerModern(obj);
            patchCalories(obj);
            patchHeartRateModern(obj);
            patchCadenceModern(obj);
            patchRespirationRate(obj);
            patchTemperatureModern(obj);
            patchGritFlow(obj);
            patchTrainingLoad(obj);
            patchStrokes(obj);
            patchFractionalCadence(obj);
            patchTorquePedal(obj);
            patchPCO(obj);
            patchArrays(obj);
            patchTimestamps(obj);
            patchDecimals(obj);
            return obj;
        } catch (error) {
            if (backup) {
                Object.assign(obj, backup);
            }
            throw error;
        }
    } catch (error) {
        logWithContext(
            `Error patching summary fields: ${getErrorMessage(error)}`,
            "error"
        );
        throw error;
    }
}
function isSummaryRecord(value) {
    return Boolean(value) && typeof value === "object";
}
function getErrorMessage(error) {
    if (error && typeof error === "object" && "message" in error) {
        return String(error.message);
    }
    return String(error);
}
function formatArray(value, digits = PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT) {
    if (typeof value === "string") {
        if (!value.includes(",")) {
            return value;
        }
        return value
            .split(",")
            .map((item) => Number(item.trim()).toFixed(digits))
            .join(", ");
    }
    return value.map((item) => Number(item).toFixed(digits)).join(", ");
}
function formatSpeed(value) {
    const mps = Number(value);
    const kmh = (mps * 3.6).toFixed(PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
    const mph = (mps * 2.236_94).toFixed(
        PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
    );
    return `${kmh} km/h / ${mph} mph`;
}
function logWithContext(message, level = "info") {
    try {
        const prefix = PATCH_CONSTANTS.LOG_PREFIX;
        switch (level) {
            case "error": {
                console.error(`${prefix} ${message}`);
                break;
            }
            case "warn": {
                console.warn(`${prefix} ${message}`);
                break;
            }
            default: {
                console.log(`${prefix} ${message}`);
            }
        }
    } catch {
        // Logging must never block summary rendering.
    }
}
function patchArrays(obj) {
    const arrayFields = [
        "avg_left_power_phase",
        "avgLeftPowerPhase",
        "avg_left_power_phase_peak",
        "avgLeftPowerPhasePeak",
        "avg_right_power_phase",
        "avgRightPowerPhase",
        "avg_right_power_phase_peak",
        "avgRightPowerPhasePeak",
    ];
    for (const field of arrayFields) {
        const value = obj[field];
        if (value != null) {
            try {
                if (Array.isArray(value) || typeof value === "string") {
                    obj[field] = formatArray(
                        value,
                        PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
                    );
                }
            } catch (error) {
                logWithContext(
                    `Error formatting array field '${field}': ${getErrorMessage(error)}`,
                    "error"
                );
            }
        }
    }
}
function patchCadenceModern(obj) {
    patchDecimalFields(
        obj,
        PATCH_CONSTANTS.FIELD_MAPPINGS.CADENCE,
        PATCH_CONSTANTS.DECIMAL_PLACES.CADENCE
    );
}
function patchDecimalFields(obj, fieldNames, decimalPlaces) {
    patchFieldsWithFormatter(
        obj,
        fieldNames,
        (value) => Number(value.toFixed(decimalPlaces)),
        `decimal (${decimalPlaces} places)`
    );
}
function patchDistance(obj) {
    patchFieldsWithFormatter(
        obj,
        PATCH_CONSTANTS.FIELD_MAPPINGS.DISTANCE,
        formatDistance,
        "distance"
    );
}
function patchFieldsWithFormatter(obj, fieldNames, formatter, description) {
    for (const fieldName of fieldNames) {
        if (Object.hasOwn(obj, fieldName) && obj[fieldName] != null) {
            const raw = obj[fieldName];
            const value = safeToNumber(raw, fieldName);
            if (value !== null) {
                try {
                    obj[fieldName] = formatter(value);
                } catch (error) {
                    logWithContext(
                        `Error formatting ${description} field '${fieldName}': ${getErrorMessage(error)}`,
                        "error"
                    );
                }
            }
        }
    }
}
function patchHeartRateModern(obj) {
    patchDecimalFields(
        obj,
        PATCH_CONSTANTS.FIELD_MAPPINGS.HEART_RATE,
        PATCH_CONSTANTS.DECIMAL_PLACES.HEART_RATE
    );
}
function patchPowerModern(obj) {
    patchDecimalFields(
        obj,
        PATCH_CONSTANTS.FIELD_MAPPINGS.POWER,
        PATCH_CONSTANTS.DECIMAL_PLACES.POWER
    );
}
function patchSpeed(obj) {
    patchFieldsWithFormatter(
        obj,
        PATCH_CONSTANTS.FIELD_MAPPINGS.SPEED,
        formatSpeed,
        "speed"
    );
}
function patchTemperatureModern(obj) {
    patchDecimalFields(
        obj,
        PATCH_CONSTANTS.FIELD_MAPPINGS.TEMPERATURE,
        PATCH_CONSTANTS.DECIMAL_PLACES.TEMPERATURE
    );
}
function patchTime(obj) {
    patchFieldsWithFormatter(
        obj,
        PATCH_CONSTANTS.FIELD_MAPPINGS.TIME,
        formatDuration,
        "time"
    );
}
function patchCalories(obj) {
    const calorieFields = ["total_calories", "totalCalories"];
    patchDecimalFields(
        obj,
        calorieFields,
        PATCH_CONSTANTS.DECIMAL_PLACES.CALORIES
    );
}
function patchDecimals(obj) {
    try {
        for (const key of Object.keys(obj).filter(
            (candidate) =>
                typeof obj[candidate] === "number" &&
                !Number.isInteger(obj[candidate])
        )) {
            obj[key] = Number(obj[key]).toFixed(
                PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
            );
        }
    } catch (error) {
        logWithContext(
            `Error formatting decimal fields: ${getErrorMessage(error)}`,
            "error"
        );
    }
}
function safeToNumber(value, fieldName = "value") {
    if (value == null) {
        return null;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
        logWithContext(`Invalid ${fieldName}: ${String(value)}`, "warn");
        return null;
    }
    return num;
}
function patchFractionalCadence(obj) {
    const fractionalCadenceFields = [
        "avg_fractional_cadence",
        "avgFractionalCadence",
    ];
    patchDecimalFields(
        obj,
        fractionalCadenceFields,
        PATCH_CONSTANTS.DECIMAL_PLACES.HIGH_PRECISION
    );
}
function patchGritFlow(obj) {
    const gritFlowFields = [
        "avg_flow",
        "avgFlow",
        "avg_grit",
        "avgGrit",
    ];
    patchDecimalFields(
        obj,
        gritFlowFields,
        PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
    );
}
function patchPCO(obj) {
    const pcoFields = [
        "avg_left_pco",
        "avgLeftPco",
        "avg_right_pco",
        "avgRightPco",
    ];
    patchDecimalFields(obj, pcoFields, PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
}
function patchRespirationRate(obj) {
    const respirationFields = [
        "enhanced_avg_respiration_rate",
        "enhancedAvgRespirationRate",
        "enhanced_max_respiration_rate",
        "enhancedMaxRespirationRate",
        "enhanced_min_respiration_rate",
        "enhancedMinRespirationRate",
    ];
    patchDecimalFields(
        obj,
        respirationFields,
        PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
    );
}
function patchStrokes(obj) {
    const strokeFields = [
        "total_strokes",
        "totalStrokes",
        "avg_stroke_distance",
        "avgStrokeDistance",
    ];
    patchDecimalFields(
        obj,
        strokeFields,
        PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
    );
}
function patchTimestamps(obj) {
    const timestampFields = [
        "timestamp",
        "start_time",
        "startTime",
    ];
    for (const field of timestampFields) {
        if (obj[field] != null && typeof obj[field] === "number") {
            try {
                obj[field] = new Date(obj[field] * 1000).toString();
            } catch (error) {
                logWithContext(
                    `Error formatting timestamp field '${field}': ${getErrorMessage(error)}`,
                    "error"
                );
            }
        }
    }
}
function patchTorquePedal(obj) {
    const torqueFields = [
        "avg_left_torque_effectiveness",
        "avgLeftTorqueEffectiveness",
        "avg_right_torque_effectiveness",
        "avgRightTorqueEffectiveness",
    ];
    patchDecimalFields(
        obj,
        torqueFields,
        PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
    );
}
function patchTrainingLoad(obj) {
    const trainingLoadFields = ["training_stress_score", "trainingStressScore"];
    patchDecimalFields(
        obj,
        trainingLoadFields,
        PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT
    );
}

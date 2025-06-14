import { formatDistance } from "./formatDistance.js";
import { formatDuration } from "./formatDuration.js";

/**
 * Updates the fields of a summary object to ensure they are in a human-readable format.
 * Handles various metrics such as distance, time, speed, power, heart rate, and more.
 *
 * @param {Object} obj - The summary object containing various metrics to be patched.
 * @returns {void} This function has side effects as it modifies the input object directly.
 */
export function patchSummaryFields(obj) {
    patchDistance(obj);
    patchTime(obj);
    patchSpeed(obj);
    patchPower(obj);
    patchCalories(obj);
    patchHeartRate(obj);
    patchCadence(obj);
    patchRespirationRate(obj);
    patchTemperature(obj);
    patchGritFlow(obj);
    patchTrainingLoad(obj);
    patchStrokes(obj);
    patchFractionalCadence(obj);
    patchTorquePedal(obj);
    patchPCO(obj);
    patchArrays(obj);
    patchTimestamps(obj);
    patchDecimals(obj);
}

// --- Helper functions ---

/**
 * Formats the distance fields (`total_distance` and `totalDistance`) of the given object using the `formatDistance` function.
 * If the field is present and can be converted to a number, it is replaced with the formatted value.
 * Logs a warning if `total_distance` is invalid.
 *
 * @param {Object} obj - The object containing distance fields to patch.
 * @property {number|string} [obj.total_distance] - The total distance value to format (snake_case).
 * @property {number|string} [obj.totalDistance] - The total distance value to format (camelCase).
 */
function patchDistance(obj) {
    if (obj.total_distance != null) {
        const totalDistance = Number(obj.total_distance);
        if (totalDistance != null && !isNaN(totalDistance)) {
            obj.total_distance = formatDistance(totalDistance);
        } else {
            console.warn(`Invalid total_distance: ${obj.total_distance}`);
        }
    }
    if (obj.totalDistance != null) {
        const totalDistance = Number(obj.totalDistance);
        obj.totalDistance = formatDistance(totalDistance);
    }
}

/**
 * Formats various time-related fields of the given object using the formatDuration function.
 * The function checks for the presence of specific time fields (both snake_case and camelCase)
 * and updates their values in-place to formatted durations.
 *
 * @param {Object} obj - The object containing time fields to be patched.
 * @returns {void}
 */
function patchTime(obj) {
    if (obj.total_timer_time != null) obj.total_timer_time = formatDuration(Number(obj.total_timer_time));
    if (obj.totalTimerTime != null) obj.totalTimerTime = formatDuration(Number(obj.totalTimerTime));
    if (obj.total_elapsed_time != null) obj.total_elapsed_time = formatDuration(Number(obj.total_elapsed_time));
    if (obj.totalElapsedTime != null) obj.totalElapsedTime = formatDuration(Number(obj.totalElapsedTime));
    if (obj.duration != null) obj.duration = formatDuration(Number(obj.duration));
}

/**
 * Converts a speed value from meters per second to a formatted string showing both km/h and mph.
 *
 * @param {number|string} val - The speed value in meters per second.
 * @returns {string} The formatted speed string in the format "X.XX km/h / Y.YY mph".
 */
function formatSpeed(val) {
    return (Number(val) * 3.6).toFixed(2) + " km/h / " + (Number(val) * 2.23694).toFixed(2) + " mph";
}

/**
 * Formats various speed-related fields in the given object using the formatSpeed function.
 * The function checks for the presence of different speed property variants (e.g., avg_speed, avgSpeed, etc.)
 * and updates their values in-place if they are not null.
 *
 * @param {Object} obj - The object containing speed-related fields to be patched.
 */
function patchSpeed(obj) {
    if (obj.avg_speed != null) obj.avg_speed = formatSpeed(obj.avg_speed);
    if (obj.avgSpeed != null) obj.avgSpeed = formatSpeed(obj.avgSpeed);
    if (obj.max_speed != null) obj.max_speed = formatSpeed(obj.max_speed);
    if (obj.maxSpeed != null) obj.maxSpeed = formatSpeed(obj.maxSpeed);
    if (obj.enhanced_avg_speed != null) obj.enhanced_avg_speed = formatSpeed(obj.enhanced_avg_speed);
    if (obj.enhancedAvgSpeed != null) obj.enhancedAvgSpeed = formatSpeed(obj.enhancedAvgSpeed);
    if (obj.enhanced_max_speed != null) obj.enhanced_max_speed = formatSpeed(obj.enhanced_max_speed);
    if (obj.enhancedMaxSpeed != null) obj.enhancedMaxSpeed = formatSpeed(obj.enhancedMaxSpeed);
}

/**
 * Rounds various power-related fields in the given object to the nearest integer.
 *
 * This function checks for the presence of several power fields (both snake_case and camelCase)
 * such as avg_power, avgPower, max_power, maxPower, normalized_power, normalizedPower,
 * threshold_power, and thresholdPower. If any of these fields are present and not null,
 * their values are converted to numbers (if necessary) and rounded to the nearest integer.
 *
 * @param {Object} obj - The object containing power-related fields to patch.
 */
function patchPower(obj) {
    if (obj.avg_power != null) obj.avg_power = Math.round(Number(obj.avg_power));
    if (obj.avgPower != null) obj.avgPower = Math.round(Number(obj.avgPower));
    if (obj.max_power != null) obj.max_power = Math.round(Number(obj.max_power));
    if (obj.maxPower != null) obj.maxPower = Math.round(Number(obj.maxPower));
    if (obj.normalized_power != null) obj.normalized_power = Math.round(Number(obj.normalized_power));
    if (obj.normalizedPower != null) obj.normalizedPower = Math.round(Number(obj.normalizedPower));
    if (obj.threshold_power != null) obj.threshold_power = Math.round(Number(obj.threshold_power));
    if (obj.thresholdPower != null) obj.thresholdPower = Math.round(Number(obj.thresholdPower));
}

/**
 * Rounds the 'total_calories' and 'totalCalories' properties of the given object to the nearest integer,
 * if they are present and not null.
 *
 * @param {Object} obj - The object whose calorie fields will be patched.
 * @property {number|string} [obj.total_calories] - The total calories value to round (optional).
 * @property {number|string} [obj.totalCalories] - The totalCalories value to round (optional).
 */
function patchCalories(obj) {
    if (obj.total_calories != null) obj.total_calories = Math.round(Number(obj.total_calories));
    if (obj.totalCalories != null) obj.totalCalories = Math.round(Number(obj.totalCalories));
}

/**
 * Rounds the average and maximum heart rate fields of the given object to the nearest integer.
 * Handles both snake_case and camelCase field names.
 *
 * @param {Object} obj - The object containing heart rate fields to patch.
 * @property {number|string} [obj.avg_heart_rate] - The average heart rate (snake_case).
 * @property {number|string} [obj.avgHeartRate] - The average heart rate (camelCase).
 * @property {number|string} [obj.max_heart_rate] - The maximum heart rate (snake_case).
 * @property {number|string} [obj.maxHeartRate] - The maximum heart rate (camelCase).
 */
function patchHeartRate(obj) {
    if (obj.avg_heart_rate != null) obj.avg_heart_rate = Math.round(Number(obj.avg_heart_rate));
    if (obj.avgHeartRate != null) obj.avgHeartRate = Math.round(Number(obj.avgHeartRate));
    if (obj.max_heart_rate != null) obj.max_heart_rate = Math.round(Number(obj.max_heart_rate));
    if (obj.maxHeartRate != null) obj.maxHeartRate = Math.round(Number(obj.maxHeartRate));
}

/**
 * Rounds the cadence-related fields of the given object to the nearest integer.
 * Handles both snake_case and camelCase property names for average and maximum cadence.
 *
 * @param {Object} obj - The object containing cadence fields to patch.
 * @param {number|string} [obj.avg_cadence] - The average cadence (snake_case).
 * @param {number|string} [obj.avgCadence] - The average cadence (camelCase).
 * @param {number|string} [obj.max_cadence] - The maximum cadence (snake_case).
 * @param {number|string} [obj.maxCadence] - The maximum cadence (camelCase).
 */
function patchCadence(obj) {
    if (obj.avg_cadence != null) obj.avg_cadence = Math.round(Number(obj.avg_cadence));
    if (obj.avgCadence != null) obj.avgCadence = Math.round(Number(obj.avgCadence));
    if (obj.max_cadence != null) obj.max_cadence = Math.round(Number(obj.max_cadence));
    if (obj.maxCadence != null) obj.maxCadence = Math.round(Number(obj.maxCadence));
}

/**
 * Formats the respiration rate fields of the given object to one decimal place.
 *
 * This function checks for the presence of both snake_case and camelCase
 * variants of average, maximum, and minimum enhanced respiration rate fields.
 * If present, it converts their values to numbers and formats them to one decimal place.
 *
 * @param {Object} obj - The object containing respiration rate fields to patch.
 * @param {number|string} [obj.enhanced_avg_respiration_rate] - Average respiration rate (snake_case).
 * @param {number|string} [obj.enhancedAvgRespirationRate] - Average respiration rate (camelCase).
 * @param {number|string} [obj.enhanced_max_respiration_rate] - Maximum respiration rate (snake_case).
 * @param {number|string} [obj.enhancedMaxRespirationRate] - Maximum respiration rate (camelCase).
 * @param {number|string} [obj.enhanced_min_respiration_rate] - Minimum respiration rate (snake_case).
 * @param {number|string} [obj.enhancedMinRespirationRate] - Minimum respiration rate (camelCase).
 */
function patchRespirationRate(obj) {
    if (obj.enhanced_avg_respiration_rate != null) obj.enhanced_avg_respiration_rate = Number(obj.enhanced_avg_respiration_rate).toFixed(1);
    if (obj.enhancedAvgRespirationRate != null) obj.enhancedAvgRespirationRate = Number(obj.enhancedAvgRespirationRate).toFixed(1);
    if (obj.enhanced_max_respiration_rate != null) obj.enhanced_max_respiration_rate = Number(obj.enhanced_max_respiration_rate).toFixed(1);
    if (obj.enhancedMaxRespirationRate != null) obj.enhancedMaxRespirationRate = Number(obj.enhancedMaxRespirationRate).toFixed(1);
    if (obj.enhanced_min_respiration_rate != null) obj.enhanced_min_respiration_rate = Number(obj.enhanced_min_respiration_rate).toFixed(1);
    if (obj.enhancedMinRespirationRate != null) obj.enhancedMinRespirationRate = Number(obj.enhancedMinRespirationRate).toFixed(1);
}

/**
 * Formats the temperature-related fields of the given object to one decimal place.
 * Handles both snake_case and camelCase field names for average, maximum, and minimum temperatures.
 *
 * @param {Object} obj - The object whose temperature fields will be patched.
 * @property {number|string} [obj.avg_temperature] - The average temperature (snake_case).
 * @property {number|string} [obj.avgTemperature] - The average temperature (camelCase).
 * @property {number|string} [obj.max_temperature] - The maximum temperature (snake_case).
 * @property {number|string} [obj.maxTemperature] - The maximum temperature (camelCase).
 * @property {number|string} [obj.min_temperature] - The minimum temperature (snake_case).
 * @property {number|string} [obj.minTemperature] - The minimum temperature (camelCase).
 */
function patchTemperature(obj) {
    if (obj.avg_temperature != null) obj.avg_temperature = Number(obj.avg_temperature).toFixed(1);
    if (obj.avgTemperature != null) obj.avgTemperature = Number(obj.avgTemperature).toFixed(1);
    if (obj.max_temperature != null) obj.max_temperature = Number(obj.max_temperature).toFixed(1);
    if (obj.maxTemperature != null) obj.maxTemperature = Number(obj.maxTemperature).toFixed(1);
    if (obj.min_temperature != null) obj.min_temperature = Number(obj.min_temperature).toFixed(1);
    if (obj.minTemperature != null) obj.minTemperature = Number(obj.minTemperature).toFixed(1);
}

/**
 * Formats the grit and flow properties of the given object to two decimal places.
 *
 * Modifies the following properties if they exist:
 * - total_grit
 * - totalGrit
 * - avg_flow
 * - avgFlow
 *
 * @param {Object} obj - The object containing grit and flow properties to format.
 */
function patchGritFlow(obj) {
    if (obj.total_grit != null) obj.total_grit = Number(obj.total_grit).toFixed(2);
    if (obj.totalGrit != null) obj.totalGrit = Number(obj.totalGrit).toFixed(2);
    if (obj.avg_flow != null) obj.avg_flow = Number(obj.avg_flow).toFixed(2);
    if (obj.avgFlow != null) obj.avgFlow = Number(obj.avgFlow).toFixed(2);
}

/**
 * Normalizes and formats various training load-related fields in the given object.
 *
 * For each supported field (in both snake_case and camelCase), this function:
 * - Rounds `training_load_peak`/`trainingLoadPeak` to the nearest integer.
 * - Formats `training_stress_score`/`trainingStressScore` and `total_training_effect`/`totalTrainingEffect`
 *   and `total_anaerobic_training_effect`/`totalAnaerobicTrainingEffect` to one decimal place.
 * - Formats `intensity_factor`/`intensityFactor` to three decimal places.
 *
 * Fields are only modified if they exist and are not null.
 *
 * @param {Object} obj - The object containing training load summary fields to patch.
 */
function patchTrainingLoad(obj) {
    if (obj.training_load_peak != null) obj.training_load_peak = Math.round(Number(obj.training_load_peak));
    if (obj.trainingLoadPeak != null) obj.trainingLoadPeak = Math.round(Number(obj.trainingLoadPeak));
    if (obj.training_stress_score != null) obj.training_stress_score = Number(obj.training_stress_score).toFixed(1);
    if (obj.trainingStressScore != null) obj.trainingStressScore = Number(obj.trainingStressScore).toFixed(1);
    if (obj.intensity_factor != null) obj.intensity_factor = Number(obj.intensity_factor).toFixed(3);
    if (obj.intensityFactor != null) obj.intensityFactor = Number(obj.intensityFactor).toFixed(3);
    if (obj.total_training_effect != null) obj.total_training_effect = Number(obj.total_training_effect).toFixed(1);
    if (obj.totalTrainingEffect != null) obj.totalTrainingEffect = Number(obj.totalTrainingEffect).toFixed(1);
    if (obj.total_anaerobic_training_effect != null) obj.total_anaerobic_training_effect = Number(obj.total_anaerobic_training_effect).toFixed(1);
    if (obj.totalAnaerobicTrainingEffect != null) obj.totalAnaerobicTrainingEffect = Number(obj.totalAnaerobicTrainingEffect).toFixed(1);
}

/**
 * Rounds the `total_strokes` and `totalStrokes` properties of the given object to the nearest integer,
 * if they are not null or undefined. Modifies the object in place.
 *
 * @param {Object} obj - The object whose stroke count properties will be patched.
 * @property {number|string} [obj.total_strokes] - The total strokes value to round (optional).
 * @property {number|string} [obj.totalStrokes] - The totalStrokes value to round (optional).
 */
function patchStrokes(obj) {
    if (obj.total_strokes != null) obj.total_strokes = Math.round(Number(obj.total_strokes));
    if (obj.totalStrokes != null) obj.totalStrokes = Math.round(Number(obj.totalStrokes));
}

/**
 * Formats the fractional cadence fields of the given object to two decimal places.
 *
 * This function checks for the presence of the following properties on the object:
 * - avg_fractional_cadence
 * - avgFractionalCadence
 * - max_fractional_cadence
 * - maxFractionalCadence
 *
 * If any of these properties are not null, their values are converted to a number
 * and formatted as a string with two decimal places.
 *
 * @param {Object} obj - The object containing fractional cadence fields to patch.
 */
function patchFractionalCadence(obj) {
    if (obj.avg_fractional_cadence != null) obj.avg_fractional_cadence = Number(obj.avg_fractional_cadence).toFixed(2);
    if (obj.avgFractionalCadence != null) obj.avgFractionalCadence = Number(obj.avgFractionalCadence).toFixed(2);
    if (obj.max_fractional_cadence != null) obj.max_fractional_cadence = Number(obj.max_fractional_cadence).toFixed(2);
    if (obj.maxFractionalCadence != null) obj.maxFractionalCadence = Number(obj.maxFractionalCadence).toFixed(2);
}

/**
 * Formats specific torque effectiveness and pedal smoothness fields of the given object
 * to one decimal place if they are not null. Handles both snake_case and camelCase field names.
 *
 * @param {Object} obj - The object whose torque and pedal fields will be patched.
 * @property {number|string|null} [obj.avg_left_torque_effectiveness] - Average left torque effectiveness.
 * @property {number|string|null} [obj.avgLeftTorqueEffectiveness] - Average left torque effectiveness (camelCase).
 * @property {number|string|null} [obj.avg_right_torque_effectiveness] - Average right torque effectiveness.
 * @property {number|string|null} [obj.avgRightTorqueEffectiveness] - Average right torque effectiveness (camelCase).
 * @property {number|string|null} [obj.avg_left_pedal_smoothness] - Average left pedal smoothness.
 * @property {number|string|null} [obj.avgLeftPedalSmoothness] - Average left pedal smoothness (camelCase).
 * @property {number|string|null} [obj.avg_right_pedal_smoothness] - Average right pedal smoothness.
 * @property {number|string|null} [obj.avgRightPedalSmoothness] - Average right pedal smoothness (camelCase).
 */
function patchTorquePedal(obj) {
    if (obj.avg_left_torque_effectiveness != null) obj.avg_left_torque_effectiveness = Number(obj.avg_left_torque_effectiveness).toFixed(1);
    if (obj.avgLeftTorqueEffectiveness != null) obj.avgLeftTorqueEffectiveness = Number(obj.avgLeftTorqueEffectiveness).toFixed(1);
    if (obj.avg_right_torque_effectiveness != null) obj.avg_right_torque_effectiveness = Number(obj.avg_right_torque_effectiveness).toFixed(1);
    if (obj.avgRightTorqueEffectiveness != null) obj.avgRightTorqueEffectiveness = Number(obj.avgRightTorqueEffectiveness).toFixed(1);
    if (obj.avg_left_pedal_smoothness != null) obj.avg_left_pedal_smoothness = Number(obj.avg_left_pedal_smoothness).toFixed(1);
    if (obj.avgLeftPedalSmoothness != null) obj.avgLeftPedalSmoothness = Number(obj.avgLeftPedalSmoothness).toFixed(1);
    if (obj.avg_right_pedal_smoothness != null) obj.avg_right_pedal_smoothness = Number(obj.avg_right_pedal_smoothness).toFixed(1);
    if (obj.avgRightPedalSmoothness != null) obj.avgRightPedalSmoothness = Number(obj.avgRightPedalSmoothness).toFixed(1);
}

/**
 * Rounds the average left and right PCO (Platform Center Offset) values in the given object.
 *
 * This function checks for both snake_case and camelCase property names:
 * - avg_left_pco / avgLeftPco
 * - avg_right_pco / avgRightPco
 *
 * If any of these properties exist and are not null, their values are converted to numbers and rounded to the nearest integer.
 *
 * @param {Object} obj - The object containing PCO fields to patch.
 */
function patchPCO(obj) {
    if (obj.avg_left_pco != null) obj.avg_left_pco = Math.round(Number(obj.avg_left_pco));
    if (obj.avgLeftPco != null) obj.avgLeftPco = Math.round(Number(obj.avgLeftPco));
    if (obj.avg_right_pco != null) obj.avg_right_pco = Math.round(Number(obj.avg_right_pco));
    if (obj.avgRightPco != null) obj.avgRightPco = Math.round(Number(obj.avgRightPco));
}

/**
 * Formats an array or a comma-separated string of numbers to a string with each number
 * rounded to a specified number of decimal digits.
 *
 * @param {number[] | string} val - The value to format. Can be an array of numbers or a comma-separated string of numbers.
 * @param {number} [digits=2] - The number of decimal digits to round each number to.
 * @returns {string | any} A string of numbers rounded to the specified digits and joined by commas,
 *                         or the original value if it is not an array or a comma-separated string.
 */
function formatArray(val, digits = 2) {
    if (Array.isArray(val)) return val.map((v) => Number(v).toFixed(digits)).join(", ");
    if (typeof val === "string" && val.includes(","))
        return val
            .split(",")
            .map((v) => Number(v).toFixed(digits))
            .join(", ");
    return val;
}
/**
 * Formats specific array properties of the given object to a fixed number of decimal places.
 * The function checks for the presence of certain properties (both snake_case and camelCase variants)
 * related to power phase and power phase peak, and formats their array values using `formatArray`.
 *
 * @param {Object} obj - The object whose array properties will be formatted.
 * @returns {void}
 */
function patchArrays(obj) {
    if (obj.avg_left_power_phase != null) obj.avg_left_power_phase = formatArray(obj.avg_left_power_phase, 2);
    if (obj.avgLeftPowerPhase != null) obj.avgLeftPowerPhase = formatArray(obj.avgLeftPowerPhase, 2);
    if (obj.avg_left_power_phase_peak != null) obj.avg_left_power_phase_peak = formatArray(obj.avg_left_power_phase_peak, 2);
    if (obj.avgLeftPowerPhasePeak != null) obj.avgLeftPowerPhasePeak = formatArray(obj.avgLeftPowerPhasePeak, 2);
    if (obj.avg_right_power_phase != null) obj.avg_right_power_phase = formatArray(obj.avg_right_power_phase, 2);
    if (obj.avgRightPowerPhase != null) obj.avgRightPowerPhase = formatArray(obj.avgRightPowerPhase, 2);
    if (obj.avg_right_power_phase_peak != null) obj.avg_right_power_phase_peak = formatArray(obj.avg_right_power_phase_peak, 2);
    if (obj.avgRightPowerPhasePeak != null) obj.avgRightPowerPhasePeak = formatArray(obj.avgRightPowerPhasePeak, 2);
}

/**
 * Converts Unix timestamp fields in the given object to human-readable date strings.
 *
 * This function checks for the presence of the following fields in the object:
 * - `timestamp`
 * - `start_time`
 * - `startTime`
 *
 * If any of these fields exist and are numbers (assumed to be Unix timestamps in seconds),
 * they are converted to JavaScript `Date` strings.
 *
 * @param {Object} obj - The object whose timestamp fields will be patched.
 */
function patchTimestamps(obj) {
    if (obj.timestamp != null && typeof obj.timestamp === "number") obj.timestamp = new Date(obj.timestamp * 1000).toString();
    if (obj.start_time != null && typeof obj.start_time === "number") obj.start_time = new Date(obj.start_time * 1000).toString();
    if (obj.startTime != null && typeof obj.startTime === "number") obj.startTime = new Date(obj.startTime * 1000).toString();
}

/**
 * Modifies the given object's properties by rounding all non-integer number values to two decimal places.
 * The affected properties are converted to strings with exactly two decimal digits.
 *
 * @param {Object} obj - The object whose numeric properties will be patched.
 */
function patchDecimals(obj) {
    Object.keys(obj)
        .filter((key) => typeof obj[key] === "number" && !Number.isInteger(obj[key]))
        .forEach((key) => {
            obj[key] = Number(obj[key]).toFixed(2);
        });
}

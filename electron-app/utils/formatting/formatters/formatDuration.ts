type DurationInput = number | string | null | undefined;

type DurationValidationResult =
    | {
          isValid: true;
          value: number;
      }
    | {
          error: string;
          isValid: false;
          value: 0;
      };

const TIME_CONVERSION_FACTORS = {
    SECONDS_PER_HOUR: 3600,
    SECONDS_PER_MINUTE: 60,
} as const;

const THRESHOLDS = {
    MINUTES_ONLY: TIME_CONVERSION_FACTORS.SECONDS_PER_HOUR,
    SECONDS_ONLY: TIME_CONVERSION_FACTORS.SECONDS_PER_MINUTE,
};

/**
 * Formats a duration given in seconds into a human-readable string.
 *
 * Null/undefined inputs return an empty string. Invalid inputs throw a
 * descriptive error, matching the legacy formatter behavior.
 *
 * @example FormatDuration(30); // "30 sec" formatDuration(90); // "1 min 30
 * sec" formatDuration(3661); // "1 hr 1 min"
 *
 * @param seconds - The duration in seconds.
 *
 * @returns The formatted duration string.
 *
 * @throws Error If the input is not a finite number or is negative.
 */
export function formatDuration(seconds: DurationInput): string {
    const validation = validateAndNormalizeDuration(seconds);

    if (!validation.isValid) {
        throw new Error(`Invalid duration input: ${validation.error}`);
    }

    if (seconds === null || seconds === undefined) {
        return "";
    }

    const normalizedSeconds = validation.value;

    if (normalizedSeconds < THRESHOLDS.SECONDS_ONLY) {
        return formatSecondsOnly(normalizedSeconds);
    }

    if (normalizedSeconds < THRESHOLDS.MINUTES_ONLY) {
        return formatMinutesAndSeconds(normalizedSeconds);
    }

    return formatHoursAndMinutes(normalizedSeconds);
}

function formatHoursAndMinutes(seconds: number): string {
    const hours = Math.floor(
        seconds / TIME_CONVERSION_FACTORS.SECONDS_PER_HOUR
    );
    const remainingSeconds = seconds % TIME_CONVERSION_FACTORS.SECONDS_PER_HOUR;
    const minutes = Math.floor(
        remainingSeconds / TIME_CONVERSION_FACTORS.SECONDS_PER_MINUTE
    );

    const hourText = hours === 1 ? "hr" : "hrs";
    return `${hours} ${hourText} ${minutes} min`;
}

function formatMinutesAndSeconds(seconds: number): string {
    const minutes = Math.floor(
        seconds / TIME_CONVERSION_FACTORS.SECONDS_PER_MINUTE
    );
    const remainingSeconds =
        seconds % TIME_CONVERSION_FACTORS.SECONDS_PER_MINUTE;
    return `${minutes} min ${remainingSeconds} sec`;
}

function formatSecondsOnly(seconds: number): string {
    return `${seconds} sec`;
}

function validateAndNormalizeDuration(
    seconds: DurationInput | unknown
): DurationValidationResult {
    if (seconds === null || seconds === undefined) {
        return { isValid: true, value: 0 };
    }

    let normalizedSeconds = seconds;

    if (typeof normalizedSeconds === "string") {
        const trimmed = normalizedSeconds.trim();
        if (trimmed === "") {
            return { error: "Empty string input", isValid: false, value: 0 };
        }
        normalizedSeconds = Number(trimmed);
    }

    if (
        typeof normalizedSeconds === "number" &&
        !Number.isInteger(normalizedSeconds)
    ) {
        normalizedSeconds = Math.round(normalizedSeconds);
    }

    if (
        typeof normalizedSeconds !== "number" ||
        !Number.isFinite(normalizedSeconds)
    ) {
        return {
            error: "Input must be a finite number",
            isValid: false,
            value: 0,
        };
    }

    if (normalizedSeconds < 0) {
        return {
            error: "Duration cannot be negative",
            isValid: false,
            value: 0,
        };
    }

    return { isValid: true, value: normalizedSeconds };
}

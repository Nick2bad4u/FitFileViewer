type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;

type UnknownCallback = (...args: unknown[]) => unknown;

interface PreloadValidators {
    validateCallback: (
        callback: unknown,
        methodName: string
    ) => callback is UnknownCallback;
    validateChannelName: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is string;
    validateOptionalNonEmptyString: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is null | string | undefined;
    validateRequiredNonEmptyString: (
        value: unknown,
        paramName: string,
        methodName: string
    ) => value is string;
}

export function createPreloadValidators(
    preloadLog: PreloadLog
): PreloadValidators {
    function validateCallback(
        callback: unknown,
        methodName: string
    ): callback is UnknownCallback {
        if (typeof callback !== "function") {
            preloadLog(
                "error",
                `[preload.js] ${methodName}: callback must be a function`
            );
            return false;
        }
        return true;
    }

    function validateChannelName(
        value: unknown,
        paramName: string,
        methodName: string
    ): value is string {
        if (typeof value !== "string") {
            preloadLog(
                "error",
                `[preload.js] ${methodName}: ${paramName} must be a string`
            );
            return false;
        }
        if (value.trim().length === 0) {
            preloadLog(
                "error",
                `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
            );
            return false;
        }
        return true;
    }

    function validateOptionalNonEmptyString(
        value: unknown,
        paramName: string,
        methodName: string
    ): value is null | string | undefined {
        if (value === undefined || value === null) {
            return true;
        }
        if (typeof value !== "string") {
            preloadLog(
                "error",
                `[preload.js] ${methodName}: ${paramName} must be a string or null`
            );
            return false;
        }
        if (value.trim().length === 0) {
            preloadLog(
                "error",
                `[preload.js] ${methodName}: ${paramName} must be a non-empty string or null`
            );
            return false;
        }
        return true;
    }

    function validateRequiredNonEmptyString(
        value: unknown,
        paramName: string,
        methodName: string
    ): value is string {
        if (typeof value !== "string") {
            preloadLog(
                "error",
                `[preload.js] ${methodName}: ${paramName} must be a string`
            );
            return false;
        }
        if (value.trim().length === 0) {
            preloadLog(
                "error",
                `[preload.js] ${methodName}: ${paramName} must be a non-empty string`
            );
            return false;
        }
        return true;
    }

    return {
        validateCallback,
        validateChannelName,
        validateOptionalNonEmptyString,
        validateRequiredNonEmptyString,
    };
}

/**
 * Provides consistent error handling patterns across the FitFileViewer
 * application.
 */
/**
 * Stable error code strings used across application error boundaries.
 */
export const ERROR_CODES = {
    FILE_NOT_FOUND: "FILE_NOT_FOUND",
    INVALID_INPUT: "INVALID_INPUT",
    NETWORK_ERROR: "NETWORK_ERROR",
    PARSE_ERROR: "PARSE_ERROR",
    PERMISSION_DENIED: "PERMISSION_DENIED",
    STATE_ERROR: "STATE_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
};
const globalRef = globalThis;
let globalErrorListenerAbortController;
function getUnknownErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function isValidationObject(value) {
    return typeof value === "object" && value !== null && "isValid" in value;
}
function isPromiseLike(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        "then" in value &&
        typeof Reflect.get(value, "then") === "function"
    );
}
/**
 * Enhanced Error class with additional context.
 */
export class AppError extends Error {
    context;
    timestamp;
    constructor(message, context = {}) {
        super(message);
        this.name = "AppError";
        this.context = context;
        this.timestamp = Date.now();
    }
    getFormattedMessage() {
        const parts = [this.message];
        if (this.context.operation !== undefined) {
            parts.push(`Operation: ${this.context.operation}`);
        }
        if (this.context.component !== undefined) {
            parts.push(`Component: ${this.context.component}`);
        }
        if (this.context.path !== undefined) {
            parts.push(`Path: ${this.context.path}`);
        }
        return parts.join(" | ");
    }
    toJSON() {
        return {
            context: this.context,
            message: this.message,
            name: this.name,
            stack: this.stack,
            timestamp: this.timestamp,
        };
    }
}
/**
 * Validation Error class for input validation failures.
 */
export class ValidationError extends AppError {
    errors;
    warnings;
    constructor(message, details) {
        super(message, {
            code: ERROR_CODES.VALIDATION_ERROR,
            operation: "validation",
        });
        this.name = "ValidationError";
        this.errors = details.errors ?? [];
        this.warnings = details.warnings ?? [];
    }
}
/**
 * Create a standardized error handler for strict or fail-safe execution paths.
 */
export function createErrorHandler(options = {}) {
    const config = {
        failSafe: false,
        fallback: null,
        logError: true,
        logLevel: "error",
        notificationType: "error",
        notify: false,
        ...options,
    };
    return function handleError(error, context = {}) {
        const err =
            error instanceof Error
                ? error
                : new AppError(getUnknownErrorMessage(error), context);
        if (!(err instanceof AppError) && Object.keys(context).length > 0) {
            Object.assign(err, { context });
        }
        if (config.logError) {
            const message =
                err instanceof AppError
                    ? err.getFormattedMessage()
                    : err.message;
            console[config.logLevel](`[ErrorHandler] ${message}`, err);
        }
        if (config.notify && typeof globalRef.showNotification === "function") {
            try {
                globalRef.showNotification(
                    err.message,
                    config.notificationType
                );
            } catch (notificationError) {
                console.warn(
                    "[ErrorHandler] Failed to show notification:",
                    notificationError
                );
            }
        }
        if (config.failSafe) {
            return config.fallback;
        }
        throw err;
    };
}
/**
 * Validate a value with one or more validators and collect all diagnostics.
 */
export function validateInput(value, validatorsToRun, fieldName = "input") {
    const result = {
        errors: [],
        isValid: true,
        validatedValue: value,
        warnings: [],
    };
    for (const validator of validatorsToRun) {
        try {
            const validationResult = validator(value, fieldName);
            if (typeof validationResult === "boolean") {
                if (!validationResult) {
                    result.isValid = false;
                    result.errors.push(`Invalid ${fieldName}`);
                }
            } else if (isValidationObject(validationResult)) {
                if (!validationResult.isValid) {
                    result.isValid = false;
                }
                result.errors.push(...(validationResult.errors ?? []));
                result.warnings.push(...(validationResult.warnings ?? []));
                if (validationResult.validatedValue !== undefined) {
                    result.validatedValue = validationResult.validatedValue;
                } else if (validationResult.value !== undefined) {
                    result.validatedValue = validationResult.value;
                }
            }
        } catch (error) {
            result.isValid = false;
            result.errors.push(
                `Validation error for ${fieldName}: ${getUnknownErrorMessage(error)}`
            );
        }
    }
    return result;
}
/**
 * Wrap a sync or async function with standardized error handling.
 */
export function withErrorHandling(fn, options = {}) {
    const handleError = createErrorHandler(options);
    const functionName = fn.name || "anonymous";
    return function wrappedFunction(...args) {
        try {
            const result = fn(...args);
            if (isPromiseLike(result)) {
                return Promise.resolve(result).catch((error) =>
                    handleError(error, {
                        input: args,
                        operation: functionName,
                    })
                );
            }
            return result;
        } catch (error) {
            return handleError(error, {
                input: args,
                operation: functionName,
            });
        }
    };
}
/**
 * Common validators for typical input types.
 */
export const validators = {
    isFiniteNumber(value, fieldName) {
        const isNumber = typeof value === "number";
        const isValid = isNumber && Number.isFinite(value);
        return {
            errors: isNumber
                ? Number.isFinite(value)
                    ? []
                    : [`${fieldName} must be a finite number`]
                : [`${fieldName} must be a number`],
            isValid,
            value: isNumber ? value : Number(value),
        };
    },
    isNonEmptyString(value, fieldName) {
        const isString = typeof value === "string";
        const trimmedValue = isString ? value.trim() : String(value).trim();
        return {
            errors: isString
                ? trimmedValue.length > 0
                    ? []
                    : [`${fieldName} cannot be empty`]
                : [`${fieldName} must be a string`],
            isValid: isString && trimmedValue.length > 0,
            value: trimmedValue,
        };
    },
    isPositiveNumber(value, fieldName) {
        const isNumber = typeof value === "number";
        const isFiniteNumber = isNumber && Number.isFinite(value);
        const isValid = isFiniteNumber && value > 0;
        return {
            errors: isNumber
                ? isFiniteNumber
                    ? value > 0
                        ? []
                        : [`${fieldName} must be positive`]
                    : [`${fieldName} must be a finite number`]
                : [`${fieldName} must be a number`],
            isValid,
            value: isNumber ? value : Number(value),
        };
    },
    isRequired(value, fieldName) {
        return {
            errors:
                value === null || value === undefined
                    ? [`${fieldName} is required`]
                    : [],
            isValid: value !== null && value !== undefined,
            value,
        };
    },
};
/**
 * Initialize browser-level global error logging hooks.
 */
export function initializeErrorHandling(_options = {}) {
    if (typeof globalRef.addEventListener === "function") {
        globalErrorListenerAbortController?.abort();
        globalErrorListenerAbortController = new AbortController();
        const listenerOptions = {
            signal: globalErrorListenerAbortController.signal,
        };
        globalRef.addEventListener(
            "error",
            (event) => {
                logError(event.error ?? new Error(event.message), {
                    operation: "global-error-handler",
                    path: `${event.filename}:${event.lineno}:${event.colno}`,
                });
            },
            listenerOptions
        );
        globalRef.addEventListener(
            "unhandledrejection",
            (event) => {
                logError(
                    event.reason instanceof Error
                        ? event.reason
                        : new Error(String(event.reason)),
                    {
                        operation: "unhandled-rejection",
                    }
                );
            },
            listenerOptions
        );
    }
    console.log("[ErrorHandling] Error handling system initialized");
}
/**
 * Log an error with structured context and optional performance telemetry.
 */
export function logError(error, context = {}, level = "error") {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        context,
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp,
    };
    console[level](`[${timestamp}] Error:`, errorInfo);
    if (globalRef.performanceMonitor?.recordError !== undefined) {
        try {
            globalRef.performanceMonitor.recordError(
                error,
                context.operation ?? "unknown"
            );
        } catch {
            // Ignore secondary telemetry failures.
        }
    }
}
/**
 * Create a fail-safe function wrapper that returns a caller-provided fallback.
 */
export function makeResilient(fn, fallback, options = {}) {
    return withErrorHandling(fn, {
        failSafe: true,
        fallback,
        logError: true,
        logLevel: "warn",
        ...options,
    });
}
/**
 * Create a fail-safe function wrapper that returns null when the function
 * fails.
 */
export function makeSafe(fn, options = {}) {
    const { logErrors = true } = options;
    return withErrorHandling(fn, {
        failSafe: true,
        fallback: null,
        logError: logErrors,
        logLevel: "warn",
    });
}

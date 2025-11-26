/**
 * @fileoverview Unified Error Handling Utilities
 * @description Provides consistent error handling patterns across the FitFileViewer application
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} ErrorContext
 * @property {string} [operation] - Operation that failed
 * @property {string} [component] - Component where error occurred
 * @property {*} [input] - Input that caused the error
 * @property {string} [path] - File path or state path related to error
 * @property {number} [code] - Error code
 */

/**
 * @typedef {Object} ErrorHandlingOptions
 * @property {boolean} [failSafe=false] - Whether to fail safely (return fallback) or throw
 * @property {*} [fallback=null] - Fallback value for fail-safe mode
 * @property {boolean} [logError=true] - Whether to log the error
 * @property {string} [logLevel="error"] - Log level (debug, info, warn, error)
 * @property {boolean} [notify=false] - Whether to show user notification
 * @property {string} [notificationType="error"] - Notification type (error, warning, info)
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 * @property {string[]} warnings - Array of warning messages
 * @property {*} [validatedValue] - Validated/normalized value if applicable
 */

/**
 * Standard error codes for the application
 */
export const ERROR_CODES = {
    INVALID_INPUT: "INVALID_INPUT",
    FILE_NOT_FOUND: "FILE_NOT_FOUND",
    PARSE_ERROR: "PARSE_ERROR",
    NETWORK_ERROR: "NETWORK_ERROR",
    PERMISSION_DENIED: "PERMISSION_DENIED",
    STATE_ERROR: "STATE_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * Enhanced Error class with additional context
 */
export class AppError extends Error {
    /**
     * Create an application error
     * @param {string} message - Error message
     * @param {ErrorContext} [context={}] - Additional error context
     */
    constructor(message, context = {}) {
        super(message);
        this.name = "AppError";
        this.context = context;
        this.timestamp = Date.now();
    }

    /**
     * Get a formatted error message with context
     * @returns {string} Formatted error message
     */
    getFormattedMessage() {
        const parts = [this.message];

        if (this.context.operation) {
            parts.push(`Operation: ${this.context.operation}`);
        }

        if (this.context.component) {
            parts.push(`Component: ${this.context.component}`);
        }

        if (this.context.path) {
            parts.push(`Path: ${this.context.path}`);
        }

        return parts.join(" | ");
    }

    /**
     * Convert error to JSON for logging/serialization
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack,
        };
    }
}

/**
 * Validation Error class for input validation failures
 */
export class ValidationError extends AppError {
    /**
     * Create a validation error
     * @param {string} message - Error message
     * @param {Object} details - Validation details
     * @param {string[]} details.errors - Validation errors
     * @param {string[]} [details.warnings=[]] - Validation warnings
     */
    constructor(message, details) {
        super(message, {
            operation: "validation",
            code: ERROR_CODES.VALIDATION_ERROR,
        });
        this.name = "ValidationError";
        this.errors = details.errors || [];
        this.warnings = details.warnings || [];
    }
}

/**
 * Create a standardized error handler function
 * @param {ErrorHandlingOptions} [options={}] - Error handling options
 * @returns {Function} Error handler function
 */
export function createErrorHandler(options = {}) {
    const defaultOptions = {
        failSafe: false,
        fallback: null,
        logError: true,
        logLevel: "error",
        notify: false,
        notificationType: "error",
    };

    const config = { ...defaultOptions, ...options };

    return function handleError(error, context = {}) {
        // Ensure we have an Error object
        const err = error instanceof Error ? error : new AppError(String(error), context);

        // Add context if it's not already an AppError
        if (!(err instanceof AppError) && Object.keys(context).length > 0) {
            Object.assign(err, { context });
        }

        // Log error if enabled
        if (config.logError) {
            const message = err instanceof AppError ? err.getFormattedMessage() : err.message;
            console[config.logLevel](`[ErrorHandler] ${message}`, err);
        }

        // Show notification if enabled
        if (config.notify && typeof globalThis.showNotification === "function") {
            try {
                globalThis.showNotification(err.message, config.notificationType);
            } catch (notificationError) {
                console.warn("[ErrorHandler] Failed to show notification:", notificationError);
            }
        }

        // Return fallback or throw based on mode
        if (config.failSafe) {
            return config.fallback;
        }

        throw err;
    };
}

/**
 * Validate input with consistent error handling
 * @param {*} value - Value to validate
 * @param {Function[]} validators - Array of validation functions
 * @param {string} [fieldName="input"] - Name of field being validated
 * @returns {ValidationResult} Validation result
 */
export function validateInput(value, validators, fieldName = "input") {
    const result = {
        isValid: true,
        errors: [],
        warnings: [],
        validatedValue: value,
    };

    for (const validator of validators) {
        try {
            const validationResult = validator(value, fieldName);

            if (typeof validationResult === "boolean") {
                if (!validationResult) {
                    result.isValid = false;
                    result.errors.push(`Invalid ${fieldName}`);
                }
            } else if (typeof validationResult === "object") {
                if (!validationResult.isValid) {
                    result.isValid = false;
                }
                if (validationResult.errors) {
                    result.errors.push(...validationResult.errors);
                }
                if (validationResult.warnings) {
                    result.warnings.push(...validationResult.warnings);
                }
                if (validationResult.value !== undefined) {
                    result.validatedValue = validationResult.value;
                }
            }
        } catch (error) {
            result.isValid = false;
            result.errors.push(`Validation error for ${fieldName}: ${error.message}`);
        }
    }

    return result;
}

/**
 * Wrap a function with error handling
 * @param {Function} fn - Function to wrap
 * @param {ErrorHandlingOptions} [options={}] - Error handling options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
    const handleError = createErrorHandler(options);
    const functionName = fn.name || "anonymous";

    return function wrappedFunction(...args) {
        try {
            const result = fn(...args);

            // Handle async functions
            if (result && typeof result.then === "function") {
                return result.catch((error) =>
                    handleError(error, {
                        operation: functionName,
                        input: args,
                    })
                );
            }

            return result;
        } catch (error) {
            return handleError(error, {
                operation: functionName,
                input: args,
            });
        }
    };
}

/**
 * Common validators for typical input types
 */
export const validators = {
    /**
     * Validate that value is a finite number
     * @param {*} value - Value to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {ValidationResult} Validation result
     */
    isFiniteNumber: (value, fieldName) => ({
        isValid: typeof value === "number" && Number.isFinite(value),
        errors:
            typeof value === "number"
                ? Number.isFinite(value)
                    ? []
                    : [`${fieldName} must be a finite number`]
                : [`${fieldName} must be a number`],
        value: typeof value === "number" ? value : Number(value),
    }),

    /**
     * Validate that value is a positive number
     * @param {*} value - Value to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {ValidationResult} Validation result
     */
    isPositiveNumber: (value, fieldName) => ({
        isValid: typeof value === "number" && Number.isFinite(value) && value > 0,
        errors:
            typeof value === "number"
                ? Number.isFinite(value)
                    ? value > 0
                        ? []
                        : [`${fieldName} must be positive`]
                    : [`${fieldName} must be a finite number`]
                : [`${fieldName} must be a number`],
        value,
    }),

    /**
     * Validate that value is a non-empty string
     * @param {*} value - Value to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {ValidationResult} Validation result
     */
    isNonEmptyString: (value, fieldName) => ({
        isValid: typeof value === "string" && value.trim().length > 0,
        errors:
            typeof value === "string"
                ? value.trim().length > 0
                    ? []
                    : [`${fieldName} cannot be empty`]
                : [`${fieldName} must be a string`],
        value: typeof value === "string" ? value.trim() : String(value).trim(),
    }),

    /**
     * Validate that value is not null or undefined
     * @param {*} value - Value to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {ValidationResult} Validation result
     */
    isRequired: (value, fieldName) => ({
        isValid: value !== null && value !== undefined,
        errors: value === null || value === undefined ? [`${fieldName} is required`] : [],
        value,
    }),
};

/**
 * Initialize error handling system.
 * Currently accepts an options object for future extensibility.
 *
 * @param {Object} [_options={}] - Initialization options (reserved for future use)
 */
export function initializeErrorHandling(_options = {}) {
    // Set up global error handlers
    if (typeof globalThis.addEventListener === "function") {
        globalThis.addEventListener("error", (event) => {
            logError(event.error || new Error(event.message), {
                operation: "global-error-handler",
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
        });

        globalThis.addEventListener("unhandledrejection", (event) => {
            logError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
                operation: "unhandled-rejection",
            });
        });
    }

    console.log("[ErrorHandling] Error handling system initialized");
}

/**
 * Standardized error logging with consistent format
 * @param {Error} error - Error to log
 * @param {ErrorContext} [context={}] - Additional context
 * @param {string} [level="error"] - Log level
 */
export function logError(error, context = {}, level = "error") {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        message: error.message,
        name: error.name,
        stack: error.stack,
        context,
    };

    console[level](`[${timestamp}] Error:`, errorInfo);

    // Also log to performance monitor if available
    if (globalThis.performanceMonitor !== undefined && globalThis.performanceMonitor.recordError) {
        try {
            globalThis.performanceMonitor.recordError(error, context.operation || "unknown");
        } catch {
            // Ignore performance monitor errors
        }
    }
}

/**
 * Create a resilient version of a function that continues on error with fallback
 * @param {Function} fn - Function to make resilient
 * @param {*} fallback - Fallback value
 * @param {Object} [options={}] - Options
 * @returns {Function} Resilient function
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
 * Create a safe version of a function that returns null on error instead of throwing
 * @param {Function} fn - Function to make safe
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.logErrors=true] - Whether to log errors
 * @returns {Function} Safe function
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

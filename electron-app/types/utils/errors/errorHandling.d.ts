/**
 * Create a standardized error handler function
 *
 * @param {ErrorHandlingOptions} [options={}] - Error handling options. Default
 *   is `{}`
 *
 * @returns {Function} Error handler function
 */
export function createErrorHandler(options?: ErrorHandlingOptions): Function;
/**
 * Validate input with consistent error handling
 *
 * @param {any} value - Value to validate
 * @param {Function[]} validators - Array of validation functions
 * @param {string} [fieldName="input"] - Name of field being validated. Default
 *   is `"input"`
 *
 * @returns {ValidationResult} Validation result
 */
export function validateInput(
    value: any,
    validators: Function[],
    fieldName?: string
): ValidationResult;
/**
 * Wrap a function with error handling
 *
 * @param {Function} fn - Function to wrap
 * @param {ErrorHandlingOptions} [options={}] - Error handling options. Default
 *   is `{}`
 *
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(
    fn: Function,
    options?: ErrorHandlingOptions
): Function;
/**
 * Initialize error handling system. Currently accepts an options object for
 * future extensibility.
 *
 * @param {Object} [_options={}] - Initialization options (reserved for future
 *   use). Default is `{}`
 */
export function initializeErrorHandling(_options?: Object): void;
/**
 * Standardized error logging with consistent format
 *
 * @param {Error} error - Error to log
 * @param {ErrorContext} [context={}] - Additional context. Default is `{}`
 * @param {string} [level="error"] - Log level. Default is `"error"`
 */
export function logError(
    error: Error,
    context?: ErrorContext,
    level?: string
): void;
/**
 * Create a resilient version of a function that continues on error with
 * fallback
 *
 * @param {Function} fn - Function to make resilient
 * @param {any} fallback - Fallback value
 * @param {Object} [options={}] - Options. Default is `{}`
 *
 * @returns {Function} Resilient function
 */
export function makeResilient(
    fn: Function,
    fallback: any,
    options?: Object
): Function;
/**
 * Create a safe version of a function that returns null on error instead of
 * throwing
 *
 * @param {Function} fn - Function to make safe
 * @param {Object} [options={}] - Options. Default is `{}`
 * @param {boolean} [options.logErrors=true] - Whether to log errors. Default is
 *   `true`
 *
 * @returns {Function} Safe function
 */
export function makeSafe(
    fn: Function,
    options?: {
        logErrors?: boolean | undefined;
    }
): Function;
export namespace ERROR_CODES {
    let INVALID_INPUT: string;
    let FILE_NOT_FOUND: string;
    let PARSE_ERROR: string;
    let NETWORK_ERROR: string;
    let PERMISSION_DENIED: string;
    let STATE_ERROR: string;
    let VALIDATION_ERROR: string;
    let UNKNOWN_ERROR: string;
}
/**
 * Enhanced Error class with additional context
 */
export class AppError extends Error {
    /**
     * Create an application error
     *
     * @param {string} message - Error message
     * @param {ErrorContext} [context={}] - Additional error context. Default is
     *   `{}`
     */
    constructor(message: string, context?: ErrorContext);
    context: ErrorContext;
    timestamp: number;
    /**
     * Get a formatted error message with context
     *
     * @returns {string} Formatted error message
     */
    getFormattedMessage(): string;
    /**
     * Convert error to JSON for logging/serialization
     *
     * @returns {Object} JSON representation
     */
    toJSON(): Object;
}
/**
 * Validation Error class for input validation failures
 */
export class ValidationError extends AppError {
    /**
     * Create a validation error
     *
     * @param {string} message - Error message
     * @param {Object} details - Validation details
     * @param {string[]} details.errors - Validation errors
     * @param {string[]} [details.warnings=[]] - Validation warnings. Default is
     *   `[]`
     */
    constructor(
        message: string,
        details: {
            errors: string[];
            warnings?: string[] | undefined;
        }
    );
    errors: string[];
    warnings: string[];
}
export namespace validators {
    function isFiniteNumber(value: any, fieldName: string): ValidationResult;
    function isPositiveNumber(value: any, fieldName: string): ValidationResult;
    function isNonEmptyString(value: any, fieldName: string): ValidationResult;
    function isRequired(value: any, fieldName: string): ValidationResult;
}
export type ErrorContext = {
    /**
     * - Operation that failed
     */
    operation?: string;
    /**
     * - Component where error occurred
     */
    component?: string;
    /**
     * - Input that caused the error
     */
    input?: any;
    /**
     * - File path or state path related to error
     */
    path?: string;
    /**
     * - Error code
     */
    code?: number;
};
export type ErrorHandlingOptions = {
    /**
     * - Whether to fail safely (return fallback) or throw
     */
    failSafe?: boolean;
    /**
     * - Fallback value for fail-safe mode
     */
    fallback?: any;
    /**
     * - Whether to log the error
     */
    logError?: boolean;
    /**
     * - Log level (debug, info, warn, error)
     */
    logLevel?: string;
    /**
     * - Whether to show user notification
     */
    notify?: boolean;
    /**
     * - Notification type (error, warning, info)
     */
    notificationType?: string;
};
export type ValidationResult = {
    /**
     * - Whether validation passed
     */
    isValid: boolean;
    /**
     * - Array of error messages
     */
    errors: string[];
    /**
     * - Array of warning messages
     */
    warnings: string[];
    /**
     * - Validated/normalized value if applicable
     */
    validatedValue?: any;
};

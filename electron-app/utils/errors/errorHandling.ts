/**
 * Provides consistent error handling patterns across the FitFileViewer
 * application.
 */

import {
    getErrorHandlingRuntime,
    type ErrorHandlingRuntime,
} from "./errorHandlingRuntime.js";

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
} as const;

/**
 * Union of supported application error code values.
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Console log levels supported by the shared error utilities.
 */
export type LogLevel = "debug" | "error" | "info" | "warn";

/**
 * Notification variants supported by the renderer notification bridge.
 */
export type NotificationType = "error" | "info" | "warning";

/**
 * Structured context attached to handled errors and telemetry records.
 */
export type ErrorContext = {
    code?: ErrorCode;
    component?: string;
    input?: unknown;
    operation?: string;
    path?: string;
};

export type ErrorNotificationSink = (
    message: string,
    type: NotificationType
) => void;

/**
 * Options that control whether handled errors throw, log, notify, or fallback.
 */
export type ErrorHandlingOptions<Fallback = null> = {
    failSafe?: boolean;
    fallback?: Fallback;
    logError?: boolean;
    logLevel?: LogLevel;
    notificationType?: NotificationType;
    notify?: boolean;
    notifyUser?: ErrorNotificationSink;
};

export type InitializeErrorHandlingOptions = {
    runtime?: ErrorHandlingRuntime;
};

/**
 * Result returned by validation helpers after all validators have run.
 */
export type ValidationResult<T = unknown> = {
    errors: string[];
    isValid: boolean;
    validatedValue: T;
    warnings: string[];
};

/**
 * Result shape accepted from individual validators.
 */
export type ValidatorResult<T = unknown> = {
    errors?: string[];
    isValid: boolean;
    validatedValue?: T;
    value?: T;
    warnings?: string[];
};

/**
 * Function signature for reusable input validators.
 */
export type Validator<T = unknown> = (
    value: unknown,
    fieldName: string
) => boolean | ValidatorResult<T>;

type MaybePromise<T> = Promise<T> | T;

let globalErrorListenerAbortController: AbortController | undefined;

function errorHandlingRuntime(): ErrorHandlingRuntime {
    return getErrorHandlingRuntime();
}

function getUnknownErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isValidationObject<T>(value: unknown): value is ValidatorResult<T> {
    return typeof value === "object" && value !== null && "isValid" in value;
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
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
    public readonly context: ErrorContext;
    public readonly timestamp: number;

    public constructor(message: string, context: ErrorContext = {}) {
        super(message);
        this.name = "AppError";
        this.context = context;
        this.timestamp = errorHandlingRuntime().dateNow();
    }

    public getFormattedMessage(): string {
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

    public toJSON(): {
        context: ErrorContext;
        message: string;
        name: string;
        stack: string | undefined;
        timestamp: number;
    } {
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
    public readonly errors: string[];
    public readonly warnings: string[];

    public constructor(
        message: string,
        details: { errors?: string[]; warnings?: string[] }
    ) {
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
export function createErrorHandler<Fallback = null>(
    options: ErrorHandlingOptions<Fallback> = {}
): (error: unknown, context?: ErrorContext) => Fallback {
    const config = {
        failSafe: false,
        fallback: null as Fallback,
        logError: true,
        logLevel: "error" as LogLevel,
        notificationType: "error" as NotificationType,
        notify: false,
        notifyUser: undefined as ErrorNotificationSink | undefined,
        ...options,
    };

    return function handleError(
        error: unknown,
        context: ErrorContext = {}
    ): Fallback {
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

        if (config.notify && typeof config.notifyUser === "function") {
            try {
                config.notifyUser(err.message, config.notificationType);
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
export function validateInput<T = unknown>(
    value: unknown,
    validatorsToRun: readonly Validator<T>[],
    fieldName = "input"
): ValidationResult<T | unknown> {
    const result: ValidationResult<T | unknown> = {
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
            } else if (isValidationObject<T>(validationResult)) {
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
                `Validation error for ${fieldName}: ${getUnknownErrorMessage(
                    error
                )}`
            );
        }
    }

    return result;
}

/**
 * Wrap a sync or async function with standardized error handling.
 */
export function withErrorHandling<
    Args extends unknown[],
    Result,
    Fallback = null,
>(
    fn: (...args: Args) => MaybePromise<Result>,
    options: ErrorHandlingOptions<Fallback> = {}
): (...args: Args) => MaybePromise<Fallback | Result> {
    const handleError = createErrorHandler(options);
    const functionName = fn.name || "anonymous";

    return function wrappedFunction(
        ...args: Args
    ): MaybePromise<Fallback | Result> {
        try {
            const result = fn(...args);

            if (isPromiseLike<Result>(result)) {
                return Promise.resolve(result).catch((error: unknown) =>
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
    isFiniteNumber(value: unknown, fieldName: string): ValidatorResult<number> {
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

    isNonEmptyString(
        value: unknown,
        fieldName: string
    ): ValidatorResult<string> {
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

    isPositiveNumber(
        value: unknown,
        fieldName: string
    ): ValidatorResult<number> {
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

    isRequired(value: unknown, fieldName: string): ValidatorResult<unknown> {
        return {
            errors:
                value === null || value === undefined
                    ? [`${fieldName} is required`]
                    : [],
            isValid: value !== null && value !== undefined,
            value,
        };
    },
} as const;

/**
 * Initialize browser-level global error logging hooks.
 */
export function initializeErrorHandling(
    options: InitializeErrorHandlingOptions = {}
): void {
    const runtime = options.runtime ?? errorHandlingRuntime();
    const eventTarget = runtime.getErrorListenerTarget();

    if (eventTarget) {
        globalErrorListenerAbortController?.abort();
        globalErrorListenerAbortController = runtime.createAbortController();
        const listenerOptions = {
            signal: globalErrorListenerAbortController.signal,
        };

        eventTarget.addEventListener(
            "error",
            (event: ErrorEvent) => {
                logError(event.error ?? new Error(event.message), {
                    operation: "global-error-handler",
                    path: `${event.filename}:${event.lineno}:${event.colno}`,
                });
            },
            listenerOptions
        );

        eventTarget.addEventListener(
            "unhandledrejection",
            (event: PromiseRejectionEvent) => {
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
 * Log an error with structured context.
 */
export function logError(
    error: Error,
    context: ErrorContext = {},
    level: LogLevel = "error"
): void {
    const timestamp = errorHandlingRuntime().isoNow();
    const errorInfo = {
        context,
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp,
    };

    console[level](`[${timestamp}] Error:`, errorInfo);
}

/**
 * Create a fail-safe function wrapper that returns a caller-provided fallback.
 */
export function makeResilient<Args extends unknown[], Result, Fallback>(
    fn: (...args: Args) => MaybePromise<Result>,
    fallback: Fallback,
    options: ErrorHandlingOptions<Fallback> = {}
): (...args: Args) => MaybePromise<Fallback | Result> {
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
export function makeSafe<Args extends unknown[], Result>(
    fn: (...args: Args) => MaybePromise<Result>,
    options: { logErrors?: boolean } = {}
): (...args: Args) => MaybePromise<Result | null> {
    const { logErrors = true } = options;

    return withErrorHandling(fn, {
        failSafe: true,
        fallback: null,
        logError: logErrors,
        logLevel: "warn",
    });
}

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    AppError,
    ERROR_CODES,
    ValidationError,
    createErrorHandler,
    initializeErrorHandling,
    logError,
    makeResilient,
    makeSafe,
    validateInput,
    validators,
    withErrorHandling,
    type ErrorContext,
    type NotificationType,
} from "../../../electron-app/utils/errors/index.js";
import type { ErrorHandlingRuntime } from "../../../electron-app/utils/errors/errorHandlingRuntime.js";

describe("error handling utilities", () => {
    // eslint-disable-next-line vitest/no-hooks -- Shared global cleanup keeps integration mocks isolated.
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("application errors", () => {
        it("formats context and serializes stable error metadata", () => {
            expect.assertions(4);

            const error = new AppError("Cannot open file", {
                component: "import",
                operation: "open",
                path: "ride.fit",
            });

            expect(error.getFormattedMessage()).toBe(
                "Cannot open file | Operation: open | Component: import | Path: ride.fit"
            );
            expect(error.toJSON().message).toBe("Cannot open file");
            expect(error.toJSON().context.path).toBe("ride.fit");
            expect(error.toJSON().timestamp).toBe(error.timestamp);
        });

        it("stores validation details with the validation error code", () => {
            expect.assertions(4);

            const error = new ValidationError("Invalid settings", {
                errors: ["speedUnit is required"],
                warnings: ["distanceUnit will use default"],
            });

            expect(error.name).toBe("ValidationError");
            expect(error.context.code).toBe(ERROR_CODES.VALIDATION_ERROR);
            expect(error.errors).toStrictEqual(["speedUnit is required"]);
            expect(error.warnings).toStrictEqual([
                "distanceUnit will use default",
            ]);
        });
    });

    describe("error handlers", () => {
        it("returns the configured fallback in fail-safe mode", () => {
            expect.assertions(2);

            const warnSpy = vi
                .spyOn(console, "warn")
                .mockReturnValue(undefined);
            const handler = createErrorHandler({
                failSafe: true,
                fallback: "fallback value",
                logLevel: "warn",
            });
            const error = new AppError("Load failed", { operation: "load" });

            expect(handler(error)).toBe("fallback value");
            expect(warnSpy).toHaveBeenCalledWith(
                "[ErrorHandler] Load failed | Operation: load",
                error
            );
        });

        it("throws in strict mode and annotates standard errors with context", () => {
            expect.assertions(2);

            const error = new Error("Strict failure");
            const context: ErrorContext = { operation: "strictOperation" };
            const handler = createErrorHandler({ logError: false });

            expect(() => handler(error, context)).toThrow(error);
            expect(
                (error as Error & { context?: ErrorContext }).context
            ).toStrictEqual(context);
        });

        it("routes explicit notifications and isolates notification failures", () => {
            expect.assertions(3);

            const notificationType: NotificationType = "error";
            const notificationError = new Error(
                "Notification bridge unavailable"
            );
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockReturnValue(undefined);
            vi.spyOn(console, "error").mockReturnValue(undefined);
            const notifyUser = vi.fn<
                (message: string, type: NotificationType) => void
            >(() => {
                throw notificationError;
            });

            const handler = createErrorHandler({
                failSafe: true,
                fallback: null,
                notificationType,
                notify: true,
                notifyUser,
            });

            expect(handler(new Error("Notify user"))).toBeNull();
            expect(notifyUser).toHaveBeenCalledWith(
                "Notify user",
                notificationType
            );
            expect(warnSpy).toHaveBeenCalledWith(
                "[ErrorHandler] Failed to show notification:",
                notificationError
            );
        });

        it("wraps sync and async functions with the same fallback policy", async () => {
            expect.assertions(2);

            vi.spyOn(console, "warn").mockReturnValue(undefined);

            const syncValue = makeResilient(() => {
                throw new Error("sync");
            }, 42);
            const asyncValue = withErrorHandling(
                async () => {
                    throw new Error("async");
                },
                {
                    failSafe: true,
                    fallback: "async fallback",
                    logLevel: "warn",
                }
            );

            expect({
                syncFallback: syncValue(),
            }).toStrictEqual({
                syncFallback: 42,
            });
            await expect(asyncValue()).resolves.toBe("async fallback");
        });

        it("creates safe wrappers that return null without logging when requested", () => {
            expect.assertions(2);

            const warnSpy = vi
                .spyOn(console, "warn")
                .mockReturnValue(undefined);
            const safeValue = makeSafe(
                () => {
                    throw new Error("safe");
                },
                { logErrors: false }
            );

            expect(safeValue()).toBeNull();
            expect(warnSpy).not.toHaveBeenCalled();
        });
    });

    describe("validation helpers", () => {
        it("normalizes values from validators", () => {
            expect.assertions(1);

            const result = validateInput(
                "  Morning Ride  ",
                [
                    (value, fieldName) =>
                        validators.isRequired(value, fieldName),
                    (value, fieldName) =>
                        validators.isNonEmptyString(value, fieldName),
                ],
                "title"
            );

            expect({
                errors: result.errors,
                isValid: result.isValid,
                validatedValue: result.validatedValue,
            }).toStrictEqual({
                errors: [],
                isValid: true,
                validatedValue: "Morning Ride",
            });
        });

        it("collects boolean, object, and thrown validation failures", () => {
            expect.assertions(2);

            const result = validateInput(
                Number.NaN,
                [
                    (value, fieldName) =>
                        validators.isFiniteNumber(value, fieldName),
                    () => false,
                    () => {
                        throw new Error("custom check failed");
                    },
                ],
                "speed"
            );

            expect({
                errors: result.errors,
                isValid: result.isValid,
            }).toStrictEqual({
                errors: [
                    "speed must be a finite number",
                    "Invalid speed",
                    "Validation error for speed: custom check failed",
                ],
                isValid: false,
            });
            expect(result.errors).not.toContain("speed is required");
        });
    });

    describe("global error integration", () => {
        it("registers browser-level error listeners when available", () => {
            expect.assertions(4);

            const listenerSpy = vi.fn<Window["addEventListener"]>();
            const logSpy = vi.spyOn(console, "log").mockReturnValue(undefined);
            const controller = new AbortController();
            const createAbortController = vi.fn(() => controller);
            const runtime: ErrorHandlingRuntime = {
                createAbortController,
                dateNow: () => 1234,
                getGlobalEventTarget: () => ({
                    addEventListener: listenerSpy,
                }),
            };

            expect(initializeErrorHandling({ runtime })).toBeUndefined();
            expect(createAbortController).toHaveBeenCalledOnce();
            expect(
                listenerSpy.mock.calls.map(
                    ([
                        eventName,
                        listener,
                        options,
                    ]) => ({
                        eventName,
                        listenerType: typeof listener,
                        signalIsAbortSignal:
                            (options as AddEventListenerOptions | undefined)
                                ?.signal === controller.signal,
                    })
                )
            ).toStrictEqual([
                {
                    eventName: "error",
                    listenerType: "function",
                    signalIsAbortSignal: true,
                },
                {
                    eventName: "unhandledrejection",
                    listenerType: "function",
                    signalIsAbortSignal: true,
                },
            ]);
            expect(logSpy).toHaveBeenCalledWith(
                "[ErrorHandling] Error handling system initialized"
            );
        });

        it("logs structured errors with operation context", () => {
            expect.assertions(2);

            const error = new Error("Telemetry failure");
            const errorSpy = vi
                .spyOn(console, "error")
                .mockReturnValue(undefined);

            expect(logError(error, { operation: "telemetry" })).toBeUndefined();
            const [errorPrefix, errorPayload] = errorSpy.mock.calls[0] ?? [];
            expect({
                message: (errorPayload as Error | undefined)?.message,
                name: (errorPayload as Error | undefined)?.name,
                prefixMatches: /^\[.+\] Error:$/u.test(String(errorPrefix)),
            }).toStrictEqual({
                message: "Telemetry failure",
                name: "Error",
                prefixMatches: true,
            });
        });
    });
});

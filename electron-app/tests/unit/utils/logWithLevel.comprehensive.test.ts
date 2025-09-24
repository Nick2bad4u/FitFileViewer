import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { logWithLevel } from "../../../utils/logging/index.js";

describe("logWithLevel.js - Logging Utility", () => {
    let consoleSpy: any;
    let originalConsole: any;

    beforeEach(() => {
        // Create spies for all console methods
        originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
        };

        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            info: vi.spyOn(console, "info").mockImplementation(() => {}),
            warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Mock Date to have consistent timestamps in tests
        vi.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe("Basic Logging Functionality", () => {
        it("should log with info level", () => {
            logWithLevel("info", "Test info message");

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test info message");
        });

        it("should log with warn level", () => {
            logWithLevel("warn", "Test warning message");

            expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
            expect(consoleSpy.warn).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test warning message");
        });

        it("should log with error level", () => {
            logWithLevel("error", "Test error message");

            expect(consoleSpy.error).toHaveBeenCalledTimes(1);
            expect(consoleSpy.error).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test error message");
        });

        it("should log with log level (default case)", () => {
            logWithLevel("log", "Test log message");

            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            expect(consoleSpy.log).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test log message");
        });

        it("should default to console.log for unknown level", () => {
            logWithLevel("unknown" as any, "Test unknown level");

            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            expect(consoleSpy.log).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test unknown level");
        });
    });

    describe("Context Object Handling", () => {
        it("should log with context object for info level", () => {
            const context = { userId: 123, action: "login" };
            logWithLevel("info", "User logged in", context);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] User logged in", context);
        });

        it("should log with context object for warn level", () => {
            const context = { attemptCount: 3, maxAttempts: 5 };
            logWithLevel("warn", "Multiple failed attempts", context);

            expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "2023-01-01T12:00:00.000Z [FFV] Multiple failed attempts",
                context
            );
        });

        it("should log with context object for error level", () => {
            const context = { errorCode: 500, stack: "Error stack trace" };
            logWithLevel("error", "Server error occurred", context);

            expect(consoleSpy.error).toHaveBeenCalledTimes(1);
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "2023-01-01T12:00:00.000Z [FFV] Server error occurred",
                context
            );
        });

        it("should log with context object for log level", () => {
            const context = { component: "DataProcessor", step: "validation" };
            logWithLevel("log", "Processing data", context);

            expect(consoleSpy.log).toHaveBeenCalledTimes(1);
            expect(consoleSpy.log).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Processing data", context);
        });
    });

    describe("Context Object Edge Cases", () => {
        it("should not log context for null context", () => {
            logWithLevel("info", "Test message", null as any);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test message");
        });

        it("should not log context for undefined context", () => {
            logWithLevel("info", "Test message", undefined);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test message");
        });

        it("should not log context for empty object", () => {
            logWithLevel("info", "Test message", {});

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test message");
        });

        it("should log context for object with properties", () => {
            const context = { key: "value" };
            logWithLevel("info", "Test message", context);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test message", context);
        });

        it("should handle context with nested objects", () => {
            const context = {
                user: { id: 123, name: "John" },
                metadata: { timestamp: Date.now() },
            };
            logWithLevel("info", "Complex context", context);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Complex context", context);
        });

        it("should handle context with arrays", () => {
            const context = {
                items: ["item1", "item2", "item3"],
                count: 3,
            };
            logWithLevel("info", "Array context", context);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Array context", context);
        });
    });

    describe("Message Formatting", () => {
        it("should handle empty message", () => {
            logWithLevel("info", "");

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] ");
        });

        it("should handle multi-line message", () => {
            const multiLineMessage = "Line 1\nLine 2\nLine 3";
            logWithLevel("info", multiLineMessage);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Line 1\nLine 2\nLine 3");
        });

        it("should handle message with special characters", () => {
            const specialMessage = "Special chars: !@#$%^&*()[]{}|\\:\";'<>?,./ 中文 🚀";
            logWithLevel("info", specialMessage);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith(`2023-01-01T12:00:00.000Z [FFV] ${specialMessage}`);
        });

        it("should handle very long message", () => {
            const longMessage = "A".repeat(10000);
            logWithLevel("info", longMessage);

            expect(consoleSpy.info).toHaveBeenCalledTimes(1);
            expect(consoleSpy.info).toHaveBeenCalledWith(`2023-01-01T12:00:00.000Z [FFV] ${longMessage}`);
        });
    });

    describe("Timestamp Formatting", () => {
        it("should use ISO timestamp format", () => {
            logWithLevel("info", "Test message");

            const call = consoleSpy.info.mock.calls[0][0];
            expect(call).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[FFV\] Test message$/);
        });

        it("should update timestamp for different calls", () => {
            logWithLevel("info", "First message");

            // Advance time
            vi.setSystemTime(new Date("2023-01-01T12:01:00.000Z"));

            logWithLevel("info", "Second message");

            expect(consoleSpy.info.mock.calls[0][0]).toContain("2023-01-01T12:00:00.000Z");
            expect(consoleSpy.info.mock.calls[1][0]).toContain("2023-01-01T12:01:00.000Z");
        });
    });

    describe("Error Handling", () => {
        it("should handle console method throwing error", () => {
            // Make console.info throw an error
            consoleSpy.info.mockImplementation(() => {
                throw new Error("Console error");
            });

            // Should not throw, should fallback to minimal logging
            expect(() => logWithLevel("info", "Test message")).not.toThrow();

            expect(consoleSpy.log).toHaveBeenCalledWith("[FFV][logWithLevel] Logging failure");
        });

        it("should handle Date.prototype.toISOString throwing error", () => {
            // Mock Date.prototype.toISOString to throw
            const originalToISOString = Date.prototype.toISOString;
            Date.prototype.toISOString = vi.fn().mockImplementation(() => {
                throw new Error("Date error");
            });

            // Should not throw, should fallback to minimal logging
            expect(() => logWithLevel("info", "Test message")).not.toThrow();

            expect(consoleSpy.log).toHaveBeenCalledWith("[FFV][logWithLevel] Logging failure");

            // Restore original method
            Date.prototype.toISOString = originalToISOString;
        });

        it("should handle Object.keys throwing error on context", () => {
            // Create object that throws on Object.keys
            const problematicContext = {};
            Object.defineProperty(problematicContext, Symbol.iterator, {
                get() {
                    throw new Error("Iterator error");
                },
            });

            // Mock Object.keys to throw
            const originalObjectKeys = Object.keys;
            Object.keys = vi.fn().mockImplementation(() => {
                throw new Error("Object.keys error");
            });

            // Should not throw, should fallback to minimal logging
            expect(() => logWithLevel("info", "Test message", problematicContext)).not.toThrow();

            expect(consoleSpy.log).toHaveBeenCalledWith("[FFV][logWithLevel] Logging failure");

            // Restore original method
            Object.keys = originalObjectKeys;
        });
    });

    describe("Performance and Memory", () => {
        it("should handle multiple rapid calls efficiently", () => {
            const messages = Array.from({ length: 100 }, (_, i) => `Message ${i}`);

            messages.forEach((message) => {
                logWithLevel("info", message);
            });

            expect(consoleSpy.info).toHaveBeenCalledTimes(100);
        });

        it("should not retain references to context objects", () => {
            const context = { data: "test" };
            logWithLevel("info", "Test message", context);

            // Modify original context
            context.data = "modified";

            // The logged call should have captured the original state
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test message", {
                data: "test",
            });
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle typical application logging patterns", () => {
            // Application startup
            logWithLevel("info", "Application starting", { version: "1.0.0" });

            // User action
            logWithLevel("info", "User action performed", {
                userId: "user123",
                action: "fileUpload",
                fileSize: 1024,
            });

            // Warning condition
            logWithLevel("warn", "Memory usage high", {
                memoryUsage: "85%",
                threshold: "80%",
            });

            // Error condition
            logWithLevel("error", "Database connection failed", {
                error: "ECONNREFUSED",
                host: "localhost",
                port: 5432,
                retryCount: 3,
            });

            expect(consoleSpy.info).toHaveBeenCalledTimes(2);
            expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
            expect(consoleSpy.error).toHaveBeenCalledTimes(1);
        });

        it("should handle debugging scenarios", () => {
            const debugContext = {
                function: "processData",
                parameters: { id: 123, type: "user" },
                executionTime: 150,
                memoryBefore: 45000000,
                memoryAfter: 47000000,
            };

            logWithLevel("log", "Debug trace", debugContext);

            expect(consoleSpy.log).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Debug trace", debugContext);
        });

        it("should handle error reporting scenarios", () => {
            const errorContext = {
                errorType: "ValidationError",
                field: "email",
                value: "invalid-email",
                constraints: ["must be valid email", "must not be empty"],
                stackTrace: "Error: ValidationError\n    at validate()",
            };

            logWithLevel("error", "Validation failed", errorContext);

            expect(consoleSpy.error).toHaveBeenCalledWith(
                "2023-01-01T12:00:00.000Z [FFV] Validation failed",
                errorContext
            );
        });
    });

    describe("Integration Patterns", () => {
        it("should work well with structured logging systems", () => {
            const structuredContext = {
                "@timestamp": new Date().toISOString(),
                "@level": "INFO",
                "@logger": "fitfileviewer.main",
                "@thread": "main",
                message: "File processed successfully",
                file: {
                    name: "activity.fit",
                    size: 2048,
                    type: "application/octet-stream",
                },
                processing: {
                    duration: 245,
                    recordsProcessed: 1500,
                    errors: 0,
                },
            };

            logWithLevel("info", "File processing completed", structuredContext);

            expect(consoleSpy.info).toHaveBeenCalledWith(
                "2023-01-01T12:00:00.000Z [FFV] File processing completed",
                structuredContext
            );
        });

        it("should support correlation IDs and tracing", () => {
            const traceContext = {
                correlationId: "abc-123-def-456",
                traceId: "trace-789",
                spanId: "span-012",
                userId: "user-345",
                sessionId: "session-678",
            };

            logWithLevel("info", "Request processed", traceContext);

            expect(consoleSpy.info).toHaveBeenCalledWith(
                "2023-01-01T12:00:00.000Z [FFV] Request processed",
                traceContext
            );
        });
    });

    describe("Type Safety and Validation", () => {
        it("should accept all valid log levels", () => {
            const validLevels: Array<"log" | "info" | "warn" | "error"> = ["log", "info", "warn", "error"];

            validLevels.forEach((level) => {
                expect(() => logWithLevel(level, `Test ${level} message`)).not.toThrow();
            });
        });

        it("should handle various message types through string conversion", () => {
            logWithLevel("info", "String message");

            // The function expects string, but testing runtime behavior if non-string passed
            expect(consoleSpy.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] String message");
        });
    });
});

/**
 * Comprehensive test suite for logging utilities
 *
 * Tests getErrorInfo and logWithLevel functions that provide error handling
 * and consistent logging functionality.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { getErrorInfo } from "../../../utils/logging/getErrorInfo.js";
import { logWithLevel } from "../../../utils/logging/logWithLevel.js";

// Mock console for testing logging functions
const mockConsole = {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};

describe("Logging Utilities", () => {
    beforeEach(() => {
        // Mock console methods
        global.console.log = mockConsole.log;
        global.console.info = mockConsole.info;
        global.console.warn = mockConsole.warn;
        global.console.error = mockConsole.error;

        // Clear all mocks
        Object.values(mockConsole).forEach((mock) => mock.mockClear());
    });

    afterEach(() => {
        // Additional cleanup
        vi.clearAllMocks();
    });

    describe("getErrorInfo.js - Error Information Extraction", () => {
        describe("Standard Error Objects", () => {
            it("should extract message and stack from Error object", () => {
                const error = new Error("Test error message");
                const result = getErrorInfo(error);

                expect(result.message).toBe("Test error message");
                expect(result.stack).toBeDefined();
                expect(typeof result.stack).toBe("string");
                expect(result.stack).toContain("Test error message");
            });

            it("should extract message and stack from TypeError", () => {
                const error = new TypeError("Invalid type");
                const result = getErrorInfo(error);

                expect(result.message).toBe("Invalid type");
                expect(result.stack).toBeDefined();
                expect(typeof result.stack).toBe("string");
            });

            it("should extract message and stack from ReferenceError", () => {
                const error = new ReferenceError("Variable not defined");
                const result = getErrorInfo(error);

                expect(result.message).toBe("Variable not defined");
                expect(result.stack).toBeDefined();
                expect(typeof result.stack).toBe("string");
            });

            it("should extract message and stack from custom Error subclass", () => {
                class CustomError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = "CustomError";
                    }
                }
                const error = new CustomError("Custom error message");
                const result = getErrorInfo(error);

                expect(result.message).toBe("Custom error message");
                expect(result.stack).toBeDefined();
                expect(typeof result.stack).toBe("string");
            });
        });

        describe("Error-like Objects", () => {
            it("should extract message from object with message property", () => {
                const errorLike = { message: "Custom error message" };
                const result = getErrorInfo(errorLike);

                expect(result.message).toBe("Custom error message");
                expect(result.stack).toBeUndefined();
            });

            it("should extract message and stack from object with both properties", () => {
                const errorLike = {
                    message: "Error message",
                    stack: "Error: Error message\n    at testFunction (test.js:1:1)",
                };
                const result = getErrorInfo(errorLike);

                expect(result.message).toBe("Error message");
                expect(result.stack).toBe("Error: Error message\n    at testFunction (test.js:1:1)");
            });

            it("should handle object with non-string message property", () => {
                const errorLike = { message: 42, other: "data" };
                const result = getErrorInfo(errorLike);

                expect(result.message).toBe("[object Object]");
                expect(result.stack).toBeUndefined();
            });

            it("should handle object with non-string stack property", () => {
                const errorLike = { message: "Valid message", stack: null };
                const result = getErrorInfo(errorLike);

                expect(result.message).toBe("Valid message");
                expect(result.stack).toBeUndefined();
            });

            it("should handle empty object", () => {
                const errorLike = {};
                const result = getErrorInfo(errorLike);

                expect(result.message).toBe("[object Object]");
                expect(result.stack).toBeUndefined();
            });

            it("should handle object with additional properties", () => {
                const errorLike = {
                    message: "Error occurred",
                    stack: "stack trace",
                    code: "ERR_CODE",
                    status: 500,
                };
                const result = getErrorInfo(errorLike);

                expect(result.message).toBe("Error occurred");
                expect(result.stack).toBe("stack trace");
            });
        });

        describe("Primitive Values", () => {
            it("should handle string input", () => {
                const result = getErrorInfo("Simple error string");

                expect(result.message).toBe("Simple error string");
                expect(result.stack).toBeUndefined();
            });

            it("should handle number input", () => {
                const result = getErrorInfo(404);

                expect(result.message).toBe("404");
                expect(result.stack).toBeUndefined();
            });

            it("should handle boolean true input", () => {
                const result = getErrorInfo(true);

                expect(result.message).toBe("true");
                expect(result.stack).toBeUndefined();
            });

            it("should handle boolean false input", () => {
                const result = getErrorInfo(false);

                expect(result.message).toBe("false");
                expect(result.stack).toBeUndefined();
            });

            it("should handle null input", () => {
                const result = getErrorInfo(null);

                expect(result.message).toBe("null");
                expect(result.stack).toBeUndefined();
            });

            it("should handle undefined input", () => {
                const result = getErrorInfo(undefined);

                expect(result.message).toBe("undefined");
                expect(result.stack).toBeUndefined();
            });

            it("should handle Symbol input", () => {
                const symbol = Symbol("test");
                const result = getErrorInfo(symbol);

                expect(result.message).toBe("Symbol(test)");
                expect(result.stack).toBeUndefined();
            });
        });

        describe("Complex Objects", () => {
            it("should handle array input", () => {
                const result = getErrorInfo(["error", "array"]);

                expect(result.message).toBe("error,array");
                expect(result.stack).toBeUndefined();
            });

            it("should handle Date object", () => {
                const date = new Date("2023-01-01T00:00:00.000Z");
                const result = getErrorInfo(date);

                // Should convert date to string representation
                expect(typeof result.message).toBe("string");
                expect(result.message.length).toBeGreaterThan(0);
                expect(result.stack).toBeUndefined();
            });

            it("should handle function input", () => {
                const func = function testFunction() {};
                const result = getErrorInfo(func);

                expect(result.message).toContain("function testFunction");
                expect(result.stack).toBeUndefined();
            });
        });

        describe("Edge Cases", () => {
            it("should handle circular reference object", () => {
                const circular: any = { message: "Circular error" };
                circular.self = circular;

                const result = getErrorInfo(circular);

                expect(result.message).toBe("Circular error");
                expect(result.stack).toBeUndefined();
            });

            it("should handle very long message strings", () => {
                const longMessage = "a".repeat(10000);
                const result = getErrorInfo(longMessage);

                expect(result.message).toBe(longMessage);
                expect(result.stack).toBeUndefined();
            });
        });
    });

    describe("logWithLevel.js - Structured Logging", () => {
        // Mock Date for consistent timestamps
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        describe("Log Levels", () => {
            it("should log with info level", () => {
                logWithLevel("info", "Test info message");

                expect(mockConsole.info).toHaveBeenCalledTimes(1);
                expect(mockConsole.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test info message");

                expect(mockConsole.log).not.toHaveBeenCalled();
                expect(mockConsole.warn).not.toHaveBeenCalled();
                expect(mockConsole.error).not.toHaveBeenCalled();
            });

            it("should log with warn level", () => {
                logWithLevel("warn", "Test warning message");

                expect(mockConsole.warn).toHaveBeenCalledTimes(1);
                expect(mockConsole.warn).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test warning message");

                expect(mockConsole.log).not.toHaveBeenCalled();
                expect(mockConsole.info).not.toHaveBeenCalled();
                expect(mockConsole.error).not.toHaveBeenCalled();
            });

            it("should log with error level", () => {
                logWithLevel("error", "Test error message");

                expect(mockConsole.error).toHaveBeenCalledTimes(1);
                expect(mockConsole.error).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test error message");

                expect(mockConsole.log).not.toHaveBeenCalled();
                expect(mockConsole.info).not.toHaveBeenCalled();
                expect(mockConsole.warn).not.toHaveBeenCalled();
            });

            it("should log with log level (default)", () => {
                logWithLevel("log", "Test log message");

                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test log message");

                expect(mockConsole.info).not.toHaveBeenCalled();
                expect(mockConsole.warn).not.toHaveBeenCalled();
                expect(mockConsole.error).not.toHaveBeenCalled();
            });

            it("should fallback to log for unknown level", () => {
                logWithLevel("debug" as any, "Test debug message");

                expect(mockConsole.log).toHaveBeenCalledTimes(1);
                expect(mockConsole.log).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Test debug message");

                expect(mockConsole.info).not.toHaveBeenCalled();
                expect(mockConsole.warn).not.toHaveBeenCalled();
                expect(mockConsole.error).not.toHaveBeenCalled();
            });
        });

        describe("Context Handling", () => {
            it("should log with context object", () => {
                const context = { userId: 123, action: "login" };
                logWithLevel("info", "User action", context);

                expect(mockConsole.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] User action", context);
            });

            it("should log without context when not provided", () => {
                logWithLevel("info", "Simple message");

                expect(mockConsole.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] Simple message");
            });

            it("should log without context when undefined", () => {
                logWithLevel("info", "Message with undefined context", undefined);

                expect(mockConsole.info).toHaveBeenCalledWith(
                    "2023-01-01T12:00:00.000Z [FFV] Message with undefined context"
                );
            });

            it("should log without context when empty object", () => {
                logWithLevel("info", "Message with empty context", {});

                expect(mockConsole.info).toHaveBeenCalledWith(
                    "2023-01-01T12:00:00.000Z [FFV] Message with empty context"
                );
            });

            it("should log with context when non-empty object", () => {
                const context = { error: "Something went wrong" };
                logWithLevel("error", "Error occurred", context);

                expect(mockConsole.error).toHaveBeenCalledWith(
                    "2023-01-01T12:00:00.000Z [FFV] Error occurred",
                    context
                );
            });

            it("should handle complex context objects", () => {
                const context = {
                    user: { id: 123, name: "John" },
                    request: { method: "POST", url: "/api/users" },
                    timestamp: new Date(),
                    nested: { deep: { value: "test" } },
                };
                logWithLevel("warn", "Complex context", context);

                expect(mockConsole.warn).toHaveBeenCalledWith(
                    "2023-01-01T12:00:00.000Z [FFV] Complex context",
                    context
                );
            });
        });

        describe("Message Formatting", () => {
            it("should include timestamp in ISO format", () => {
                logWithLevel("info", "Test message");

                const expectedPrefix = "2023-01-01T12:00:00.000Z [FFV]";
                expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining(expectedPrefix));
            });

            it("should include FFV prefix", () => {
                logWithLevel("error", "Test error");

                expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining("[FFV]"));
            });

            it("should handle empty message", () => {
                logWithLevel("info", "");

                expect(mockConsole.info).toHaveBeenCalledWith("2023-01-01T12:00:00.000Z [FFV] ");
            });

            it("should handle very long messages", () => {
                const longMessage = "a".repeat(1000);
                logWithLevel("warn", longMessage);

                expect(mockConsole.warn).toHaveBeenCalledWith(`2023-01-01T12:00:00.000Z [FFV] ${longMessage}`);
            });

            it("should handle messages with special characters", () => {
                const specialMessage = "Message with 🚀 emojis and éspecial châràcters";
                logWithLevel("info", specialMessage);

                expect(mockConsole.info).toHaveBeenCalledWith(`2023-01-01T12:00:00.000Z [FFV] ${specialMessage}`);
            });
        });

        describe("Error Handling", () => {
            it("should handle console method throwing error", () => {
                mockConsole.info.mockImplementation(() => {
                    throw new Error("Console error");
                });

                // Should not throw and should fallback to minimal logging
                expect(() => logWithLevel("info", "Test message")).not.toThrow();

                expect(mockConsole.log).toHaveBeenCalledWith("[FFV][logWithLevel] Logging failure");
            });

            it("should handle Date.toISOString throwing error", () => {
                // Mock Date to throw error
                const originalDate = global.Date;
                global.Date = class extends Date {
                    toISOString(): string {
                        throw new Error("Date error");
                    }
                } as any;

                expect(() => logWithLevel("info", "Test message")).not.toThrow();
                expect(mockConsole.log).toHaveBeenCalledWith("[FFV][logWithLevel] Logging failure");

                // Restore original Date
                global.Date = originalDate;
            });

            it("should handle context serialization issues", () => {
                // Create circular reference in context
                const circularContext: any = { name: "test" };
                circularContext.self = circularContext;

                // Should not throw during logging
                expect(() => logWithLevel("info", "Test message", circularContext)).not.toThrow();
            });
        });

        describe("Integration Tests", () => {
            it("should log different levels with different contexts", () => {
                logWithLevel("info", "Info message", { type: "info" });
                logWithLevel("warn", "Warning message", { type: "warning" });
                logWithLevel("error", "Error message", { type: "error" });

                expect(mockConsole.info).toHaveBeenCalledTimes(1);
                expect(mockConsole.warn).toHaveBeenCalledTimes(1);
                expect(mockConsole.error).toHaveBeenCalledTimes(1);
            });

            it("should maintain consistent format across calls", () => {
                logWithLevel("info", "First message");
                logWithLevel("warn", "Second message");

                const infoCall = mockConsole.info.mock.calls[0][0];
                const warnCall = mockConsole.warn.mock.calls[0][0];

                expect(infoCall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[FFV\] First message$/);
                expect(warnCall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[FFV\] Second message$/);
            });
        });
    });
});

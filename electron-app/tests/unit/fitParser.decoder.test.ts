// @vitest-environment node
import type { Mock } from "vitest";
import type {
    DecoderOptions,
    FitFieldValue,
    FitMessages,
} from "../../shared/fit";
import type {
    FitParserModule,
    SettingsStateManager,
} from "../../shared/fitParser";
import type { FitSdkStream } from "../../shared/fitSdk";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Buffer } from "node:buffer";

type MockFitSdkDecoder = {
    checkIntegrity: Mock<() => boolean>;
    getIntegrityErrors?: Mock<() => FitFieldValue>;
    isFIT: Mock<() => boolean>;
    read?: Mock<
        () => {
            errors: FitFieldValue[];
            messages: FitMessages;
        }
    >;
};

type MockFitSdkStream = FitSdkStream & {
    buffer: Buffer;
};

type MockUpdateCategory = (
    category: string,
    value: Partial<DecoderOptions>
) => never;

// Mock external dependencies
const mockFitSDK = {
    Decoder: vi.fn(),
    Stream: {
        fromBuffer: vi.fn(),
    },
};

// Mock references are now handled by the hoisted vi.mock() above

// Mock state managers
const mockSettingsStateManager = {
    getCategory: vi.fn(),
    updateCategory: vi.fn(),
};

const mockFitFileStateManager = {
    updateLoadingProgress: vi.fn(),
    handleFileLoadingError: vi.fn(),
    handleFileLoaded: vi.fn(),
    getRecordCount: vi.fn().mockReturnValue(100),
};

const mockPerformanceMonitor = {
    startTimer: vi.fn(),
    endTimer: vi.fn(),
    getOperationTime: vi.fn().mockReturnValue(1500),
    isEnabled: true,
};

// Mock modules
vi.mock("@garmin/fitsdk", () => mockFitSDK);

describe("fitParser.js decoder behavior", () => {
    let fitParser: FitParserModule;
    let mockDecoder: MockFitSdkDecoder;
    let mockStream: MockFitSdkStream;

    beforeEach(async () => {
        // Reset all mocks
        vi.resetAllMocks();

        // Setup mock decoder
        mockDecoder = {
            checkIntegrity: vi.fn().mockReturnValue(true),
            getIntegrityErrors: vi.fn().mockReturnValue([]),
            isFIT: vi.fn().mockReturnValue(true),
            read: vi.fn().mockReturnValue({
                messages: {
                    activity: [{ sport: "cycling" }],
                    record: [{ timestamp: new Date(), heart_rate: 150 }],
                },
                errors: [],
            }),
        };

        mockStream = {
            buffer: Buffer.from([
                1,
                2,
                3,
                4,
            ]),
            bytesRead: 0,
            length: 4,
            position: 0,
        };

        mockFitSDK.Decoder.mockImplementation(function MockDecoder() {
            return mockDecoder;
        });
        mockFitSDK.Stream.fromBuffer.mockReturnValue(mockStream);

        // Clear console spies
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});

        // Import the module after setting up mocks
        fitParser =
            (await import("../../fitParser.js")) as unknown as FitParserModule;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Module Exports", () => {
        it("should export all required functions and constants", () => {
            expect(typeof fitParser.decodeFitFile).toBe("function");
            expect(typeof fitParser.FitDecodeError).toBe("function");
            expect(typeof fitParser.applyUnknownMessageLabels).toBe("function");
            expect(typeof fitParser.initializeStateManagement).toBe("function");
            expect(typeof fitParser.updateDecoderOptions).toBe("function");
            expect(typeof fitParser.getCurrentDecoderOptions).toBe("function");
            expect(typeof fitParser.resetDecoderOptions).toBe("function");
            expect(typeof fitParser.getPersistedDecoderOptions).toBe(
                "function"
            );
            expect(typeof fitParser.getDefaultDecoderOptions).toBe("function");
            expect(typeof fitParser.validateDecoderOptions).toBe("function");
            expect(
                Object.keys(fitParser.DECODER_OPTIONS_SCHEMA).sort()
            ).toEqual([
                "applyScaleAndOffset",
                "convertDateTimesToDates",
                "convertTypesToStrings",
                "expandComponents",
                "expandSubFields",
                "includeUnknownData",
                "mergeHeartRates",
            ]);
            expect(fitParser.DECODER_OPTIONS_SCHEMA).not.toStrictEqual({});
        });
    });

    describe("FitDecodeError", () => {
        it("should create error with correct properties", () => {
            const error = new fitParser.FitDecodeError(
                "Test error",
                { code: "TEST" },
                { source: "test" }
            );

            expect(error.name).toBe("FitDecodeError");
            expect(error.message).toBe("Test error");
            expect(error.details).toEqual({ code: "TEST" });
            expect(error.metadata.category).toBe("fit_parsing");
            expect(error.metadata.source).toBe("test");
            expect(typeof error.metadata.timestamp).toBe("string");
        });

        it("should serialize to JSON correctly", () => {
            const error = new fitParser.FitDecodeError("Test error", {
                code: "TEST",
            });
            const json = error.toJSON();

            expect(json.name).toBe("FitDecodeError");
            expect(json.message).toBe("Test error");
            expect(json.details).toEqual({ code: "TEST" });
            expect(json.metadata).toMatchObject({
                category: "fit_parsing",
                timestamp: expect.any(String),
            });
            expect(typeof json.stack).toBe("string");
        });
    });

    describe("State Management Integration", () => {
        it("should initialize state management with all managers", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
                fitFileStateManager: mockFitFileStateManager,
                performanceMonitor: mockPerformanceMonitor,
            });

            expect(console.log).toHaveBeenCalledWith(
                "[FitParser] State management initialized",
                {
                    hasSettings: true,
                    hasFitFileState: true,
                    hasPerformanceMonitor: true,
                }
            );
            expect(fitParser.getPersistedDecoderOptions()).toMatchObject(
                fitParser.getDefaultDecoderOptions()
            );
        });

        it("should initialize state management with no managers", () => {
            fitParser.initializeStateManagement();

            expect(console.log).toHaveBeenCalledWith(
                "[FitParser] State management initialized",
                {
                    hasSettings: false,
                    hasFitFileState: false,
                    hasPerformanceMonitor: false,
                }
            );
            expect(fitParser.getPersistedDecoderOptions()).toStrictEqual(
                fitParser.getDefaultDecoderOptions()
            );
        });

        it("should initialize state management with partial managers", () => {
            mockSettingsStateManager.getCategory.mockReturnValue({
                mergeHeartRates: false,
            });

            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });

            expect(console.log).toHaveBeenCalledWith(
                "[FitParser] State management initialized",
                {
                    hasSettings: true,
                    hasFitFileState: false,
                    hasPerformanceMonitor: false,
                }
            );
            expect(fitParser.getPersistedDecoderOptions()).toMatchObject({
                mergeHeartRates: false,
            });
        });
    });

    describe("Decoder Options Management", () => {
        it("should return default decoder options", () => {
            const defaults = fitParser.getDefaultDecoderOptions();

            expect(defaults).toMatchObject({
                applyScaleAndOffset: true,
                expandSubFields: true,
                expandComponents: true,
                convertTypesToStrings: true,
                convertDateTimesToDates: true,
                includeUnknownData: true,
                mergeHeartRates: true,
            });
        });

        it("should validate valid decoder options", () => {
            const options = {
                applyScaleAndOffset: false,
                expandSubFields: true,
            };

            const result = fitParser.validateDecoderOptions(options);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.validatedOptions.applyScaleAndOffset).toBe(false);
            expect(result.validatedOptions.expandSubFields).toBe(true);
            expect(result.validatedOptions.expandComponents).toBe(true); // default
        });

        it("should handle invalid decoder options", () => {
            const options = {
                applyScaleAndOffset: "invalid",
                unknownOption: true,
            };

            const result = fitParser.validateDecoderOptions(options);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.validatedOptions).toMatchObject(
                fitParser.getDefaultDecoderOptions()
            );
        });

        it("should handle null decoder options", () => {
            const result = fitParser.validateDecoderOptions(null);

            expect(result.isValid).toBe(true);
            expect(result.validatedOptions).toMatchObject(
                fitParser.getDefaultDecoderOptions()
            );
        });

        it("should get persisted decoder options from state manager", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });

            mockSettingsStateManager.getCategory.mockReturnValue({
                applyScaleAndOffset: false,
            });

            const options = fitParser.getPersistedDecoderOptions();

            expect(mockSettingsStateManager.getCategory).toHaveBeenCalledWith(
                "decoder"
            );
            expect(options.applyScaleAndOffset).toBe(false);
        });

        it("should fail clearly when state manager update throws", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory: vi
                        .fn<MockUpdateCategory>()
                        .mockImplementation(() => {
                            throw new Error("fail");
                        }),
                    getCategory: vi.fn().mockReturnValue(undefined),
                },
            });
            const result = fitParser.updateDecoderOptions({
                applyScaleAndOffset: true,
            });
            expect(result).toStrictEqual({
                errors: ["Failed to update decoder options in state manager"],
                success: false,
            });
        });

        it("should return default decoder options when no state manager is configured", () => {
            fitParser.initializeStateManagement(undefined);
            const options = fitParser.getPersistedDecoderOptions();

            expect(options).toStrictEqual(fitParser.getDefaultDecoderOptions());
        });

        it("should update decoder options in state manager", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });

            const newOptions = { applyScaleAndOffset: false };
            const result = fitParser.updateDecoderOptions(newOptions);

            expect(result.success).toBe(true);
            expect(
                mockSettingsStateManager.updateCategory
            ).toHaveBeenCalledWith(
                "decoder",
                expect.objectContaining({ applyScaleAndOffset: false })
            );
        });

        it("should report state manager update failures without persistence fallback", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory: vi
                        .fn<MockUpdateCategory>()
                        .mockImplementation(() => {
                            throw new Error("update failed");
                        }),
                    getCategory: vi.fn(),
                },
            });
            const result = fitParser.updateDecoderOptions({
                applyScaleAndOffset: false,
            });
            expect(result).toStrictEqual({
                errors: ["Failed to update decoder options in state manager"],
                success: false,
            });
        });

        it("should reject decoder updates when no state manager is configured", () => {
            fitParser.initializeStateManagement(undefined);
            const result = fitParser.updateDecoderOptions({
                applyScaleAndOffset: true,
            });
            expect(result).toStrictEqual({
                errors: ["No settings state manager configured"],
                success: false,
            });
        });

        it("should reject async-looking state manager update failures synchronously", () => {
            const updateCategory = vi
                .fn<() => Promise<never>>()
                .mockRejectedValue(
                    new Error("reject")
                ) as unknown as SettingsStateManager["updateCategory"];

            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory,
                    getCategory: vi.fn(),
                },
            });
            const res = fitParser.updateDecoderOptions({
                applyScaleAndOffset: false,
            });
            expect(res).toStrictEqual({
                errors: ["Settings state manager update must be synchronous"],
                success: false,
            });
        });

        it("should reject decoder updates when state manager collection is empty", () => {
            fitParser.initializeStateManagement({});
            const res = fitParser.updateDecoderOptions({
                applyScaleAndOffset: true,
            });
            expect(res).toStrictEqual({
                errors: ["No settings state manager configured"],
                success: false,
            });
        });

        it("should reject invalid options in update", () => {
            const invalidOptions = { applyScaleAndOffset: "invalid" };
            const result = fitParser.updateDecoderOptions(invalidOptions);

            expect(result.success).toBe(false);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining("applyScaleAndOffset"),
                ])
            );
        });

        it("should get current decoder options", () => {
            const options = fitParser.getCurrentDecoderOptions();
            expect(options).toMatchObject(fitParser.getDefaultDecoderOptions());
        });

        it("should reset decoder options to defaults", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });
            const result = fitParser.resetDecoderOptions();
            expect(result.success).toBe(true);
            expect(result.options).toMatchObject(
                fitParser.getDefaultDecoderOptions()
            );
        });
    });

    describe("FIT File Decoding", () => {
        beforeEach(() => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
                fitFileStateManager: mockFitFileStateManager,
                performanceMonitor: mockPerformanceMonitor,
            });
        });

        it("should successfully decode a valid FIT file", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]); // Mock FIT header

            const result = await fitParser.decodeFitFile(buffer);

            expect(mockFitSDK.Stream.fromBuffer).toHaveBeenCalledWith(buffer);
            expect(mockFitSDK.Decoder).toHaveBeenCalled();
            expect(mockDecoder.checkIntegrity).toHaveBeenCalled();
            expect(mockDecoder.read).toHaveBeenCalled();
            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(100);
            expect(mockFitFileStateManager.handleFileLoaded).toHaveBeenCalled();
            expect(result).toMatchObject({
                activity: [{ sport: "cycling" }],
                record: [
                    expect.objectContaining({
                        heart_rate: 150,
                        timestamp: expect.any(Date),
                    }),
                ],
            });
        });

        it("should handle Uint8Array input", async () => {
            const uint8Array = new Uint8Array([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);

            const result = await fitParser.decodeFitFile(uint8Array);

            expect(mockFitSDK.Stream.fromBuffer).toHaveBeenCalledWith(
                Buffer.from(uint8Array)
            );
            expect(result.activity).toEqual([{ sport: "cycling" }]);
        });

        it("should track progress during decoding", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);

            const result = await fitParser.decodeFitFile(buffer);

            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(10); // Starting
            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(30); // SDK loaded
            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(50); // Integrity check
            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(70); // Starting decode
            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(90); // Applying labels
            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(100); // Complete
            expect(result.record).toHaveLength(1);
        });

        it("should track performance timing", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);

            const result = await fitParser.decodeFitFile(buffer);

            expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith(
                expect.stringMatching(/fitFile_decode_/)
            );
            expect(mockPerformanceMonitor.endTimer).toHaveBeenCalledWith(
                expect.stringMatching(/fitFile_decode_/)
            );
            expect(result.activity).toEqual([{ sport: "cycling" }]);
        });

        it("should use custom decoder options", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            const customOptions = { applyScaleAndOffset: false };

            const result = await fitParser.decodeFitFile(buffer, customOptions);

            expect(mockDecoder.read).toHaveBeenCalledWith(
                expect.objectContaining({ applyScaleAndOffset: false })
            );
            expect(result.record).toHaveLength(1);
        });

        it("should handle invalid input buffer", async () => {
            await expect(fitParser.decodeFitFile(null)).rejects.toThrow(
                "Input is not a valid Buffer or Uint8Array"
            );
            expect(
                mockFitFileStateManager.handleFileLoadingError
            ).toHaveBeenCalled();
        });

        it("should handle integrity check failure", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockDecoder.checkIntegrity.mockReturnValue(false);
            mockDecoder.getIntegrityErrors.mockReturnValue(["CRC mismatch"]);

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toContain("FIT file integrity check failed");
            expect(
                mockFitFileStateManager.handleFileLoadingError
            ).toHaveBeenCalled();
        });

        it("should handle decoding errors", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockDecoder.read.mockReturnValue({
                messages: {},
                errors: ["Invalid message type"],
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toContain("Decoding errors occurred");
            expect(
                mockFitFileStateManager.handleFileLoadingError
            ).toHaveBeenCalled();
        });

        it("should handle empty messages result", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockDecoder.read.mockReturnValue({
                messages: {},
                errors: [],
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toContain("No valid messages decoded");
            expect(
                mockFitFileStateManager.handleFileLoadingError
            ).toHaveBeenCalled();
        });

        it("should handle SDK import failure", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);

            // Mock import failure by providing a mock SDK that throws
            const failingSDK = {
                Decoder: vi.fn(function FailingDecoder() {
                    throw new Error("SDK initialization failed");
                }),
                Stream: mockFitSDK.Stream,
            };

            const result = await fitParser.decodeFitFile(
                buffer,
                {},
                failingSDK
            );

            expect(result.error).toBe("SDK initialization failed");
            expect(
                mockFitFileStateManager.handleFileLoadingError
            ).toHaveBeenCalled();
        });

        it("should handle state manager progress update failures gracefully", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockFitFileStateManager.updateLoadingProgress.mockImplementation(
                () => {
                    throw new Error("State update failed");
                }
            );

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.activity).toEqual([{ sport: "cycling" }]);
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Failed to update loading progress"),
                expect.any(Error)
            );
        });

        it("should handle state manager error update failures gracefully", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockDecoder.checkIntegrity.mockReturnValue(false);
            mockFitFileStateManager.handleFileLoadingError.mockImplementation(
                () => {
                    throw new Error("Error state update failed");
                }
            );

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toContain("FIT file integrity check failed");
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Failed to update error state"),
                expect.any(Error)
            );
        });

        it("should handle generic exceptions", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockFitSDK.Decoder.mockImplementation(function ThrowingDecoder() {
                throw new Error("Unexpected error");
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBe("Unexpected error");
            expect(result.details).toEqual(
                expect.stringContaining("Error: Unexpected error")
            );
            expect(console.error).toHaveBeenCalledWith(
                "[FitParser] Failed to decode file",
                expect.any(Error)
            );
        });

        it("should handle exceptions without message or stack", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockFitSDK.Decoder.mockImplementation(
                function StringErrorDecoder() {
                    throw "String error";
                }
            );

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBe("Failed to decode file");
            expect(result.details).toBeNull();
        });

        it("should handle fitFileStateManager.updateLoadingProgress failure", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            const progressError = new Error("Progress update failed");

            // Setup state manager with failing progress update
            mockFitFileStateManager.updateLoadingProgress.mockImplementation(
                () => {
                    throw progressError;
                }
            );

            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            const result = await fitParser.decodeFitFile(buffer);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[FitParser] Failed to update loading progress:",
                progressError
            );
            expect(result.activity).toEqual([{ sport: "cycling" }]);

            consoleWarnSpy.mockRestore();
        });

        it("should handle state error update failure when no messages decoded", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            const stateError = new Error("State update failed");

            // Mock decoder to return empty messages
            mockDecoder.checkIntegrity.mockReturnValue(true);
            mockDecoder.read.mockReturnValue({}); // Empty messages object

            // Setup state manager with failing error state update
            mockFitFileStateManager.handleFileLoadingError.mockImplementation(
                () => {
                    throw stateError;
                }
            );

            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBe(
                "No valid messages decoded, FIT file might be corrupted."
            );
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[FitParser] Failed to update error state:",
                stateError
            );

            consoleWarnSpy.mockRestore();
        });

        it("should handle state error update failure in generic exception handling", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            const decodingError = new Error("Decoding failed");
            const stateError = new Error("State update failed");

            // Mock decoder to throw error
            mockFitSDK.Decoder.mockImplementation(function FailingDecoder() {
                throw decodingError;
            });

            // Setup state manager with failing error state update
            mockFitFileStateManager.handleFileLoadingError.mockImplementation(
                () => {
                    throw stateError;
                }
            );

            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            const result = await fitParser.decodeFitFile(buffer);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[FitParser] Failed to update error state:",
                stateError
            );
            expect(result.error).toBe("Decoding failed");

            consoleWarnSpy.mockRestore();
        });
    });

    describe("Unknown Message Labels", () => {
        it("should apply unknown message labels", () => {
            const messages = {
                unknown_123: [{ field1: "value1" }],
                activity: [{ sport: "cycling" }],
            };

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result.activity).toEqual([{ sport: "cycling" }]);
            // Unknown messages should be processed
            expect(Object.keys(result)).toContain("unknown_123");
        });

        it("should handle messages without unknown labels", () => {
            const messages = {
                activity: [{ sport: "cycling" }],
                record: [{ timestamp: new Date() }],
            };

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result).toEqual(messages);
        });

        it("should handle empty messages object", () => {
            const messages = {};

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result).toEqual({});
        });

        it("should handle null/undefined messages", () => {
            const result1 = fitParser.applyUnknownMessageLabels(null);
            const result2 = fitParser.applyUnknownMessageLabels(undefined);

            expect(result1).toEqual({});
            expect(result2).toEqual({});
        });
    });

    describe("Schema and Constants", () => {
        it("should have valid decoder options schema", () => {
            const schema = fitParser.DECODER_OPTIONS_SCHEMA;

            expect(Object.keys(schema).sort()).toEqual([
                "applyScaleAndOffset",
                "convertDateTimesToDates",
                "convertTypesToStrings",
                "expandComponents",
                "expandSubFields",
                "includeUnknownData",
                "mergeHeartRates",
            ]);
            expect(schema.applyScaleAndOffset).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
            expect(schema.expandSubFields).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
            expect(schema.expandComponents).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
            expect(schema.convertTypesToStrings).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
            expect(schema.convertDateTimesToDates).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
            expect(schema.includeUnknownData).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
            expect(schema.mergeHeartRates).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle missing integrity check method", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            delete mockDecoder.getIntegrityErrors;
            mockDecoder.checkIntegrity.mockReturnValue(false);

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toContain("No additional details available");
        });

        it("should handle decoder without read method", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            delete mockDecoder.read;

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBe("decoder.read is not a function");
        });

        it("should handle performance monitor timing failures", async () => {
            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockPerformanceMonitor.endTimer.mockImplementation(() => {
                throw new Error("Timer error");
            });

            // Performance monitor errors should be thrown since endTimer is not wrapped in try-catch
            await expect(fitParser.decodeFitFile(buffer)).rejects.toThrow(
                "Timer error"
            );
        });
    });
});

// @vitest-environment node
import type { Mock } from "vitest";
import type {
    DecoderOptions,
    FitFieldValue,
    FitMessages,
} from "../../electron-app/shared/fit";
import type {
    FitFileStateManager,
    FitParserModule,
    PerformanceMonitor,
    SettingsStateManager,
} from "../../electron-app/shared/fitParser";
import type {
    FitSdkReadOptions,
    FitSdkStream,
} from "../../electron-app/shared/fitSdk";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Buffer } from "node:buffer";

type MockFitSdkDecoder = {
    checkIntegrity: Mock<() => boolean>;
    getIntegrityErrors?: Mock<() => FitFieldValue>;
    isFIT: Mock<() => boolean>;
    read?: Mock<
        (options?: FitSdkReadOptions) => {
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
    Decoder: vi.fn<(stream: FitSdkStream) => MockFitSdkDecoder>(),
    Stream: {
        fromBuffer: vi.fn<(buffer: Buffer | Uint8Array) => MockFitSdkStream>(),
    },
};

// Mock references are now handled by the hoisted vi.mock() above

// Mock state managers
const mockSettingsStateManager = {
    getCategory: vi.fn<SettingsStateManager["getCategory"]>(),
    updateCategory: vi.fn<SettingsStateManager["updateCategory"]>(),
};

const mockFitFileStateManager = {
    updateLoadingProgress:
        vi.fn<FitFileStateManager["updateLoadingProgress"]>(),
    handleFileLoadingError:
        vi.fn<FitFileStateManager["handleFileLoadingError"]>(),
    handleFileLoaded: vi.fn<FitFileStateManager["handleFileLoaded"]>(),
    getRecordCount: vi
        .fn<FitFileStateManager["getRecordCount"]>()
        .mockReturnValue(100),
};

const mockPerformanceMonitor = {
    startTimer: vi.fn<PerformanceMonitor["startTimer"]>(),
    endTimer: vi.fn<PerformanceMonitor["endTimer"]>(),
    getOperationTime: vi
        .fn<PerformanceMonitor["getOperationTime"]>()
        .mockReturnValue(1500),
    isEnabled: true,
};

function createExpectedDefaultDecoderOptions(): DecoderOptions {
    return {
        applyScaleAndOffset: true,
        convertDateTimesToDates: true,
        convertTypesToStrings: true,
        expandComponents: true,
        expandSubFields: true,
        includeUnknownData: true,
        mergeHeartRates: true,
    };
}

// Mock modules
vi.mock(import("@garmin/fitsdk"), () => mockFitSDK);

describe("fitParser.js decoder behavior", () => {
    let fitParser: FitParserModule;
    let mockDecoder: MockFitSdkDecoder;
    let mockRecordTimestamp: Date;
    let mockStream: MockFitSdkStream;

    beforeEach(async () => {
        // Reset all mocks
        vi.resetAllMocks();
        mockFitFileStateManager.getRecordCount.mockReturnValue(100);
        mockPerformanceMonitor.getOperationTime.mockReturnValue(1500);
        mockRecordTimestamp = new Date("2024-01-02T03:04:05.000Z");

        // Setup mock decoder
        mockDecoder = {
            checkIntegrity: vi
                .fn<MockFitSdkDecoder["checkIntegrity"]>()
                .mockReturnValue(true),
            getIntegrityErrors: vi
                .fn<NonNullable<MockFitSdkDecoder["getIntegrityErrors"]>>()
                .mockReturnValue([]),
            isFIT: vi.fn<MockFitSdkDecoder["isFIT"]>().mockReturnValue(true),
            read: vi
                .fn<NonNullable<MockFitSdkDecoder["read"]>>()
                .mockReturnValue({
                    messages: {
                        activity: [{ sport: "cycling" }],
                        record: [
                            {
                                heart_rate: 150,
                                timestamp: mockRecordTimestamp,
                            },
                        ],
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
            (await import("../../electron-app/fitParser.js")) as unknown as FitParserModule;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("module exports", () => {
        it("should export all required functions and constants", () => {
            expect.assertions(4);

            expect(Object.keys(fitParser).sort()).toStrictEqual([
                "DECODER_OPTIONS_SCHEMA",
                "FitDecodeError",
                "applyUnknownMessageLabels",
                "decodeFitFile",
                "default",
                "getCurrentDecoderOptions",
                "getDefaultDecoderOptions",
                "getPersistedDecoderOptions",
                "initializeStateManagement",
                "resetDecoderOptions",
                "updateDecoderOptions",
                "validateDecoderOptions",
            ]);
            expect(Object.keys(fitParser).sort()).not.toContain(
                "decodeFitFileWithState"
            );
            expect(
                Object.keys(fitParser.DECODER_OPTIONS_SCHEMA).sort()
            ).toStrictEqual([
                "applyScaleAndOffset",
                "convertDateTimesToDates",
                "convertTypesToStrings",
                "expandComponents",
                "expandSubFields",
                "includeUnknownData",
                "mergeHeartRates",
            ]);
            expect(
                Object.fromEntries(
                    Object.entries(fitParser.DECODER_OPTIONS_SCHEMA).map(
                        ([key, value]) => [key, value.default]
                    )
                )
            ).toStrictEqual(createExpectedDefaultDecoderOptions());
        });
    });

    describe("fit decode error", () => {
        const isoTimestampPattern =
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

        it("should create error with correct properties", () => {
            expect.assertions(6);

            const error = new fitParser.FitDecodeError(
                "Test error",
                { code: "TEST" },
                { source: "test" }
            );

            expect(error.name).toBe("FitDecodeError");
            expect(error.message).toBe("Test error");
            expect(error.details).toStrictEqual({ code: "TEST" });
            expect(error.metadata.category).toBe("fit_parsing");
            expect(error.metadata.source).toBe("test");
            expect(error.metadata.timestamp).toMatch(isoTimestampPattern);
        });

        it("should serialize to JSON correctly", () => {
            expect.assertions(5);

            const error = new fitParser.FitDecodeError("Test error", {
                code: "TEST",
            });
            const json = error.toJSON();

            expect(json.name).toBe("FitDecodeError");
            expect(json.message).toBe("Test error");
            expect(json.details).toStrictEqual({ code: "TEST" });
            expect({
                category: json.metadata.category,
                timestamp: json.metadata.timestamp,
            }).toStrictEqual({
                category: "fit_parsing",
                timestamp: expect.stringMatching(isoTimestampPattern),
            });
            expect(json.stack).toContain("Test error");
        });
    });

    describe("state management integration", () => {
        it("should initialize state management with all managers", () => {
            expect.assertions(3);

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
            expect(fitParser.getPersistedDecoderOptions()).toStrictEqual(
                createExpectedDefaultDecoderOptions()
            );
            expect(console.warn).not.toHaveBeenCalled();
        });

        it("should initialize state management with no managers", () => {
            expect.assertions(2);

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
            expect.assertions(2);

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
            expect(fitParser.getPersistedDecoderOptions()).toStrictEqual({
                ...createExpectedDefaultDecoderOptions(),
                mergeHeartRates: false,
            });
        });
    });

    describe("decoder options management", () => {
        it("should return default decoder options", () => {
            expect.assertions(1);

            const defaults = fitParser.getDefaultDecoderOptions();

            expect(defaults).toStrictEqual(
                createExpectedDefaultDecoderOptions()
            );
        });

        it("should validate valid decoder options", () => {
            expect.assertions(1);

            const options = {
                applyScaleAndOffset: false,
                expandSubFields: true,
            };

            const result = fitParser.validateDecoderOptions(options);

            expect(result).toStrictEqual({
                errors: [],
                isValid: true,
                validatedOptions: {
                    ...createExpectedDefaultDecoderOptions(),
                    applyScaleAndOffset: false,
                },
            });
        });

        it("should handle invalid decoder options", () => {
            expect.assertions(1);

            const options = {
                applyScaleAndOffset: "invalid",
                unknownOption: true,
            };

            const result = fitParser.validateDecoderOptions(options);

            expect(result).toStrictEqual({
                errors: [
                    "applyScaleAndOffset must be of type boolean, got string",
                ],
                isValid: false,
                validatedOptions: createExpectedDefaultDecoderOptions(),
            });
        });

        it("should handle null decoder options", () => {
            expect.assertions(1);

            const result = fitParser.validateDecoderOptions(null);

            expect(result).toStrictEqual({
                errors: [],
                isValid: true,
                validatedOptions: createExpectedDefaultDecoderOptions(),
            });
        });

        it("should get persisted decoder options from state manager", () => {
            expect.assertions(2);

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
            expect(options).toStrictEqual({
                ...createExpectedDefaultDecoderOptions(),
                applyScaleAndOffset: false,
            });
        });

        it("should fail clearly when state manager update throws", () => {
            expect.assertions(1);

            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory: vi
                        .fn<MockUpdateCategory>()
                        .mockImplementation(() => {
                            throw new Error("fail");
                        }),
                    getCategory: vi
                        .fn<SettingsStateManager["getCategory"]>()
                        .mockReturnValue(undefined),
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
            expect.assertions(1);

            fitParser.initializeStateManagement(undefined);
            const options = fitParser.getPersistedDecoderOptions();

            expect(options).toStrictEqual(fitParser.getDefaultDecoderOptions());
        });

        it("should update decoder options in state manager", () => {
            expect.assertions(2);

            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });

            const newOptions = { applyScaleAndOffset: false };
            const result = fitParser.updateDecoderOptions(newOptions);

            expect(result).toStrictEqual({
                options: {
                    ...createExpectedDefaultDecoderOptions(),
                    applyScaleAndOffset: false,
                },
                success: true,
            });
            expect(
                mockSettingsStateManager.updateCategory
            ).toHaveBeenCalledWith("decoder", {
                ...createExpectedDefaultDecoderOptions(),
                applyScaleAndOffset: false,
            });
        });

        it("should report state manager update failures without persistence fallback", () => {
            expect.assertions(1);

            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory: vi
                        .fn<MockUpdateCategory>()
                        .mockImplementation(() => {
                            throw new Error("update failed");
                        }),
                    getCategory: vi.fn<SettingsStateManager["getCategory"]>(),
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
            expect.assertions(1);

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
            expect.assertions(1);

            const updateCategory = vi
                .fn<() => Promise<never>>()
                .mockRejectedValue(
                    new Error("reject")
                ) as unknown as SettingsStateManager["updateCategory"];

            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory,
                    getCategory: vi.fn<SettingsStateManager["getCategory"]>(),
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
            expect.assertions(1);

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
            expect.assertions(1);

            const invalidOptions = { applyScaleAndOffset: "invalid" };
            const result = fitParser.updateDecoderOptions(invalidOptions);

            expect(result).toStrictEqual({
                errors: [
                    "applyScaleAndOffset must be of type boolean, got string",
                ],
                success: false,
            });
        });

        it("should get current decoder options", () => {
            expect.assertions(1);

            const options = fitParser.getCurrentDecoderOptions();
            expect(options).toStrictEqual(
                createExpectedDefaultDecoderOptions()
            );
        });

        it("should reset decoder options to defaults", () => {
            expect.assertions(1);

            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });
            const result = fitParser.resetDecoderOptions();
            expect(result).toStrictEqual({
                options: createExpectedDefaultDecoderOptions(),
                success: true,
            });
        });
    });

    describe("fit file decoding", () => {
        beforeEach(() => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
                fitFileStateManager: mockFitFileStateManager,
                performanceMonitor: mockPerformanceMonitor,
            });
        });

        it("should successfully decode a valid FIT file", async () => {
            expect.assertions(7);

            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]); // Mock FIT header

            const result = await fitParser.decodeFitFile(buffer);

            expect(mockFitSDK.Stream.fromBuffer).toHaveBeenCalledWith(buffer);
            expect(mockFitSDK.Decoder).toHaveBeenCalledWith(mockStream);
            expect(mockDecoder.checkIntegrity).toHaveBeenCalledWith();
            expect(mockDecoder.read).toHaveBeenCalledWith(
                fitParser.getDefaultDecoderOptions()
            );
            expect(
                mockFitFileStateManager.updateLoadingProgress
            ).toHaveBeenCalledWith(100);
            expect(
                mockFitFileStateManager.handleFileLoaded
            ).toHaveBeenCalledWith(
                {
                    messages: {
                        activity: [{ sport: "cycling" }],
                        record: [
                            {
                                heart_rate: 150,
                                timestamp: mockRecordTimestamp,
                            },
                        ],
                    },
                    metadata: {
                        decodingOptions: createExpectedDefaultDecoderOptions(),
                        processingTime: 1500,
                        recordCount: 100,
                    },
                },
                {
                    filePath: null,
                    source: "fitParser.decodeFitFile",
                }
            );
            expect(result).toStrictEqual({
                activity: [{ sport: "cycling" }],
                record: [
                    {
                        heart_rate: 150,
                        timestamp: mockRecordTimestamp,
                    },
                ],
            });
        });

        it("should handle Uint8Array input", async () => {
            expect.assertions(2);

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
            expect(result.activity).toStrictEqual([{ sport: "cycling" }]);
        });

        it("should track progress during decoding", async () => {
            expect.assertions(7);

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
            expect.assertions(3);

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
            expect(result.activity).toStrictEqual([{ sport: "cycling" }]);
        });

        it("should use custom decoder options", async () => {
            expect.assertions(2);

            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            const customOptions = { applyScaleAndOffset: false };

            const result = await fitParser.decodeFitFile(buffer, customOptions);

            expect(mockDecoder.read).toHaveBeenCalledWith({
                ...createExpectedDefaultDecoderOptions(),
                applyScaleAndOffset: false,
            });
            expect(result.record).toHaveLength(1);
        });

        it("should handle invalid input buffer", async () => {
            expect.assertions(2);

            await expect(fitParser.decodeFitFile(null)).rejects.toThrow(
                "Input is not a valid Buffer or Uint8Array"
            );
            const [loadingError] =
                mockFitFileStateManager.handleFileLoadingError.mock.calls[0] ??
                [];
            expect({
                instance: loadingError instanceof fitParser.FitDecodeError,
                message: loadingError?.message,
            }).toStrictEqual({
                instance: true,
                message:
                    "Input is not a valid Buffer or Uint8Array. Received type: object.",
            });
        });

        it("rejects array-shaped FIT SDK stream candidates", async () => {
            expect.assertions(3);

            const originalStream = mockFitSDK.Stream;
            const fromBuffer =
                vi.fn<(buffer: Buffer | Uint8Array) => MockFitSdkStream>();
            mockFitSDK.Stream = Object.assign([], { fromBuffer });
            try {
                const result = await fitParser.decodeFitFile(
                    Buffer.from([
                        0x0e,
                        0x10,
                        0x43,
                        0x08,
                    ])
                );

                expect(result.error).toBe(
                    "Garmin FIT SDK module is missing Decoder or Stream.fromBuffer"
                );
                const [loadingError] =
                    mockFitFileStateManager.handleFileLoadingError.mock
                        .calls[0] ?? [];
                expect(loadingError?.message).toBe(
                    "Garmin FIT SDK module is missing Decoder or Stream.fromBuffer"
                );
                expect(fromBuffer).not.toHaveBeenCalled();
            } finally {
                mockFitSDK.Stream = originalStream;
            }
        });

        it("should handle integrity check failure", async () => {
            expect.assertions(2);

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
            const [loadingError] =
                mockFitFileStateManager.handleFileLoadingError.mock.calls[0] ??
                [];
            expect({
                instance: loadingError instanceof fitParser.FitDecodeError,
                message: loadingError?.message,
            }).toStrictEqual({
                instance: true,
                message:
                    'FIT file integrity check failed. Details: ["CRC mismatch"]',
            });
        });

        it("should handle decoding errors", async () => {
            expect.assertions(2);

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
            const [loadingError] =
                mockFitFileStateManager.handleFileLoadingError.mock.calls[0] ??
                [];
            expect({
                instance: loadingError instanceof fitParser.FitDecodeError,
                message: loadingError?.message,
            }).toStrictEqual({
                instance: true,
                message: "Decoding errors occurred",
            });
        });

        it("should handle empty messages result", async () => {
            expect.assertions(2);

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
            const [loadingError] =
                mockFitFileStateManager.handleFileLoadingError.mock.calls[0] ??
                [];
            expect({
                instance: loadingError instanceof fitParser.FitDecodeError,
                message: loadingError?.message,
            }).toStrictEqual({
                instance: true,
                message:
                    "No valid messages decoded, FIT file might be corrupted.",
            });
        });

        it("should handle SDK import failure", async () => {
            expect.assertions(2);

            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);

            // Mock import failure by providing a mock SDK that throws
            const sdkInitializationError = new Error(
                "SDK initialization failed"
            );
            const failingSDK = {
                Decoder: vi.fn<(stream: FitSdkStream) => MockFitSdkDecoder>(
                    function FailingDecoder() {
                        throw sdkInitializationError;
                    }
                ),
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
            ).toHaveBeenCalledWith(sdkInitializationError);
        });

        it("should handle state manager progress update failures gracefully", async () => {
            expect.assertions(2);

            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            const stateUpdateError = new Error("State update failed");
            mockFitFileStateManager.updateLoadingProgress.mockImplementation(
                () => {
                    throw stateUpdateError;
                }
            );

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.activity).toStrictEqual([{ sport: "cycling" }]);
            expect(console.warn).toHaveBeenCalledWith(
                "[FitParser] Failed to update loading progress:",
                stateUpdateError
            );
        });

        it("should handle state manager error update failures gracefully", async () => {
            expect.assertions(2);

            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            mockDecoder.checkIntegrity.mockReturnValue(false);
            const errorStateUpdateError = new Error(
                "Error state update failed"
            );
            mockFitFileStateManager.handleFileLoadingError.mockImplementation(
                () => {
                    throw errorStateUpdateError;
                }
            );

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toContain("FIT file integrity check failed");
            expect(console.warn).toHaveBeenCalledWith(
                "[FitParser] Failed to update error state:",
                errorStateUpdateError
            );
        });

        it("should handle generic exceptions", async () => {
            expect.assertions(3);

            const buffer = Buffer.from([
                0x0e,
                0x10,
                0x43,
                0x08,
            ]);
            const unexpectedError = new Error("Unexpected error");
            mockFitSDK.Decoder.mockImplementation(function ThrowingDecoder() {
                throw unexpectedError;
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBe("Unexpected error");
            expect(result.details).toBe(unexpectedError.stack);
            expect(console.error).toHaveBeenCalledWith(
                "[FitParser] Failed to decode file",
                unexpectedError
            );
        });

        it("should handle exceptions without message or stack", async () => {
            expect.assertions(2);

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
            expect.assertions(2);

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
            expect(result.activity).toStrictEqual([{ sport: "cycling" }]);

            consoleWarnSpy.mockRestore();
        });

        it("should handle state error update failure when no messages decoded", async () => {
            expect.assertions(2);

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
            expect.assertions(2);

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

    describe("unknown message labels", () => {
        it("should apply unknown message labels", () => {
            expect.assertions(3);

            const timestamp = new Date("2024-01-02T03:04:05.000Z");
            const messages: FitMessages = {
                unknown_104: [
                    {
                        0: 3.71,
                        2: 88,
                        3: 21,
                        4: "ok",
                        253: timestamp,
                    },
                ],
                activity: [{ sport: "cycling" }],
            };

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result.activity).toStrictEqual([{ sport: "cycling" }]);
            expect(result).not.toHaveProperty("unknown_104");
            expect(result["Device Status"]).toStrictEqual([
                {
                    battery_level: 88,
                    battery_voltage: 3.71,
                    field_4: "ok",
                    temperature: 21,
                    timestamp,
                },
            ]);
        });

        it("should apply device status labels from numeric unknown message keys", () => {
            expect.assertions(2);

            const timestamp = new Date("2024-02-03T04:05:06.000Z");
            const messages: FitMessages = {
                "104": [
                    {
                        0: 3.62,
                        2: 74,
                        3: 19,
                        4: "charging",
                        253: timestamp,
                    },
                ],
            };

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result).not.toHaveProperty("104");
            expect(result["Device Status"]).toStrictEqual([
                {
                    battery_level: 74,
                    battery_voltage: 3.62,
                    field_4: "charging",
                    temperature: 19,
                    timestamp,
                },
            ]);
        });

        it("should preserve unmapped unknown message labels", () => {
            expect.assertions(2);

            const messages: FitMessages = {
                unknown_123: [{ field1: "value1" }],
                activity: [{ sport: "cycling" }],
            };

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result).toStrictEqual(messages);
            expect(result).not.toHaveProperty("Device Status");
        });

        it("should handle messages without unknown labels", () => {
            expect.assertions(2);

            const timestamp = new Date("2024-03-04T05:06:07.000Z");
            const messages: FitMessages = {
                activity: [{ sport: "cycling" }],
                record: [{ timestamp }],
            };

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result).toStrictEqual(messages);
            expect(result).not.toHaveProperty("Device Status");
        });

        it("should handle empty messages object", () => {
            expect.assertions(1);

            const messages: FitMessages = {};

            const result = fitParser.applyUnknownMessageLabels(messages);

            expect(result).toStrictEqual({});
        });

        it("should handle null/undefined messages", () => {
            expect.assertions(2);

            const result1 = fitParser.applyUnknownMessageLabels(null);
            const result2 = fitParser.applyUnknownMessageLabels(undefined);

            expect(result1).toStrictEqual({});
            expect(result2).toStrictEqual({});
        });
    });

    describe("schema and constants", () => {
        it("should have valid decoder options schema", () => {
            expect.assertions(9);

            const schema = fitParser.DECODER_OPTIONS_SCHEMA;

            expect(Object.keys(schema).sort()).toStrictEqual([
                "applyScaleAndOffset",
                "convertDateTimesToDates",
                "convertTypesToStrings",
                "expandComponents",
                "expandSubFields",
                "includeUnknownData",
                "mergeHeartRates",
            ]);
            expect(schema.applyScaleAndOffset).toStrictEqual({
                default: true,
                description: "Apply scale and offset transformations",
                type: "boolean",
            });
            expect(schema.expandSubFields).toStrictEqual({
                default: true,
                description: "Expand sub-fields in messages",
                type: "boolean",
            });
            expect(schema.expandComponents).toStrictEqual({
                default: true,
                description: "Expand component fields",
                type: "boolean",
            });
            expect(schema.convertTypesToStrings).toStrictEqual({
                default: true,
                description: "Convert enum types to strings",
                type: "boolean",
            });
            expect(schema.convertDateTimesToDates).toStrictEqual({
                default: true,
                description: "Convert timestamps to Date objects",
                type: "boolean",
            });
            expect(schema.includeUnknownData).toStrictEqual({
                default: true,
                description: "Include unknown message types",
                type: "boolean",
            });
            expect(schema.mergeHeartRates).toStrictEqual({
                default: true,
                description: "Merge heart rate data from multiple sources",
                type: "boolean",
            });
            expect(schema).not.toHaveProperty("decodeEverything");
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle missing integrity check method", async () => {
            expect.assertions(1);

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
            expect.assertions(1);

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
            expect.assertions(1);

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

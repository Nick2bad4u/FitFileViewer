/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";
import { Buffer } from "buffer";

// Shared mock instances
let mockConf = {
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    has: vi.fn().mockReturnValue(false),
    delete: vi.fn(),
    clear: vi.fn(),
    onDidChange: vi.fn(),
    onDidAnyChange: vi.fn(),
    path: "/mock/path/settings.json",
    size: 0,
    store: {},
};

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

describe("fitParser.js - Comprehensive Coverage", () => {
    let fitParser: any;
    let mockDecoder: any;
    let mockStream: any;

    beforeEach(async () => {
        // Reset all mocks
        vi.resetAllMocks();

        // Use dynamic mocking to ensure electron and electron-conf are mocked before fitParser import
        vi.doMock("electron", () => ({
            app: {
                getPath: vi.fn((name: string) => {
                    const paths = {
                        userData: "/mock/path/userData",
                        appData: "/mock/path/appData",
                        temp: "/mock/path/temp",
                        desktop: "/mock/path/desktop",
                        documents: "/mock/path/documents",
                        downloads: "/mock/path/downloads",
                        music: "/mock/path/music",
                        pictures: "/mock/path/pictures",
                        videos: "/mock/path/videos",
                        home: "/mock/path/home",
                    };
                    return (paths as Record<string, string>)[name] || `/mock/path/${name}`;
                }),
                isPackaged: false,
                getVersion: vi.fn(() => "1.0.0"),
                getName: vi.fn(() => "FitFileViewer"),
                on: vi.fn(),
                whenReady: vi.fn(() => Promise.resolve()),
                quit: vi.fn(),
            },
        }));

        // Primary mock via vi.doMock
        vi.doMock("electron-conf", () => {
            const ConfMock = vi.fn(function ConfMockCtor() {
                return mockConf;
            });
            return { Conf: ConfMock };
        });

        // Hard guarantee: inject mock into Node's require cache so CJS require() sees it
        try {
            const req = createRequire(import.meta.url);
            const resolved = req.resolve("electron-conf");
            // Minimal export shape expected by fitParser.getConf()
            const ConfMock = vi.fn(function ConfMockCtor() {
                return mockConf;
            });
            (req as any).cache[resolved] = {
                id: resolved,
                filename: resolved,
                loaded: true,
                exports: { Conf: ConfMock },
            } as any;
        } catch {
            // ignore if resolution fails; vi.doMock fallback should handle it
        }

        // Setup mock decoder
        mockDecoder = {
            checkIntegrity: vi.fn().mockReturnValue(true),
            getIntegrityErrors: vi.fn().mockReturnValue([]),
            read: vi.fn().mockReturnValue({
                messages: {
                    activity: [{ sport: "cycling" }],
                    record: [{ timestamp: new Date(), heart_rate: 150 }],
                },
                errors: [],
            }),
        };

        mockStream = {
            buffer: Buffer.from([1, 2, 3, 4]),
        };

        mockFitSDK.Decoder.mockImplementation(function MockDecoder() {
            return mockDecoder;
        });
        mockFitSDK.Stream.fromBuffer.mockReturnValue(mockStream);

        // Setup default conf behavior
        mockConf.get.mockImplementation((key, defaultValue) => defaultValue);

        // Clear console spies
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});

        // Import the module after setting up mocks
        fitParser = await import("../../fitParser.js");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Module Exports", () => {
        it("should export all required functions and constants", () => {
            expect(fitParser.decodeFitFile).toBeDefined();
            expect(fitParser.FitDecodeError).toBeDefined();
            expect(fitParser.applyUnknownMessageLabels).toBeDefined();
            expect(fitParser.initializeStateManagement).toBeDefined();
            expect(fitParser.updateDecoderOptions).toBeDefined();
            expect(fitParser.getCurrentDecoderOptions).toBeDefined();
            expect(fitParser.resetDecoderOptions).toBeDefined();
            expect(fitParser.getPersistedDecoderOptions).toBeDefined();
            expect(fitParser.getDefaultDecoderOptions).toBeDefined();
            expect(fitParser.validateDecoderOptions).toBeDefined();
            expect(fitParser.DECODER_OPTIONS_SCHEMA).toBeDefined();
        });
    });

    describe("FitDecodeError", () => {
        it("should create error with correct properties", () => {
            const error = new fitParser.FitDecodeError("Test error", { code: "TEST" }, { source: "test" });

            expect(error.name).toBe("FitDecodeError");
            expect(error.message).toBe("Test error");
            expect(error.details).toEqual({ code: "TEST" });
            expect(error.metadata.category).toBe("fit_parsing");
            expect(error.metadata.source).toBe("test");
            expect(error.metadata.timestamp).toBeDefined();
        });

        it("should serialize to JSON correctly", () => {
            const error = new fitParser.FitDecodeError("Test error", { code: "TEST" });
            const json = error.toJSON();

            expect(json.name).toBe("FitDecodeError");
            expect(json.message).toBe("Test error");
            expect(json.details).toEqual({ code: "TEST" });
            expect(json.metadata).toBeDefined();
            expect(json.stack).toBeDefined();
        });
    });

    describe("State Management Integration", () => {
        it("should initialize state management with all managers", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
                fitFileStateManager: mockFitFileStateManager,
                performanceMonitor: mockPerformanceMonitor,
            });

            expect(console.log).toHaveBeenCalledWith("[FitParser] State management initialized", {
                hasSettings: true,
                hasFitFileState: true,
                hasPerformanceMonitor: true,
            });
        });

        it("should initialize state management with no managers", () => {
            fitParser.initializeStateManagement();

            expect(console.log).toHaveBeenCalledWith("[FitParser] State management initialized", {
                hasSettings: false,
                hasFitFileState: false,
                hasPerformanceMonitor: false,
            });
        });

        it("should initialize state management with partial managers", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });

            expect(console.log).toHaveBeenCalledWith("[FitParser] State management initialized", {
                hasSettings: true,
                hasFitFileState: false,
                hasPerformanceMonitor: false,
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
            expect(result.validatedOptions).toBeDefined();
        });

        it("should handle null decoder options", () => {
            const result = fitParser.validateDecoderOptions(null);

            expect(result.isValid).toBe(true);
            expect(result.validatedOptions).toMatchObject(fitParser.getDefaultDecoderOptions());
        });

        it("should get persisted decoder options from state manager", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });

            mockSettingsStateManager.getCategory.mockReturnValue({
                applyScaleAndOffset: false,
            });

            const options = fitParser.getPersistedDecoderOptions();

            expect(mockSettingsStateManager.getCategory).toHaveBeenCalledWith("decoder");
            expect(options.applyScaleAndOffset).toBe(false);
        });

        it("should fallback to electron-conf when state manager fails (smoke)", async () => {
            // Arrange: ensure state manager update throws, electron-conf present
            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory: vi.fn().mockImplementation(() => {
                        throw new Error("fail");
                    }),
                    getCategory: vi.fn().mockReturnValue(undefined),
                },
            } as any);
            // Force import of electron-conf mock from earlier doMock in beforeEach
            const { Conf } = await import("electron-conf");
            expect(Conf).toBeDefined();
            const result = fitParser.updateDecoderOptions({ applyScaleAndOffset: true });
            expect(result.success).toBe(true);
        });

        it("should get persisted decoder options from electron-conf when no state manager (smoke)", async () => {
            // Arrange: no state manager
            fitParser.initializeStateManagement(undefined as any);
            const { Conf } = await import("electron-conf");
            expect(Conf).toBeDefined();
            const options = fitParser.getPersistedDecoderOptions();
            // Should be defined (falls back to defaults if none persisted)
            expect(options).toBeDefined();
        });

        it("should update decoder options in state manager", () => {
            fitParser.initializeStateManagement({
                settingsStateManager: mockSettingsStateManager,
            });

            const newOptions = { applyScaleAndOffset: false };
            const result = fitParser.updateDecoderOptions(newOptions);

            expect(result.success).toBe(true);
            expect(mockSettingsStateManager.updateCategory).toHaveBeenCalledWith(
                "decoder",
                expect.objectContaining({ applyScaleAndOffset: false })
            );
        });

        it("should fallback to electron-conf when state manager update fails (smoke)", async () => {
            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory: vi.fn().mockImplementation(() => {
                        throw new Error("update failed");
                    }),
                    getCategory: vi.fn(),
                },
            } as any);
            const { Conf } = await import("electron-conf");
            expect(Conf).toBeDefined();
            const result = fitParser.updateDecoderOptions({ applyScaleAndOffset: false });
            expect(result.success).toBe(true);
        });

        it("should update decoder options in electron-conf when no state manager (smoke)", async () => {
            fitParser.initializeStateManagement(undefined as any);
            const { Conf } = await import("electron-conf");
            expect(Conf).toBeDefined();
            const result = fitParser.updateDecoderOptions({ applyScaleAndOffset: true });
            expect(result.success).toBe(true);
        });

        it("should handle settings state manager update failure and fallback to electron-conf (smoke)", async () => {
            fitParser.initializeStateManagement({
                settingsStateManager: {
                    updateCategory: vi.fn().mockRejectedValue(new Error("reject")),
                    getCategory: vi.fn(),
                },
            } as any);
            const res = fitParser.updateDecoderOptions({ applyScaleAndOffset: false });
            expect(res.success).toBe(true);
        });

        it("should use electron-conf directly when no settings state manager (smoke)", async () => {
            fitParser.initializeStateManagement({} as any);
            const res = fitParser.updateDecoderOptions({ applyScaleAndOffset: true });
            expect(res.success).toBe(true);
        });

        it("should reject invalid options in update", () => {
            const invalidOptions = { applyScaleAndOffset: "invalid" };
            const result = fitParser.updateDecoderOptions(invalidOptions);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should get current decoder options", () => {
            const options = fitParser.getCurrentDecoderOptions();
            expect(options).toBeDefined();
            expect(typeof options).toBe("object");
        });

        it("should reset decoder options to defaults", () => {
            const result = fitParser.resetDecoderOptions();
            expect(result.success).toBe(true);
            expect(result.options).toMatchObject(fitParser.getDefaultDecoderOptions());
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
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]); // Mock FIT header

            const result = await fitParser.decodeFitFile(buffer);

            expect(mockFitSDK.Stream.fromBuffer).toHaveBeenCalledWith(buffer);
            expect(mockFitSDK.Decoder).toHaveBeenCalled();
            expect(mockDecoder.checkIntegrity).toHaveBeenCalled();
            expect(mockDecoder.read).toHaveBeenCalled();
            expect(mockFitFileStateManager.updateLoadingProgress).toHaveBeenCalledWith(100);
            expect(mockFitFileStateManager.handleFileLoaded).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.activity).toBeDefined();
        });

        it("should handle Uint8Array input", async () => {
            const uint8Array = new Uint8Array([0x0e, 0x10, 0x43, 0x08]);

            const result = await fitParser.decodeFitFile(uint8Array);

            expect(mockFitSDK.Stream.fromBuffer).toHaveBeenCalledWith(Buffer.from(uint8Array));
            expect(result).toBeDefined();
        });

        it("should track progress during decoding", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);

            await fitParser.decodeFitFile(buffer);

            expect(mockFitFileStateManager.updateLoadingProgress).toHaveBeenCalledWith(10); // Starting
            expect(mockFitFileStateManager.updateLoadingProgress).toHaveBeenCalledWith(30); // SDK loaded
            expect(mockFitFileStateManager.updateLoadingProgress).toHaveBeenCalledWith(50); // Integrity check
            expect(mockFitFileStateManager.updateLoadingProgress).toHaveBeenCalledWith(70); // Starting decode
            expect(mockFitFileStateManager.updateLoadingProgress).toHaveBeenCalledWith(90); // Applying labels
            expect(mockFitFileStateManager.updateLoadingProgress).toHaveBeenCalledWith(100); // Complete
        });

        it("should track performance timing", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);

            await fitParser.decodeFitFile(buffer);

            expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith(expect.stringMatching(/fitFile_decode_/));
            expect(mockPerformanceMonitor.endTimer).toHaveBeenCalledWith(expect.stringMatching(/fitFile_decode_/));
        });

        it("should use custom decoder options", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            const customOptions = { applyScaleAndOffset: false };

            await fitParser.decodeFitFile(buffer, customOptions);

            expect(mockDecoder.read).toHaveBeenCalledWith(expect.objectContaining({ applyScaleAndOffset: false }));
        });

        it("should handle invalid input buffer", async () => {
            await expect(fitParser.decodeFitFile(null)).rejects.toThrow("Input is not a valid Buffer or Uint8Array");
            expect(mockFitFileStateManager.handleFileLoadingError).toHaveBeenCalled();
        });

        it("should handle integrity check failure", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockDecoder.checkIntegrity.mockReturnValue(false);
            mockDecoder.getIntegrityErrors.mockReturnValue(["CRC mismatch"]);

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBeDefined();
            expect(result.error).toContain("FIT file integrity check failed");
            expect(mockFitFileStateManager.handleFileLoadingError).toHaveBeenCalled();
        });

        it("should handle decoding errors", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockDecoder.read.mockReturnValue({
                messages: {},
                errors: ["Invalid message type"],
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBeDefined();
            expect(result.error).toContain("Decoding errors occurred");
            expect(mockFitFileStateManager.handleFileLoadingError).toHaveBeenCalled();
        });

        it("should handle empty messages result", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockDecoder.read.mockReturnValue({
                messages: {},
                errors: [],
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBeDefined();
            expect(result.error).toContain("No valid messages decoded");
            expect(mockFitFileStateManager.handleFileLoadingError).toHaveBeenCalled();
        });

        it("should handle SDK import failure", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);

            // Mock import failure by providing a mock SDK that throws
            const failingSDK = {
                Decoder: vi.fn(function FailingDecoder() {
                    throw new Error("SDK initialization failed");
                }),
                Stream: mockFitSDK.Stream,
            };

            const result = await fitParser.decodeFitFile(buffer, {}, failingSDK);

            expect(result.error).toBeDefined();
            expect(mockFitFileStateManager.handleFileLoadingError).toHaveBeenCalled();
        });

        it("should handle state manager progress update failures gracefully", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockFitFileStateManager.updateLoadingProgress.mockImplementation(() => {
                throw new Error("State update failed");
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result).toBeDefined();
            expect(result.activity).toBeDefined(); // Should still succeed
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Failed to update loading progress"),
                expect.any(Error)
            );
        });

        it("should handle state manager error update failures gracefully", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockDecoder.checkIntegrity.mockReturnValue(false);
            mockFitFileStateManager.handleFileLoadingError.mockImplementation(() => {
                throw new Error("Error state update failed");
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBeDefined();
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining("Failed to update error state"),
                expect.any(Error)
            );
        });

        it("should handle generic exceptions", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockFitSDK.Decoder.mockImplementation(function ThrowingDecoder() {
                throw new Error("Unexpected error");
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBeDefined();
            expect(result.details).toBeDefined();
            expect(console.error).toHaveBeenCalledWith("[FitParser] Failed to decode file", expect.any(Error));
        });

        it("should handle exceptions without message or stack", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockFitSDK.Decoder.mockImplementation(function StringErrorDecoder() {
                throw "String error";
            });

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBe("Failed to decode file");
            expect(result.details).toBeNull();
        });

        it("should handle fitFileStateManager.updateLoadingProgress failure", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            const progressError = new Error("Progress update failed");

            // Setup state manager with failing progress update
            mockFitFileStateManager.updateLoadingProgress.mockImplementation(() => {
                throw progressError;
            });

            const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const result = await fitParser.decodeFitFile(buffer);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[FitParser] Failed to update loading progress:",
                progressError
            );
            expect(result).toBeDefined(); // Should still process successfully

            consoleWarnSpy.mockRestore();
        });

        it("should handle state error update failure when no messages decoded", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            const stateError = new Error("State update failed");

            // Mock decoder to return empty messages
            mockDecoder.checkIntegrity.mockReturnValue(true);
            mockDecoder.read.mockReturnValue({}); // Empty messages object

            // Setup state manager with failing error state update
            mockFitFileStateManager.handleFileLoadingError.mockImplementation(() => {
                throw stateError;
            });

            const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBe("No valid messages decoded, FIT file might be corrupted.");
            expect(consoleWarnSpy).toHaveBeenCalledWith("[FitParser] Failed to update error state:", stateError);

            consoleWarnSpy.mockRestore();
        });

        it("should handle state error update failure in generic exception handling", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            const decodingError = new Error("Decoding failed");
            const stateError = new Error("State update failed");

            // Mock decoder to throw error
            mockFitSDK.Decoder.mockImplementation(function FailingDecoder() {
                throw decodingError;
            });

            // Setup state manager with failing error state update
            mockFitFileStateManager.handleFileLoadingError.mockImplementation(() => {
                throw stateError;
            });

            const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

            const result = await fitParser.decodeFitFile(buffer);

            expect(consoleWarnSpy).toHaveBeenCalledWith("[FitParser] Failed to update error state:", stateError);
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

            expect(result).toBeDefined();
            expect(result.activity).toBeDefined();
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

            expect(schema).toBeDefined();
            expect(schema.applyScaleAndOffset).toMatchObject({
                type: "boolean",
                default: true,
                description: expect.any(String),
            });
            expect(schema.expandSubFields).toBeDefined();
            expect(schema.expandComponents).toBeDefined();
            expect(schema.convertTypesToStrings).toBeDefined();
            expect(schema.convertDateTimesToDates).toBeDefined();
            expect(schema.includeUnknownData).toBeDefined();
            expect(schema.mergeHeartRates).toBeDefined();
        });
    });

    describe("Edge Cases and Error Handling", () => {
        it("should handle missing integrity check method", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            delete mockDecoder.getIntegrityErrors;
            mockDecoder.checkIntegrity.mockReturnValue(false);

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toContain("No additional details available");
        });

        it("should handle decoder without read method", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            delete mockDecoder.read;

            const result = await fitParser.decodeFitFile(buffer);

            expect(result.error).toBeDefined();
        });

        it("should handle performance monitor timing failures", async () => {
            const buffer = Buffer.from([0x0e, 0x10, 0x43, 0x08]);
            mockPerformanceMonitor.endTimer.mockImplementation(() => {
                throw new Error("Timer error");
            });

            // Performance monitor errors should be thrown since endTimer is not wrapped in try-catch
            await expect(fitParser.decodeFitFile(buffer)).rejects.toThrow("Timer error");
        });
    });
});

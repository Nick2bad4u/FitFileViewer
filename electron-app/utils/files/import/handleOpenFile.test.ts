/**
 * Comprehensive test suite for handleOpenFile.js Tests file opening logic with
 * Electron API integration, error handling, and state management
 */

import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    beforeAll,
    vi,
} from "vitest";
import { AppActions } from "../../app/lifecycle/appActions.js";
import type { RendererElectronApiScope } from "../../runtime/electronApiRuntime.js";

const renderDecodedFitDataMock = vi.hoisted(() =>
    vi.fn<(data: unknown, filePath: string) => Promise<void>>(async () => {})
);
const sendFitFileToAltFitReaderMock = vi.hoisted(() =>
    vi.fn<(buffer: ArrayBuffer) => void>()
);

vi.mock("../../rendering/core/loadShowFitData.js", () => ({
    renderDecodedFitData: renderDecodedFitDataMock,
}));
vi.mock("./sendFitFileToAltFitReader.js", () => ({
    sendFitFileToAltFitReader: sendFitFileToAltFitReaderMock,
}));

type HandleOpenFileModule = Awaited<typeof import("./handleOpenFile.js")>;
type HandleOpenFileParams = Parameters<
    HandleOpenFileModule["handleOpenFile"]
>[0];
type HandleOpenFileOptions = Parameters<
    HandleOpenFileModule["handleOpenFile"]
>[1];
type HandleOpenFileShowNotification = NonNullable<
    HandleOpenFileParams["showNotification"]
>;
type ValidateElectronAPI = HandleOpenFileModule["validateElectronAPI"];

interface MockElectronAPI {
    openFile: ReturnType<typeof vi.fn<() => Promise<null | string | string[]>>>;
    parseFitFile: ReturnType<
        typeof vi.fn<(arrayBuffer: ArrayBuffer) => Promise<unknown>>
    >;
    readFile: ReturnType<
        typeof vi.fn<(filePath: string) => Promise<ArrayBuffer>>
    >;
}

// Import the module to test and spy on its public app-state integration.
let handleOpenFileModule: HandleOpenFileModule;
let mockSetState: ReturnType<typeof vi.spyOn>;
beforeAll(async () => {
    handleOpenFileModule = await import("./handleOpenFile.js");
    mockSetState = vi.spyOn(AppActions, "setFileOpening");
});

// Mock console methods
let mockConsoleLog: ReturnType<typeof vi.spyOn>;
let mockConsoleInfo: ReturnType<typeof vi.spyOn>;
let mockConsoleWarn: ReturnType<typeof vi.spyOn>;
let mockConsoleError: ReturnType<typeof vi.spyOn>;

// Mock Electron API
const mockElectronAPI = {
    openFile: vi.fn<() => Promise<null | string | string[]>>(),
    readFile: vi.fn<(filePath: string) => Promise<ArrayBuffer>>(),
    parseFitFile: vi.fn<(arrayBuffer: ArrayBuffer) => Promise<unknown>>(),
};

let currentElectronApi: MockElectronAPI | undefined = mockElectronAPI;

Object.defineProperty(global, "window", {
    value: {},
    writable: true,
});

// Test setup
let mockShowNotification: ReturnType<typeof vi.fn>;
let mockSetLoading: ReturnType<typeof vi.fn>;

function createElectronApiScope(
    api: MockElectronAPI | undefined = currentElectronApi
): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function getElectronAPI(): MockElectronAPI {
    if (!currentElectronApi) {
        throw new TypeError("Expected Electron API fixture to be configured");
    }

    return currentElectronApi;
}

async function callHandleOpenFile(
    params: HandleOpenFileParams,
    options: HandleOpenFileOptions = {}
): Promise<boolean> {
    return handleOpenFileModule.handleOpenFile(params, {
        electronApiScope: createElectronApiScope(),
        ...options,
    });
}

function callValidateElectronAPI(
    validateElectronAPI: ValidateElectronAPI
): boolean {
    return validateElectronAPI(createElectronApiScope());
}

beforeEach(() => {
    // Reset all mocks including the setState spy
    mockSetState.mockReset();

    renderDecodedFitDataMock.mockReset();
    renderDecodedFitDataMock.mockResolvedValue(undefined);
    sendFitFileToAltFitReaderMock.mockReset();

    currentElectronApi = { ...mockElectronAPI };

    // Setup mock functions
    mockShowNotification = vi.fn();
    mockSetLoading = vi.fn();

    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    vi.clearAllTimers();
    mockConsoleLog.mockRestore();
    mockConsoleInfo.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
});

describe("handleOpenFile.js", () => {
    describe("logWithContext", () => {
        it("should log info messages with prefix", () => {
            const { logWithContext } = handleOpenFileModule;

            expect(() => logWithContext("Test message")).not.toThrow();

            expect(console.info).toHaveBeenCalledWith(
                expect.stringMatching(
                    /\[renderer\] HandleOpenFile: Test message$/
                )
            );
            expect(console.log).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        it("should log warning messages with prefix", () => {
            const { logWithContext } = handleOpenFileModule;

            expect(() =>
                logWithContext("Warning message", "warn")
            ).not.toThrow();

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringMatching(
                    /\[renderer\] HandleOpenFile: Warning message$/
                )
            );
            expect(console.log).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        it("should log error messages with prefix", () => {
            const { logWithContext } = handleOpenFileModule;

            expect(() =>
                logWithContext("Error message", "error")
            ).not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                expect.stringMatching(
                    /\[renderer\] HandleOpenFile: Error message$/
                )
            );
            expect(console.log).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
        });

        it("should handle logging errors gracefully", () => {
            const { logWithContext } = handleOpenFileModule;

            mockConsoleLog.mockImplementationOnce(() => {
                throw new Error("Console error");
            });

            // Should not throw
            expect(() => logWithContext("Test")).not.toThrow();
        });
    });

    describe("validateElectronAPI", () => {
        it("should return false when Electron API is not available", () => {
            currentElectronApi = undefined;

            const { validateElectronAPI } = handleOpenFileModule;

            const result = callValidateElectronAPI(validateElectronAPI);

            expect(result).toBe(false);
        });

        it("should return false when required methods are missing", () => {
            currentElectronApi = {
                openFile: vi.fn<() => Promise<null | string | string[]>>(),
            } as unknown as MockElectronAPI;

            const { validateElectronAPI } = handleOpenFileModule;

            const result = callValidateElectronAPI(validateElectronAPI);

            expect(result).toBe(false);
        });

        it("should return false when methods are not functions", () => {
            currentElectronApi = {
                openFile: "not a function",
                readFile: vi.fn(),
                parseFitFile: vi.fn(),
            } as unknown as MockElectronAPI;

            const { validateElectronAPI } = handleOpenFileModule;

            const result = callValidateElectronAPI(validateElectronAPI);

            expect(result).toBe(false);
        });

        it("should return true when all required methods are available", () => {
            currentElectronApi = {
                openFile: vi.fn(),
                readFile: vi.fn(),
                parseFitFile: vi.fn(),
            };

            const { validateElectronAPI } = handleOpenFileModule;

            const result = callValidateElectronAPI(validateElectronAPI);

            expect(result).toBe(true);
        });
    });

    describe("updateUIState", () => {
        it("should update button disabled state", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(uiElements.openFileBtn.disabled).toBe(true);
        });

        it("should call setLoading function", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(uiElements.openFileBtn.disabled).toBe(true);
            expect(mockSetLoading).toHaveBeenCalledWith(true);
        });

        it("should update isOpeningFileRef value", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(uiElements.isOpeningFileRef.value).toBe(true);
        });

        it("should update all UI state surfaces", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(uiElements.openFileBtn.disabled).toBe(true);
            expect(mockSetLoading).toHaveBeenCalledWith(true);
            expect(uiElements.isOpeningFileRef.value).toBe(true);
        });

        it("should handle errors gracefully", () => {
            const { updateUIState } = handleOpenFileModule;

            // Mock setState to throw
            mockSetState.mockImplementation(() => {
                throw new Error("State error");
            });

            const uiElements = {
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            expect(() => updateUIState(uiElements, true, true)).not.toThrow();
        });
    });

    describe("handleOpenFile - Parameter Validation", () => {
        it("should return false when showNotification is not a function", async () => {
            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification:
                    "not a function" as unknown as HandleOpenFileShowNotification,
            });

            expect(result).toBe(false);
            expect(getElectronAPI().openFile).not.toHaveBeenCalled();
        });

        it("should prevent concurrent file opening operations", async () => {
            // Set isOpeningFile to true
            const isOpeningFileRef = { value: true };

            const result = await callHandleOpenFile({
                isOpeningFileRef,
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "File opening is already in progress. Please wait.",
                "warning"
            );
        });
    });

    describe("handleOpenFile - Electron API Validation", () => {
        it("should return false when Electron API is not available", async () => {
            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
        });

        it("should return false when required API methods are missing", async () => {
            currentElectronApi = {
                openFile: vi.fn<() => Promise<null | string | string[]>>(),
            } as unknown as MockElectronAPI;

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
        });
    });

    describe("handleOpenFile - File Dialog Operations", () => {
        it("should handle file dialog errors", async () => {
            getElectronAPI().openFile.mockRejectedValue(
                new Error("Dialog error")
            );

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Unable to open the file dialog. Please try again. Error details: Dialog error",
                "error"
            );
        });

        it("should handle user cancelling file dialog", async () => {
            getElectronAPI().openFile.mockResolvedValue(null); // User cancelled

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });
    });

    describe("handleOpenFile - File Reading", () => {
        it("should handle file read errors", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockRejectedValue(
                new Error("Read error")
            );

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error reading file: Read error",
                "error"
            );
            expect(getElectronAPI().parseFitFile).not.toHaveBeenCalled();
        });

        it("should handle empty files when validation is enabled", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(0)); // Empty file

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Selected file appears to be empty",
                "error"
            );
        });

        it("should skip file size validation when disabled", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(0)); // Empty file
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await callHandleOpenFile(
                {
                    isOpeningFileRef: { value: false },
                    openFileBtn: { disabled: false },
                    setLoading: mockSetLoading,
                    showNotification: mockShowNotification,
                },
                { validateFileSize: false }
            );

            expect(result).toBe(true);
            expect(renderDecodedFitDataMock).toHaveBeenCalled();
        });
    });

    describe("handleOpenFile - File Parsing", () => {
        it("should handle parsing errors", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockRejectedValue(
                new Error("Parse error")
            );

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error parsing FIT file: Parse error",
                "error"
            );
        });

        it("should handle parsing result with error", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: false,
                error: "Invalid FIT format",
            });

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error: Invalid FIT format",
                "error"
            );
        });
    });

    describe("handleOpenFile - Success Path", () => {
        it("should successfully process file and call display functions", async () => {
            const mockFitData = { sessions: [], laps: [] };
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: mockFitData,
            });

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(renderDecodedFitDataMock).toHaveBeenCalledWith(
                mockFitData,
                "/path/to/file.fit"
            );
            // Implementation passes the ArrayBuffer contents to the alternate reader
            expect(sendFitFileToAltFitReaderMock).toHaveBeenCalledWith(
                expect.any(ArrayBuffer)
            );
        });

        it("should handle display function errors gracefully", async () => {
            const mockFitData = { sessions: [], laps: [] };
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: mockFitData,
            });

            renderDecodedFitDataMock.mockRejectedValueOnce(
                new Error("Display error")
            );

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true); // Should still succeed
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error displaying FIT data: Display error",
                "error"
            );
            expect(sendFitFileToAltFitReaderMock).not.toHaveBeenCalled();
        });

        it("should handle array file paths", async () => {
            const mockFitData = { sessions: [], laps: [] };
            getElectronAPI().openFile.mockResolvedValue(["/path/to/file.fit"]);
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: mockFitData,
            });

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(getElectronAPI().readFile).toHaveBeenCalledWith(
                "/path/to/file.fit"
            );
        });

        it("should reset opening state in finally block", async () => {
            getElectronAPI().openFile.mockRejectedValue(
                new Error("Dialog error")
            );

            const isOpeningFileRef = { value: false };

            await callHandleOpenFile({
                isOpeningFileRef,
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(isOpeningFileRef.value).toBe(false);
        });
    });

    describe("handleOpenFile - Configuration Options", () => {
        it("should use default timeout configuration", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it("should accept custom configuration options", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await callHandleOpenFile(
                {
                    isOpeningFileRef: { value: false },
                    openFileBtn: { disabled: false },
                    setLoading: mockSetLoading,
                    showNotification: mockShowNotification,
                },
                { validateFileSize: false, timeout: 10000 }
            );

            expect(result).toBe(true);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });
    });

    describe("handleOpenFile - Logging and Debug", () => {
        it("should log file selection", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(console.info).toHaveBeenCalledWith(
                expect.stringMatching(
                    /\[renderer\] HandleOpenFile: File selected$/
                ),
                JSON.stringify({ filePath: "/path/to/file.fit" })
            );
        });

        it("should log successful file read", async () => {
            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(console.info).toHaveBeenCalledWith(
                expect.stringMatching(
                    /\[renderer\] HandleOpenFile: File read successfully$/
                ),
                JSON.stringify({ bytes: 100 })
            );
        });

        it("should log debug information in development", async () => {
            // Mock process.env.NODE_ENV
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";

            getElectronAPI().openFile.mockResolvedValue("/path/to/file.fit");
            getElectronAPI().readFile.mockResolvedValue(new ArrayBuffer(100));
            getElectronAPI().parseFitFile.mockResolvedValue({
                success: true,
                data: { sessions: [{}] },
            });

            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith(
                "[HandleOpenFile] Debug: Parsed FIT data contains 1 sessions"
            );
            expect(mockShowNotification).not.toHaveBeenCalled();

            // Restore environment
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe("logWithContext error handling", () => {
        it("should handle console method errors gracefully", () => {
            const { logWithContext } = handleOpenFileModule;

            mockConsoleLog.mockImplementationOnce(() => {
                throw new Error("Console error");
            });

            // Should not throw despite console error
            expect(() => {
                logWithContext("test message", "info");
            }).not.toThrow();
        });
    });

    describe("updateUIState console logging and state management", () => {
        it("should log UI state changes and update UI elements", () => {
            // Clear the mock before the test and re-import to get fresh functions
            mockSetState.mockClear();
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false },
                setLoading: vi.fn(),
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            // Verify UI elements are updated correctly
            expect(console.info).toHaveBeenCalledWith(
                expect.stringMatching(
                    /\[renderer\] HandleOpenFile: Updated UI state$/
                ),
                JSON.stringify({ isLoading: true, isOpening: true })
            );
            expect(uiElements.openFileBtn.disabled).toBe(true);
            expect(uiElements.setLoading).toHaveBeenCalledWith(true);
            expect(uiElements.isOpeningFileRef.value).toBe(true);
        });

        it("should handle errors gracefully", () => {
            // Create a setLoading function that throws
            const errorFn = vi.fn().mockImplementation(() => {
                throw new Error("UI error");
            });

            // Re-import to get fresh functions
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false },
                setLoading: errorFn,
                isOpeningFileRef: { value: false },
            };

            // Should not throw despite error in setLoading
            expect(() => {
                updateUIState(uiElements, true, true);
            }).not.toThrow();

            // Verify error was logged
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe("handleOpenFile parameter validation", () => {
        it("should return false when showNotification is not a function", async () => {
            const result = await callHandleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: vi.fn(),
                showNotification:
                    "not a function" as unknown as HandleOpenFileShowNotification,
            });

            expect(result).toBe(false);
            expect(getElectronAPI().openFile).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(
                expect.stringMatching(
                    /\[renderer\] HandleOpenFile: showNotification function is required$/
                )
            );
        });
    });
});

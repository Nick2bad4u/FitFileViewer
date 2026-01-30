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

// Import the module to test (and use its exposed stateManager for spying)
let handleOpenFileModule: any;
let mockSetState: ReturnType<typeof vi.spyOn>;
beforeAll(async () => {
    handleOpenFileModule = await import("./handleOpenFile.js");
    mockSetState = vi.spyOn(
        handleOpenFileModule.__TEST_ONLY_exposedStateManager,
        "setState"
    );
});

// Mock console methods
const mockConsoleLog = vi.spyOn(console, "log");
const mockConsoleWarn = vi.spyOn(console, "warn");
const mockConsoleError = vi.spyOn(console, "error");

// Mock window.electronAPI
const mockElectronAPI = {
    openFile: vi.fn(),
    readFile: vi.fn(),
    parseFitFile: vi.fn(),
};

const mockWindow = {
    electronAPI: mockElectronAPI,
    showFitData: vi.fn(),
    sendFitFileToAltFitReader: vi.fn(),
} as any;

Object.defineProperty(global, "window", {
    value: mockWindow,
    writable: true,
});

// Test setup
let mockShowNotification: ReturnType<typeof vi.fn>;
let mockSetLoading: ReturnType<typeof vi.fn>;

// Mock console methods globally
const originalConsole = { ...console };
beforeEach(() => {
    // Reset all mocks including the setState spy
    mockSetState.mockReset();

    // Clear console mocks
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();

    // Reset window.electronAPI and map to globalThis for modules using globalThis.electronAPI
    mockWindow.electronAPI = { ...mockElectronAPI };
    (globalThis as any).electronAPI = mockWindow.electronAPI;

    // Map display helpers used by handleOpenFile to globalThis as implementation checks globalThis
    (globalThis as any).showFitData = mockWindow.showFitData;
    (globalThis as any).sendFitFileToAltFitReader =
        mockWindow.sendFitFileToAltFitReader;

    // Setup mock functions
    mockShowNotification = vi.fn();
    mockSetLoading = vi.fn();

    // Mock console methods for each test
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
});

afterEach(() => {
    vi.clearAllTimers();
    // Restore original console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
});

describe("handleOpenFile.js", () => {
    describe("logWithContext", () => {
        it("should log info messages with prefix", () => {
            const { logWithContext } = handleOpenFileModule;

            logWithContext("Test message");

            expect(console.log).toHaveBeenCalledWith(
                "[HandleOpenFile] Test message"
            );
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        it("should log warning messages with prefix", () => {
            const { logWithContext } = handleOpenFileModule;

            logWithContext("Warning message", "warn");

            expect(console.warn).toHaveBeenCalledWith(
                "[HandleOpenFile] Warning message"
            );
            expect(console.log).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });

        it("should log error messages with prefix", () => {
            const { logWithContext } = handleOpenFileModule;

            logWithContext("Error message", "error");

            expect(console.error).toHaveBeenCalledWith(
                "[HandleOpenFile] Error message"
            );
            expect(console.log).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
        });

        it("should handle logging errors gracefully", () => {
            const { logWithContext } = handleOpenFileModule;

            // Mock console.log to throw
            const originalLog = console.log;
            console.log = vi.fn(() => {
                throw new Error("Console error");
            });

            // Should not throw
            expect(() => logWithContext("Test")).not.toThrow();

            // Restore console.log
            console.log = originalLog;
        });
    });

    describe("validateElectronAPI", () => {
        it("should return false when window.electronAPI is not available", () => {
            delete mockWindow.electronAPI;
            delete (globalThis as any).electronAPI;

            const { validateElectronAPI } = handleOpenFileModule;

            const result = validateElectronAPI();

            expect(result).toBe(false);
        });

        it("should return false when required methods are missing", () => {
            mockWindow.electronAPI = { openFile: vi.fn() } as any; // Missing readFile and parseFitFile
            (globalThis as any).electronAPI = mockWindow.electronAPI;

            const { validateElectronAPI } = handleOpenFileModule;

            const result = validateElectronAPI();

            expect(result).toBe(false);
        });

        it("should return false when methods are not functions", () => {
            mockWindow.electronAPI = {
                openFile: "not a function",
                readFile: vi.fn(),
                parseFitFile: vi.fn(),
            } as any;
            (globalThis as any).electronAPI = mockWindow.electronAPI;

            const { validateElectronAPI } = handleOpenFileModule;

            const result = validateElectronAPI();

            expect(result).toBe(false);
        });

        it("should return true when all required methods are available", () => {
            mockWindow.electronAPI = {
                openFile: vi.fn(),
                readFile: vi.fn(),
                parseFitFile: vi.fn(),
            };
            (globalThis as any).electronAPI = mockWindow.electronAPI;

            const { validateElectronAPI } = handleOpenFileModule;

            const result = validateElectronAPI();

            expect(result).toBe(true);
        });
    });

    describe("updateUIState", () => {
        it("should update button disabled state", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(uiElements.openFileBtn.disabled).toBe(true);
        });

        it("should call setLoading function", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(mockSetLoading).toHaveBeenCalledWith(true);
        });

        it("should update isOpeningFileRef value", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(uiElements.isOpeningFileRef.value).toBe(true);
        });

        it("should call setState for UI state management", () => {
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            updateUIState(uiElements, true, true);

            expect(mockSetState).toHaveBeenCalledWith(
                "ui.isOpeningFile",
                true,
                { source: "handleOpenFile" }
            );
            expect(mockSetState).toHaveBeenCalledWith("ui.isLoading", true, {
                source: "handleOpenFile",
            });
        });

        it("should handle errors gracefully", () => {
            const { updateUIState } = handleOpenFileModule;

            // Mock setState to throw
            mockSetState.mockImplementation(() => {
                throw new Error("State error");
            });

            const uiElements = {
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                isOpeningFileRef: { value: false },
            };

            expect(() => updateUIState(uiElements, true, true)).not.toThrow();
        });
    });

    describe("handleOpenFile - Parameter Validation", () => {
        it("should return false when showNotification is not a function", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: "not a function" as any,
            });

            expect(result).toBe(false);
        });

        it("should prevent concurrent file opening operations", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            // Set isOpeningFile to true
            const isOpeningFileRef = { value: true };

            const result = await handleOpenFile({
                isOpeningFileRef,
                openFileBtn: { disabled: false } as any,
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
            const { handleOpenFile } = handleOpenFileModule;

            delete mockWindow.electronAPI;

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
        });

        it("should return false when required API methods are missing", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI = { openFile: vi.fn() } as any;

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
        });
    });

    describe("handleOpenFile - File Dialog Operations", () => {
        it("should handle file dialog errors", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockRejectedValue(
                new Error("Dialog error")
            );

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Unable to open the file dialog. Please try again. Error details: Error: Dialog error",
                "error"
            );
        });

        it("should handle user cancelling file dialog", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(null); // User cancelled

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });
    });

    describe("handleOpenFile - File Reading", () => {
        it("should handle file read errors", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockRejectedValue(
                new Error("Read error")
            );

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error reading file: Error: Read error",
                "error"
            );
        });

        it("should handle empty files when validation is enabled", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(0)
            ); // Empty file

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
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
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(0)
            ); // Empty file
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await handleOpenFile(
                {
                    isOpeningFileRef: { value: false },
                    openFileBtn: { disabled: false } as any,
                    setLoading: mockSetLoading,
                    showNotification: mockShowNotification,
                },
                { validateFileSize: false }
            );

            expect(result).toBe(true);
            expect(mockWindow.showFitData).toHaveBeenCalled();
        });
    });

    describe("handleOpenFile - File Parsing", () => {
        it("should handle parsing errors", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockRejectedValue(
                new Error("Parse error")
            );

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error parsing FIT file: Error: Parse error",
                "error"
            );
        });

        it("should handle parsing result with error", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: false,
                error: "Invalid FIT format",
            });

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error: Invalid FIT format\n",
                "error"
            );
        });
    });

    describe("handleOpenFile - Success Path", () => {
        it("should successfully process file and call display functions", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            const mockFitData = { sessions: [], laps: [] };
            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: mockFitData,
            });

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(mockWindow.showFitData).toHaveBeenCalledWith(
                mockFitData,
                "/path/to/file.fit"
            );
            // Implementation passes the ArrayBuffer contents to the alternate reader
            expect(mockWindow.sendFitFileToAltFitReader).toHaveBeenCalledWith(
                expect.any(ArrayBuffer)
            );
        });

        it("should handle display function errors gracefully", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            const mockFitData = { sessions: [], laps: [] };
            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: mockFitData,
            });

            // Mock showFitData to throw
            mockWindow.showFitData.mockImplementation(() => {
                throw new Error("Display error");
            });

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true); // Should still succeed
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Error displaying FIT data: Error: Display error",
                "error"
            );
        });

        it("should handle array file paths", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            const mockFitData = { sessions: [], laps: [] };
            mockWindow.electronAPI.openFile.mockResolvedValue([
                "/path/to/file.fit",
            ]);
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: mockFitData,
            });

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
            expect(mockWindow.electronAPI.readFile).toHaveBeenCalledWith(
                "/path/to/file.fit"
            );
        });

        it("should reset opening state in finally block", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockRejectedValue(
                new Error("Dialog error")
            );

            const isOpeningFileRef = { value: false };

            await handleOpenFile({
                isOpeningFileRef,
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(isOpeningFileRef.value).toBe(false);
        });
    });

    describe("handleOpenFile - Configuration Options", () => {
        it("should use default timeout configuration", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(result).toBe(true);
        });

        it("should accept custom configuration options", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            const result = await handleOpenFile(
                {
                    isOpeningFileRef: { value: false },
                    openFileBtn: { disabled: false } as any,
                    setLoading: mockSetLoading,
                    showNotification: mockShowNotification,
                },
                { validateFileSize: false, timeout: 10000 }
            );

            expect(result).toBe(true);
        });
    });

    describe("handleOpenFile - Logging and Debug", () => {
        it("should log file selection", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(console.log).toHaveBeenCalledWith(
                "[HandleOpenFile] File selected: /path/to/file.fit"
            );
        });

        it("should log successful file read", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: {},
            });

            await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(console.log).toHaveBeenCalledWith(
                "[HandleOpenFile] File read successfully: 100 bytes"
            );
        });

        it("should log debug information in development", async () => {
            const { handleOpenFile } = handleOpenFileModule;

            // Mock process.env.NODE_ENV
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";

            mockWindow.electronAPI.openFile.mockResolvedValue(
                "/path/to/file.fit"
            );
            mockWindow.electronAPI.readFile.mockResolvedValue(
                new ArrayBuffer(100)
            );
            mockWindow.electronAPI.parseFitFile.mockResolvedValue({
                success: true,
                data: { sessions: [{}] },
            });

            await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: mockSetLoading,
                showNotification: mockShowNotification,
            });

            expect(console.log).toHaveBeenCalledWith(
                "[HandleOpenFile] Debug: Parsed FIT data contains 1 sessions"
            );

            // Restore environment
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe("logWithContext error handling", () => {
        it("should handle console method errors gracefully", () => {
            const { logWithContext } = handleOpenFileModule;

            // Mock console.log to throw an error
            const originalConsoleLog = console.log;
            console.log = vi.fn(() => {
                throw new Error("Console error");
            });

            // Should not throw despite console error
            expect(() => {
                logWithContext("test message", "info");
            }).not.toThrow();

            // Restore console.log
            console.log = originalConsoleLog;
        });
    });

    describe("updateUIState console logging and state management", () => {
        it("should log UI state changes and update UI elements", () => {
            // Clear the mock before the test and re-import to get fresh functions
            mockSetState.mockClear();
            const { updateUIState } = handleOpenFileModule;

            const uiElements = {
                openFileBtn: { disabled: false } as any,
                setLoading: vi.fn(),
                isOpeningFileRef: { value: false } as any,
            };

            updateUIState(uiElements, true, true);

            // Verify UI elements are updated correctly
            expect(console.log).toHaveBeenCalledWith(
                "[HandleOpenFile] Setting isLoading=true, app.isOpeningFile=true"
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
                openFileBtn: { disabled: false } as any,
                setLoading: errorFn,
                isOpeningFileRef: { value: false } as any,
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
            const { handleOpenFile } = handleOpenFileModule;

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false } as any,
                setLoading: vi.fn(),
                showNotification: "not a function", // Invalid
            });

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith(
                "[HandleOpenFile] showNotification function is required"
            );
        });
    });
});

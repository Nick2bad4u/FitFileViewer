import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as getThemeColorsModule from "../../../../../utils/charts/theming/getThemeColors.js";
import { createElevationProfileButton } from "../../../../../utils/ui/controls/createElevationProfileButton.js";

// Create a spy on getThemeColors that will be used in all tests
vi.spyOn(getThemeColorsModule, "getThemeColors").mockReturnValue({
    primary: "#3b82f6",
    background: "#f8fafc",
    surface: "#ffffff",
    shadowLight: "rgba(0,0,0,0.1)",
    shadowMedium: "rgba(0,0,0,0.15)",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    primaryShadow: "rgba(59,130,246,0.25)",
});

describe("createElevationProfileButton", () => {
    let originalWindow: any;
    let openSpy: any;

    beforeEach(() => {
        // Store original window properties
        originalWindow = { ...window };

        // Mock document.createElement
        document.body.innerHTML = "";
        document.body.classList.remove("theme-dark");

        // Setup window.open spy
        openSpy = vi.spyOn(window, "open").mockImplementation(() => {
            // Create a mock window object with document.write and document.close
            return {
                document: {
                    write: vi.fn(),
                    close: vi.fn(),
                },
            } as any;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Reset window properties
        Object.keys(window).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(originalWindow, key)) {
                delete (window as any)[key];
            }
        });
    });

    it("should create a button with correct properties", () => {
        // Create the button
        const button = createElevationProfileButton();

        // Check button properties
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.className).toBe("map-action-btn");
        expect(button.title).toBe("Show Elevation Profile");
        expect(button.innerHTML).toContain('<svg class="icon"');
        expect(button.innerHTML).toContain("<span>Elevation</span>");
    });

    it("should open a window with no files when clicked and no fit files are loaded", () => {
        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called with correct parameters
        expect(openSpy).toHaveBeenCalledWith("", "Elevation Profile", "width=900,height=600");

        // Verify document.write was called (with empty files array in HTML)
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        expect(mockWin.document.write.mock.calls[0][0]).toContain("const fitFiles = []");
        expect(mockWin.document.close).toHaveBeenCalled();
    });

    it("should handle loadedFitFiles when available", () => {
        // Mock window.loadedFitFiles with test data
        (window as any).loadedFitFiles = [
            {
                filePath: "test-file.fit",
                data: {
                    recordMesgs: [
                        { positionLat: 1, positionLong: 2, altitude: 100 },
                        { positionLat: 3, positionLong: 4, altitude: 200 },
                    ],
                },
            },
        ];

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called with correct data
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("test-file.fit");
        expect(writtenHtml).toContain("altitude");
    });

    it("should handle globalData when no loadedFitFiles available", () => {
        // Mock window.globalData with test data
        (window as any).globalData = {
            cachedFilePath: "global-test.fit",
            recordMesgs: [
                { positionLat: 5, positionLong: 6, altitude: 300 },
                { positionLat: 7, positionLong: 8, altitude: 400 },
            ],
        };

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called with correct data
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("global-test.fit");
    });

    it("should handle globalData without recordMesgs", () => {
        // Mock window.globalData without recordMesgs array
        (window as any).globalData = {
            cachedFilePath: "incomplete-data.fit",
            // No recordMesgs array
        };

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();

        // The current implementation only shows files with recordMesgs array
        // If globalData doesn't have recordMesgs, it won't be included
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        // Since there are no fitFiles in this case, we should have "0 file" in the header
        expect(writtenHtml).toContain('<span style="font-size:1.1em;opacity:0.7;">0 file');
        expect(writtenHtml).toContain("const fitFiles = []");
    });
    it("should handle popup window being blocked", () => {
        // Make window.open return null to simulate blocked popup
        openSpy.mockReturnValueOnce(null);

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Nothing should happen (function returns early)
    });

    it("should adapt to dark theme", () => {
        // Set dark theme
        document.body.classList.add("theme-dark");

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called with dark theme
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain('class="theme-dark"');
        expect(writtenHtml).toContain("const isDark = true");
    });

    it("should handle files without altitude data", () => {
        // Mock window.loadedFitFiles with a file that has no altitude data
        (window as any).loadedFitFiles = [
            {
                filePath: "no-altitude.fit",
                data: {
                    recordMesgs: [], // Empty array = no altitude data
                },
            },
        ];

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify document.write was called with code for handling no data
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("altitudes");
        expect(writtenHtml).toContain("no-altitude.fit");
    });

    it("should use chartOverlayColorPalette from window.opener when available", () => {
        // Mock window.loadedFitFiles with test data
        (window as any).loadedFitFiles = [
            {
                filePath: "test-with-colors.fit",
                data: {
                    recordMesgs: [{ positionLat: 1, positionLong: 2, altitude: 100 }],
                },
            },
        ];

        // Setup window.opener with chartOverlayColorPalette
        (window as any).opener = {
            chartOverlayColorPalette: ["#ff0000", "#00ff00", "#0000ff"],
        };

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify document.write was called with color from chartOverlayColorPalette
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("#ff0000"); // First color from the palette
        expect(writtenHtml).toContain("test-with-colors.fit");

        // Clean up the mock
        delete (window as any).opener;
    });

    it("should handle a mix of files with and without altitude data", () => {
        // Mock window.loadedFitFiles with mix of files with and without altitude data
        (window as any).loadedFitFiles = [
            {
                filePath: "with-altitude.fit",
                data: {
                    recordMesgs: [
                        { positionLat: 1, positionLong: 2, altitude: 100 },
                        { positionLat: 3, positionLong: 4, altitude: 200 },
                    ],
                },
            },
            {
                filePath: "without-altitude.fit",
                data: {
                    recordMesgs: [], // No altitude data
                },
            },
            {
                filePath: "partial-data.fit",
                data: {
                    recordMesgs: [
                        { positionLat: null, positionLong: null, altitude: 300 }, // Missing position data
                        { positionLat: 5, positionLong: 6 }, // Missing altitude
                    ],
                },
            },
        ];

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify document.write was called with appropriate HTML
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("with-altitude.fit");
        expect(writtenHtml).toContain("without-altitude.fit");
        expect(writtenHtml).toContain("partial-data.fit");
        expect(writtenHtml).toContain("3 files");
    });
});

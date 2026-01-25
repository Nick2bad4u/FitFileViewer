// Hoist mocks BEFORE any imports so Vitest applies them to static imports
// Use global `vi` (globals enabled) to avoid needing the import first
vi.mock("../../../utils/ui/components/createSettingsHeader.js", () => ({
    showChartSelectionModal: vi.fn(),
}));

vi.mock("../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

vi.mock("../../../utils/charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: vi.fn(() => "light"),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Import modules as namespaces to allow spying regardless of mock wiring
import * as Notifications from "../../../utils/ui/notifications/showNotification.js";
import * as ThemeUtils from "../../../utils/charts/theming/chartThemeUtils.js";

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

// Mock global objects
Object.defineProperty(global, "localStorage", {
    value: localStorageMock,
    writable: true,
});

// Mock ClipboardItem for clipboard tests
global.ClipboardItem = class MockClipboardItem {
    constructor(data: Record<string, string | Blob | PromiseLike<string | Blob>>) {
        this.data = data;
    }

    static supports(type: string): boolean {
        return true;
    }

    data: Record<string, string | Blob | PromiseLike<string | Blob>>;
} as any;

// Set up DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
    url: "http://localhost",
    pretendToBeVisual: true,
    resources: "usable",
});

global.document = dom.window.document;
global.window = dom.window as any;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;

describe("exportUtils.js - Basic Test Coverage", () => {
    let exportUtils: any;
    let mockChart: any;
    let mockCanvas: any;
    let mockContext: any;
    let notifySpy: any;
    let detectThemeSpy: any;

    beforeEach(async () => {
        // Clear all mocks
        vi.clearAllMocks();
        localStorageMock.getItem.mockClear();

        // Import the module after mocks are set up
        const module = await import("../../../utils/files/export/exportUtils.js");
        exportUtils = module.exportUtils;
        // Fresh spies each test; defaults: detectTheme -> 'light'
        notifySpy = vi.fn(async () => undefined);
        detectThemeSpy = vi.fn(() => "light");
        if (typeof module.__setTestDeps === "function") {
            module.__setTestDeps({
                showNotification: notifySpy,
                detectCurrentTheme: detectThemeSpy,
            });
        }

        // Create mock chart and canvas with proper width/height tracking
        let canvasWidth = 800;
        let canvasHeight = 400;

        mockCanvas = {
            get width() {
                return canvasWidth;
            },
            set width(value) {
                canvasWidth = value;
            },
            get height() {
                return canvasHeight;
            },
            set height(value) {
                canvasHeight = value;
            },
            toDataURL: vi.fn(() => "data:image/png;base64,mockdata"),
            getContext: vi.fn(() => mockContext),
        };

        mockContext = {
            fillStyle: "",
            fillRect: vi.fn(),
            drawImage: vi.fn(),
        };

        mockChart = {
            canvas: mockCanvas,
            data: { datasets: [] },
            options: {},
            toBase64Image: vi.fn(() => "data:image/png;base64,mockdata"),
            update: vi.fn(),
            destroy: vi.fn(),
        };

        // Reset canvas mock
        mockCanvas.getContext = vi.fn(() => mockContext);

        // Mock document methods
        document.createElement = vi.fn((tagName: string) => {
            if (tagName === "canvas") {
                return mockCanvas;
            } else if (tagName === "a") {
                return {
                    download: "",
                    href: "",
                    click: vi.fn(),
                };
            }
            return {};
        }) as any;

        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
    });

    afterEach(() => {
        vi.resetAllMocks();
        // Ensure per-test Electron API mocks never leak across cases.
        delete (globalThis as any).electronAPI;
    });

    describe("isValidChart function", () => {
        it("should return false for null chart", () => {
            const result = exportUtils.isValidChart(null);
            expect(result).toBe(false);
        });

        it("should return false for undefined chart", () => {
            const result = exportUtils.isValidChart(undefined);
            expect(result).toBe(false);
        });

        it("should return false for chart without canvas", () => {
            const invalidChart = { data: {}, options: {} };
            const result = exportUtils.isValidChart(invalidChart);
            expect(result).toBe(false);
        });

        it("should return false for chart with canvas but no dimensions", () => {
            const invalidChart = {
                canvas: { width: 0, height: 0 },
            };
            const result = exportUtils.isValidChart(invalidChart);
            expect(result).toBe(false);
        });

        it("should return true for valid chart", () => {
            const result = exportUtils.isValidChart(mockChart);
            expect(result).toBe(true);
        });

        it("should return false for chart with invalid canvas width", () => {
            const invalidChart = {
                canvas: { width: 0, height: 400 },
            };
            const result = exportUtils.isValidChart(invalidChart);
            expect(result).toBe(false);
        });

        it("should return false for chart with invalid canvas height", () => {
            const invalidChart = {
                canvas: { width: 800, height: 0 },
            };
            const result = exportUtils.isValidChart(invalidChart);
            expect(result).toBe(false);
        });
    });

    describe("getExportThemeBackground function", () => {
        it("should return light background when no theme is set", () => {
            localStorageMock.getItem.mockReturnValue(null);
            const result = exportUtils.getExportThemeBackground();
            expect(result).toBe("#ffffff");
        });

        it("should return dark background for dark theme", () => {
            localStorageMock.getItem.mockReturnValue("dark");
            const result = exportUtils.getExportThemeBackground();
            expect(result).toBe("#1a1a1a");
        });

        it("should return light background for light theme", () => {
            localStorageMock.getItem.mockReturnValue("light");
            const result = exportUtils.getExportThemeBackground();
            expect(result).toBe("#ffffff");
        });

        it("should return transparent background for transparent theme", () => {
            localStorageMock.getItem.mockReturnValue("transparent");
            const result = exportUtils.getExportThemeBackground();
            expect(result).toBe("transparent");
        });

        it("should handle auto theme by detecting current theme", () => {
            localStorageMock.getItem.mockReturnValue("auto");
            detectThemeSpy.mockReturnValue("dark");

            const result = exportUtils.getExportThemeBackground();
            expect(result).toBe("#1a1a1a");
        });

        it("should handle auto theme correctly by using detectCurrentTheme result", () => {
            localStorageMock.getItem.mockReturnValue("auto");
            detectThemeSpy.mockReturnValue("light");

            const result = exportUtils.getExportThemeBackground();
            expect(result).toBe("#ffffff");
        });

        it("should fallback to light for unknown theme values", () => {
            localStorageMock.getItem.mockReturnValue("unknown-theme");
            const result = exportUtils.getExportThemeBackground();
            expect(result).toBe("#ffffff");
        });
    });

    describe("downloadChartAsPNG function", () => {
        it("should download chart with default filename", async () => {
            const mockLink = {
                download: "",
                href: "",
                click: vi.fn(),
            };
            document.createElement = vi.fn(() => mockLink) as any;

            await exportUtils.downloadChartAsPNG(mockChart);

            expect(mockLink.download).toBe("chart.png");
            expect(mockLink.href).toBe("data:image/png;base64,mockdata");
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should download chart with custom filename", async () => {
            const mockLink = {
                download: "",
                href: "",
                click: vi.fn(),
            };
            document.createElement = vi.fn(() => mockLink) as any;

            await exportUtils.downloadChartAsPNG(mockChart, "custom-chart.png");

            expect(mockLink.download).toBe("custom-chart.png");
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should handle download errors gracefully", async () => {
            const mockChart = {
                toBase64Image: vi.fn(() => {
                    throw new Error("Canvas error");
                }),
            };

            await exportUtils.downloadChartAsPNG(mockChart);

            expect(notifySpy).toHaveBeenCalledWith("Failed to export chart as PNG", "error");
        });
    });

    describe("createCombinedChartsImage function", () => {
        it("should throw error for empty charts array", async () => {
            await exportUtils.createCombinedChartsImage([]);

            expect(notifySpy).toHaveBeenCalledWith("Failed to create combined image", "error");
        });

        it("should throw error for null charts parameter", async () => {
            await exportUtils.createCombinedChartsImage(null);

            expect(notifySpy).toHaveBeenCalledWith("Failed to create combined image", "error");
        });

        it("should create combined image for single chart", async () => {
            const mockCombinedCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => mockContext),
                toDataURL: vi.fn(() => "data:image/png;base64,combined"),
            };

            const mockLink = {
                download: "",
                href: "",
                click: vi.fn(),
            };

            document.createElement = vi.fn((tagName: string) => {
                if (tagName === "canvas") {
                    return mockCombinedCanvas;
                } else if (tagName === "a") {
                    return mockLink;
                }
                return {};
            }) as any;

            await exportUtils.createCombinedChartsImage([mockChart]);

            expect(mockCombinedCanvas.width).toBe(800);
            expect(mockCombinedCanvas.height).toBe(400);
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should create combined image for multiple charts", async () => {
            // Create a mock canvas that properly tracks width/height assignments
            let canvasWidth = 0;
            let canvasHeight = 0;

            const mockCombinedCanvas = {
                get width() {
                    return canvasWidth;
                },
                set width(value) {
                    canvasWidth = value;
                },
                get height() {
                    return canvasHeight;
                },
                set height(value) {
                    canvasHeight = value;
                },
                getContext: vi.fn(() => mockContext),
                toDataURL: vi.fn(() => "data:image/png;base64,combined"),
            };

            const mockLink = {
                download: "",
                href: "",
                click: vi.fn(),
            };

            let canvasCallCount = 0;
            document.createElement = vi.fn((tagName: string) => {
                if (tagName === "canvas") {
                    canvasCallCount++;
                    if (canvasCallCount === 1) {
                        // Return the combined canvas for the first call
                        return mockCombinedCanvas;
                    } else {
                        // Return a separate temporary canvas for each chart
                        return {
                            width: 800,
                            height: 400,
                            getContext: vi.fn(() => mockContext),
                            toDataURL: vi.fn(() => "data:image/png;base64,temp"),
                        };
                    }
                } else if (tagName === "a") {
                    return mockLink;
                }
                return {};
            }) as any;

            const charts = [mockChart, mockChart, mockChart, mockChart]; // 4 charts = 2x2 grid

            await exportUtils.createCombinedChartsImage(charts);

            // 2 cols * 800 width + 1 * 20 padding = 1620
            expect(mockCombinedCanvas.width).toBe(1620);
            // 2 rows * 400 height + 1 * 20 padding = 820
            expect(mockCombinedCanvas.height).toBe(820);
        });

        it("should handle canvas context creation failure", async () => {
            const mockCombinedCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => null),
                toDataURL: vi.fn(() => "data:image/png;base64,combined"),
            };

            document.createElement = vi.fn(() => mockCombinedCanvas) as any;

            await exportUtils.createCombinedChartsImage([mockChart]);

            expect(notifySpy).toHaveBeenCalledWith("Failed to create combined image", "error");
        });
    });

    describe("copyChartToClipboard function", () => {
        it("should copy valid chart to clipboard", async () => {
            // Mock navigator.clipboard
            const mockWriteBuffer = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(global, "navigator", {
                value: {
                    clipboard: {
                        write: mockWriteBuffer,
                    },
                },
                writable: true,
                configurable: true,
            });

            await exportUtils.copyChartToClipboard(mockChart);

            expect(notifySpy).toHaveBeenCalledWith("Chart copied to clipboard", "success");
        });

        it("should handle invalid chart gracefully", async () => {
            await exportUtils.copyChartToClipboard(null);

            expect(notifySpy).toHaveBeenCalledWith(
                expect.stringContaining("Failed to copy chart to clipboard"),
                "error"
            );
        });

        it("should handle clipboard write failure", async () => {
            // Prefer Electron clipboard bridge (CSP/permission-safe)
            (globalThis as any).electronAPI = {
                writeClipboardPngDataUrl: vi.fn(() => false),
            };

            // Mock browser Clipboard API failure as the fallback path.
            const mockWriteBuffer = vi.fn().mockRejectedValue(new Error("Permission denied"));
            Object.defineProperty(global, "navigator", {
                value: {
                    clipboard: {
                        write: mockWriteBuffer,
                    },
                },
                writable: true,
                configurable: true,
            });

            await exportUtils.copyChartToClipboard(mockChart);

            // Electron bridge attempted first
            expect((globalThis as any).electronAPI.writeClipboardPngDataUrl).toHaveBeenCalledWith(
                "data:image/png;base64,mockdata"
            );

            // Both Electron + browser clipboard failed => error notification
            expect(notifySpy).toHaveBeenCalledWith("Failed to copy chart to clipboard", "error");
        });
    });

    describe("copyCombinedChartsToClipboard function", () => {
        beforeEach(() => {
            // Mock navigator.clipboard
            Object.defineProperty(global, "navigator", {
                value: {
                    clipboard: {
                        write: vi.fn().mockResolvedValue(undefined),
                    },
                },
                writable: true,
                configurable: true,
            });
        });

        it("should handle empty charts array", async () => {
            await exportUtils.copyCombinedChartsToClipboard([]);

            expect(notifySpy).toHaveBeenCalledWith("Failed to copy combined charts to clipboard", "error");
        });

        it("should handle null charts parameter", async () => {
            await exportUtils.copyCombinedChartsToClipboard(null);

            expect(notifySpy).toHaveBeenCalledWith("Failed to copy combined charts to clipboard", "error");
        });

        it("should copy combined charts successfully", async () => {
            (globalThis as any).electronAPI = {
                writeClipboardPngDataUrl: vi.fn(() => true),
            };

            const mockCombinedCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => mockContext),
                toDataURL: vi.fn(() => "data:image/png;base64,combined"),
                toBlob: vi.fn((callback: any) => {
                    const mockBlob = new Blob(["mock"], { type: "image/png" });
                    callback(mockBlob);
                }),
            };

            document.createElement = vi.fn(() => mockCombinedCanvas) as any;

            await exportUtils.copyCombinedChartsToClipboard([mockChart]);

            expect((globalThis as any).electronAPI.writeClipboardPngDataUrl).toHaveBeenCalledWith(
                "data:image/png;base64,combined"
            );
            expect(notifySpy).toHaveBeenCalledWith("Combined charts copied to clipboard", "success");
        });
    });

    describe("Error handling and edge cases", () => {
        it("should handle missing canvas context in combined charts", async () => {
            const mockCombinedCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => null),
            };

            document.createElement = vi.fn(() => mockCombinedCanvas) as any;

            await exportUtils.createCombinedChartsImage([mockChart]);

            expect(notifySpy).toHaveBeenCalledWith("Failed to create combined image", "error");
        });

        it("should handle transparent background in combined charts", async () => {
            localStorageMock.getItem.mockReturnValue("transparent");

            const mockCombinedCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => mockContext),
                toDataURL: vi.fn(() => "data:image/png;base64,combined"),
            };

            const mockLink = {
                download: "",
                href: "",
                click: vi.fn(),
            };

            document.createElement = vi.fn((tagName: string) => {
                if (tagName === "canvas") {
                    return mockCombinedCanvas;
                } else if (tagName === "a") {
                    return mockLink;
                }
                return {};
            }) as any;

            await exportUtils.createCombinedChartsImage([mockChart]);

            // Should not call fillRect for transparent background
            expect(mockContext.fillRect).not.toHaveBeenCalled();
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should handle chart with missing toBase64Image method", async () => {
            const invalidChart = {
                canvas: mockCanvas,
                data: {},
                options: {},
                // Missing toBase64Image method
            };

            await exportUtils.downloadChartAsPNG(invalidChart);

            expect(notifySpy).toHaveBeenCalledWith("Failed to export chart as PNG", "error");
        });
    });
});

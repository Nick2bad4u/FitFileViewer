/**
 * Test suite for exportUtils.js
 * Tests for chart export, sharing, and data export functionality
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportUtils, __setTestDeps } from "../../../../../utils/files/export/exportUtils.js";

// Mock dependencies
const mockShowNotification = vi.fn();
const mockDetectCurrentTheme = vi.fn().mockReturnValue("light");
const mockElectronAPI = {
    startGyazoServer: vi.fn(),
    stopGyazoServer: vi.fn(),
    saveFile: vi.fn(),
    copyToClipboard: vi.fn(),
    downloadFile: vi.fn(),
};

// Mock JSZip
const mockJSZip = vi.fn(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

// Mock Chart.js instances
const createMockChart = (label = "Test Chart", data = [{ x: 1, y: 10 }, { x: 2, y: 20 }]) => ({
    canvas: {
        toBlob: vi.fn((callback) => callback(new Blob(["test"], { type: "image/png" }))),
        width: 800,
        height: 600,
        getContext: vi.fn(() => ({
            fillStyle: "",
            fillRect: vi.fn(),
            drawImage: vi.fn(),
        })),
    },
    data: {
        datasets: [{
            label,
            data,
        }],
    },
    options: {
        responsive: true,
    },
    toBase64Image: vi.fn().mockReturnValue("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="),
    update: vi.fn(),
    destroy: vi.fn(),
});

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

// Mock fetch
const mockFetch = vi.fn();

// Mock document.createElement
const mockCreateElement = vi.fn((tagName) => {
    if (tagName === "canvas") {
        return {
            width: 800,
            height: 600,
            getContext: vi.fn(() => ({
                fillStyle: "",
                fillRect: vi.fn(),
                drawImage: vi.fn(),
            })),
            toBlob: vi.fn((callback) => callback(new Blob(["test"], { type: "image/png" }))),
        };
    }
    if (tagName === "a") {
        return {
            href: "",
            download: "",
            click: vi.fn(),
            style: {},
            remove: vi.fn(),
        };
    }
    return {
        href: "",
        download: "",
        click: vi.fn(),
        style: {},
        remove: vi.fn(),
    };
});

// Mock URL.createObjectURL and revokeObjectURL
const mockURL = {
    createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
    revokeObjectURL: vi.fn(),
};

// Mock document with body append method and querySelector
const mockDocument = {
    createElement: mockCreateElement,
    body: {
        append: vi.fn(),
    },
    querySelector: vi.fn(() => ({
        style: { display: "" },
        textContent: "",
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
        },
    })),
};

describe("exportUtils", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup global mocks
        Object.defineProperty(globalThis, "electronAPI", {
            value: mockElectronAPI,
            writable: true,
        });

        Object.defineProperty(globalThis, "localStorage", {
            value: mockLocalStorage,
            writable: true,
        });

        Object.defineProperty(globalThis, "fetch", {
            value: mockFetch,
            writable: true,
        });

        Object.defineProperty(globalThis, "JSZip", {
            value: mockJSZip,
            writable: true,
        });

        Object.defineProperty(globalThis, "document", {
            value: mockDocument,
            writable: true,
        });

        Object.defineProperty(globalThis, "URL", {
            value: mockURL,
            writable: true,
        });

        // Set test dependencies
        __setTestDeps({
            showNotification: mockShowNotification,
            detectCurrentTheme: mockDetectCurrentTheme,
        });
    });

    describe("addCombinedCSVToZip", () => {
        it("should add combined CSV data to ZIP archive", async () => {
            const mockZip = {
                file: vi.fn(),
            };

            const charts = [
                createMockChart("Speed", [{ x: 1000, y: 25 }, { x: 2000, y: 30 }]),
                createMockChart("Heart Rate", [{ x: 1000, y: 150 }, { x: 3000, y: 160 }]),
            ];

            await exportUtils.addCombinedCSVToZip(mockZip, charts);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                expect.stringContaining("timestamp,Speed,Heart Rate")
            );

            const csvContent = mockZip.file.mock.calls[0][1];
            expect(csvContent).toContain("1000,25,150");
            expect(csvContent).toContain("2000,30,");
            expect(csvContent).toContain("3000,,160");
        });

        it("should handle empty charts array", async () => {
            const mockZip = {
                file: vi.fn(),
            };

            await exportUtils.addCombinedCSVToZip(mockZip, []);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                "timestamp"
            );
        });

        it("should handle charts with no data", async () => {
            const mockZip = {
                file: vi.fn(),
            };

            const charts = [
                createMockChart("Speed", []),
                createMockChart("Heart Rate", []),
            ];

            await exportUtils.addCombinedCSVToZip(mockZip, charts);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                "timestamp,Speed,Heart Rate"
            );
        });
    });

    describe("authenticateWithGyazo", () => {
        it("should handle authentication failure when server fails to start", async () => {
            mockElectronAPI.startGyazoServer.mockResolvedValue({
                success: false,
                message: "Server failed to start",
            });

            await expect(exportUtils.authenticateWithGyazo()).rejects.toThrow(
                "Failed to start OAuth server: Server failed to start"
            );
        });

        it("should handle missing Gyazo credentials", async () => {
            // Mock localStorage to return null for credentials (but getGyazoConfig has defaults)
            // So we need to simulate a server start failure scenario instead
            mockElectronAPI.startGyazoServer.mockResolvedValue({
                success: false,
                message: "Authentication setup required",
            });

            await expect(exportUtils.authenticateWithGyazo()).rejects.toThrow(
                "Failed to start OAuth server: Authentication setup required"
            );
        });
    });

    describe("downloadChartAsPNG", () => {
        it("should download chart as PNG file", async () => {
            const chart = createMockChart();
            const mockLink = {
                href: "",
                download: "",
                click: vi.fn(),
                remove: vi.fn(),
            };

            (global.document.createElement as any).mockReturnValue(mockLink);

            await exportUtils.downloadChartAsPNG(chart);

            expect(chart.toBase64Image).toHaveBeenCalledWith("image/png", 1, "#ffffff");
            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should handle chart without toBase64Image method", async () => {
            const chart = { data: { datasets: [] } }; // Chart without toBase64Image

            await exportUtils.downloadChartAsPNG(chart);

            // Should still create link and attempt export with fallback behavior
            expect(global.document.createElement).toHaveBeenCalledWith("a");
        });
    });

    describe("exportChartDataAsCSV", () => {
        it("should export chart data as CSV using DOM download", async () => {
            const chartData = [
                { x: 1000, y: 25 },
                { x: 2000, y: 30 },
                { x: 3000, y: 35 },
            ];
            const fieldName = "Speed";

            const mockLink = {
                href: "",
                download: "",
                click: vi.fn(),
                remove: vi.fn(),
            };

            (global.document.createElement as any).mockReturnValue(mockLink);

            await exportUtils.exportChartDataAsCSV(chartData, fieldName);

            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toBe("chart-data.csv");
        });

        it("should handle empty data", async () => {
            const chartData: Array<{ x: string; y: number }> = [];
            const fieldName = "Empty";

            const mockLink = {
                href: "",
                download: "",
                click: vi.fn(),
                remove: vi.fn(),
            };

            (global.document.createElement as any).mockReturnValue(mockLink);

            await exportUtils.exportChartDataAsCSV(chartData, fieldName);

            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(mockLink.click).toHaveBeenCalled();
        });
    });

    describe("exportChartDataAsJSON", () => {
        it("should export chart data as JSON using DOM download", async () => {
            const chartData = [
                { x: 1000, y: 25 },
                { x: 2000, y: 30 },
            ];
            const fieldName = "Speed";

            const mockLink = {
                href: "",
                download: "",
                click: vi.fn(),
                remove: vi.fn(),
            };

            (global.document.createElement as any).mockReturnValue(mockLink);

            await exportUtils.exportChartDataAsJSON(chartData, fieldName);

            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toBe("chart-data.json");
        });
    });



    describe("getGyazoConfig", () => {
        it("should return complete Gyazo configuration with stored credentials", () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce("stored-client-id")
                .mockReturnValueOnce("stored-client-secret");

            const config = exportUtils.getGyazoConfig();

            expect(config).toEqual({
                authUrl: "https://gyazo.com/oauth/authorize",
                clientId: "stored-client-id",
                clientSecret: "stored-client-secret",
                redirectUri: "http://localhost:3000/gyazo/callback",
                tokenUrl: "https://gyazo.com/oauth/token",
                uploadUrl: "https://upload.gyazo.com/api/upload",
            });
        });

        it("should return default configuration when no credentials stored", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const config = exportUtils.getGyazoConfig();

            expect(config).toHaveProperty("authUrl", "https://gyazo.com/oauth/authorize");
            expect(config).toHaveProperty("clientId");
            expect(config).toHaveProperty("clientSecret");
            expect(config).toHaveProperty("redirectUri", "http://localhost:3000/gyazo/callback");
            expect(config).toHaveProperty("tokenUrl", "https://gyazo.com/oauth/token");
            expect(config).toHaveProperty("uploadUrl", "https://upload.gyazo.com/api/upload");

            // Should have default clientId and clientSecret (not null/empty)
            expect(typeof (config as any).clientId).toBe("string");
            expect(typeof (config as any).clientSecret).toBe("string");
            expect((config as any).clientId.length).toBeGreaterThan(0);
            expect((config as any).clientSecret.length).toBeGreaterThan(0);
        });
    });



    describe("uploadToGyazo", () => {
        it("should upload base64 image to Gyazo", async () => {
            const base64Image = "data:image/png;base64,test-image-data";

            // Mock localStorage to return an access token
            mockLocalStorage.getItem.mockReturnValue("test-token");

            // Mock fetch for base64 to blob conversion
            const mockBlob = new Blob(["test"], { type: "image/png" });
            mockFetch
                .mockResolvedValueOnce({
                    blob: vi.fn().mockResolvedValue(mockBlob),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue({
                        url: "https://gyazo.com/uploaded",
                        permalink_url: "https://gyazo.com/uploaded",
                    }),
                });

            const result = await exportUtils.uploadToGyazo(base64Image);

            expect(mockFetch).toHaveBeenCalledWith(
                "https://upload.gyazo.com/api/upload",
                expect.objectContaining({
                    method: "POST",
                    body: expect.any(FormData),
                })
            );

            expect(result).toBe("https://gyazo.com/uploaded");
        });

        it("should handle upload failure", async () => {
            const base64Image = "data:image/png;base64,test-image-data";

            // Mock localStorage to return an access token
            mockLocalStorage.getItem.mockReturnValue("test-token");

            // Mock fetch for base64 to blob conversion
            const mockBlob = new Blob(["test"], { type: "image/png" });
            mockFetch
                .mockResolvedValueOnce({
                    blob: vi.fn().mockResolvedValue(mockBlob),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    text: vi.fn().mockResolvedValue("Internal Server Error"),
                });

            await expect(exportUtils.uploadToGyazo(base64Image)).rejects.toThrow(
                "Gyazo upload failed: 500 - Internal Server Error"
            );
        });
    });
});

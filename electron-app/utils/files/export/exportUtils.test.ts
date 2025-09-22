// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportUtils } from "./exportUtils.js";

// Mock dependencies
vi.mock("../../charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: vi.fn(() => "light"),
}));

vi.mock("../../ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

vi.mock("../../ui/components/createSettingsHeader.js", () => ({
    showChartSelectionModal: vi.fn(),
}));

// Mock Chart.js
vi.mock("chart.js/auto", () => ({
    Chart: vi.fn().mockImplementation(() => ({
        canvas: document.createElement("canvas"),
        data: { datasets: [{ data: [{ x: 1, y: 10 }], label: "Test" }] },
        options: {},
        toBase64Image: vi.fn(() => "data:image/png;base64,test"),
        update: vi.fn(),
        destroy: vi.fn(),
    })),
}));

// Global mocks
Object.defineProperty(globalThis, "electronAPI", {
    value: {
        showSaveDialog: vi.fn(() => Promise.resolve({ filePath: "test.png" })),
        showOpenDialog: vi.fn(() => Promise.resolve({ filePaths: ["test.fit"] })),
        writeFileSync: vi.fn(),
        readFileSync: vi.fn(() => "mock file content"),
        startGyazoServer: vi.fn(() => Promise.resolve({ success: true, port: 3000 })),
        stopGyazoServer: vi.fn(() => Promise.resolve()),
        openExternal: vi.fn(() => Promise.resolve()),
    },
    writable: true,
});

Object.defineProperty(globalThis, "localStorage", {
    value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    },
    writable: true,
});

// Mock JSZip
Object.defineProperty(globalThis, "JSZip", {
    value: vi.fn().mockImplementation(() => ({
        file: vi.fn(),
        generateAsync: vi.fn(() => Promise.resolve(new Blob(["test"], { type: "application/zip" }))),
    })),
    writable: true,
});

// Mock fetch
Object.defineProperty(globalThis, "fetch", {
    value: vi.fn(() =>
        Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { link: "https://i.imgur.com/test.png" } }),
        })
    ),
    writable: true,
});

// Mock DOM elements and methods
Object.defineProperty(globalThis, "document", {
    value: {
        createElement: vi.fn((tag) => {
            const element: any = {
                tagName: tag.toUpperCase(),
                appendChild: vi.fn(),
                removeChild: vi.fn(),
                click: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                getAttribute: vi.fn(),
                setAttribute: vi.fn(),
                style: {},
                href: "",
                download: "",
                textContent: "",
                innerHTML: "",
                value: "",
                type: "",
                id: "",
                className: "",
            };
            if (tag === "canvas") {
                element.getContext = vi.fn(() => ({
                    fillRect: vi.fn(),
                    drawImage: vi.fn(),
                    getImageData: vi.fn(),
                    putImageData: vi.fn(),
                }));
                element.toDataURL = vi.fn(() => "data:image/png;base64,test");
                element.width = 800;
                element.height = 600;
            }
            return element;
        }),
        body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
        },
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(() => []),
    },
    writable: true,
});

Object.defineProperty(globalThis, "URL", {
    value: {
        createObjectURL: vi.fn(() => "blob:mock-url"),
        revokeObjectURL: vi.fn(),
    },
    writable: true,
});

Object.defineProperty(globalThis, "navigator", {
    value: {
        clipboard: {
            writeText: vi.fn(() => Promise.resolve()),
        },
    },
    writable: true,
});

Object.defineProperty(globalThis, "window", {
    value: {
        print: vi.fn(),
        open: vi.fn(() => ({
            document: {
                write: vi.fn(),
                close: vi.fn(),
            },
            print: vi.fn(),
            close: vi.fn(),
        })),
    },
    writable: true,
});

describe("exportUtils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("addCombinedCSVToZip", () => {
        it("should add combined CSV data to ZIP file", async () => {
            const mockZip = {
                file: vi.fn(),
            };

            const mockCharts = [
                {
                    data: { datasets: [{ data: [{ x: 1, y: 10 }], label: "Chart1" }] },
                },
                {
                    data: { datasets: [{ data: [{ x: 2, y: 20 }], label: "Chart2" }] },
                },
            ];

            await exportUtils.addCombinedCSVToZip(mockZip, mockCharts);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                expect.stringContaining("timestamp,Chart1,Chart2")
            );
        });

        it("should handle charts with no data", async () => {
            const mockZip = {
                file: vi.fn(),
            };

            const mockCharts = [
                {
                    data: { datasets: [{ data: [] }] },
                },
            ];

            await exportUtils.addCombinedCSVToZip(mockZip, mockCharts);

            expect(mockZip.file).toHaveBeenCalled();
        });
    });

    describe("authenticateWithGyazo", () => {
        it("should authenticate with Gyazo successfully", async () => {
            // Mock Gyazo config
            vi.mocked(globalThis.localStorage.getItem).mockImplementation((key) => {
                if (key === "gyazo_client_id") return "test-client-id";
                if (key === "gyazo_client_secret") return "test-client-secret";
                return null;
            });

            vi.mocked(globalThis.electronAPI.startGyazoServer).mockResolvedValue({
                success: true,
                port: 3000,
            });

            // Mock the authentication flow
            const authPromise = exportUtils.authenticateWithGyazo();

            expect(globalThis.electronAPI.startGyazoServer).toHaveBeenCalledWith(3000);
            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith("gyazo_oauth_state", expect.any(String));
        });

        it("should throw error when credentials not configured", async () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);

            await expect(exportUtils.authenticateWithGyazo()).rejects.toThrow("Gyazo credentials not configured");
        });
    });

    describe("clearGyazoAccessToken", () => {
        it("should clear stored Gyazo access token", () => {
            exportUtils.clearGyazoAccessToken();

            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith("gyazo_access_token");
        });
    });

    describe("clearGyazoConfig", () => {
        it("should clear stored Gyazo configuration", () => {
            exportUtils.clearGyazoConfig();

            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith("gyazo_client_id");
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith("gyazo_client_secret");
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith("gyazo_access_token");
        });
    });

    describe("downloadChartAsPNG", () => {
        it("should download chart as PNG", async () => {
            const mockChart = {
                canvas: document.createElement("canvas"),
                toBase64Image: vi.fn(() => "data:image/png;base64,test"),
            };

            await exportUtils.downloadChartAsPNG(mockChart, "test-chart.png");

            expect(mockChart.toBase64Image).toHaveBeenCalled();
        });

        it("should use default filename", async () => {
            const mockChart = {
                canvas: document.createElement("canvas"),
                toBase64Image: vi.fn(() => "data:image/png;base64,test"),
            };

            await exportUtils.downloadChartAsPNG(mockChart);

            expect(mockChart.toBase64Image).toHaveBeenCalled();
        });
    });

    describe("exportAllAsZip", () => {
        it("should export all charts as ZIP", async () => {
            const mockCharts = [
                {
                    canvas: document.createElement("canvas"),
                    data: { datasets: [{ data: [{ x: 1, y: 10 }], label: "Test1" }] },
                    toBase64Image: vi.fn(() => "data:image/png;base64,test1"),
                },
                {
                    canvas: document.createElement("canvas"),
                    data: { datasets: [{ data: [{ x: 2, y: 20 }], label: "Test2" }] },
                    toBase64Image: vi.fn(() => "data:image/png;base64,test2"),
                },
            ];

            await exportUtils.exportAllAsZip(mockCharts);

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });

        it("should handle empty charts array", async () => {
            await exportUtils.exportAllAsZip([]);

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });
    });

    describe("exportChartDataAsCSV", () => {
        it("should export chart data as CSV", async () => {
            const chartData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ];

            await exportUtils.exportChartDataAsCSV(chartData, "test-field", "test.csv");

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });

        it("should use default filename", async () => {
            const chartData = [{ x: 1, y: 10 }];

            await exportUtils.exportChartDataAsCSV(chartData, "test-field");

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });
    });

    describe("exportChartDataAsJSON", () => {
        it("should export chart data as JSON", async () => {
            const chartData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ];

            await exportUtils.exportChartDataAsJSON(chartData, "test-field", "test.json");

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });

        it("should use default filename", async () => {
            const chartData = [{ x: 1, y: 10 }];

            await exportUtils.exportChartDataAsJSON(chartData, "test-field");

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });
    });

    describe("exportCombinedChartsDataAsCSV", () => {
        it("should export combined charts data as CSV", async () => {
            const mockCharts = [
                {
                    data: { datasets: [{ data: [{ x: 1, y: 10 }], label: "Chart1" }] },
                },
                {
                    data: { datasets: [{ data: [{ x: 1, y: 15 }], label: "Chart2" }] },
                },
            ];

            await exportUtils.exportCombinedChartsDataAsCSV(mockCharts, "combined.csv");

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });

        it("should use default filename", async () => {
            const mockCharts = [
                {
                    data: { datasets: [{ data: [{ x: 1, y: 10 }], label: "Chart1" }] },
                },
            ];

            await exportUtils.exportCombinedChartsDataAsCSV(mockCharts);

            expect(globalThis.electronAPI.showSaveDialog).toHaveBeenCalled();
        });
    });

    describe("getExportThemeBackground", () => {
        it("should return background color for light theme", () => {
            const result = exportUtils.getExportThemeBackground();

            expect(result).toBeDefined();
            expect(typeof result).toBe("string");
        });
    });

    describe("getGyazoAccessToken", () => {
        it("should return stored access token", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue("test-token");

            const token = exportUtils.getGyazoAccessToken();

            expect(token).toBe("test-token");
            expect(globalThis.localStorage.getItem).toHaveBeenCalledWith("gyazo_access_token");
        });

        it("should return null when no token stored", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);

            const token = exportUtils.getGyazoAccessToken();

            expect(token).toBeNull();
        });
    });

    describe("getGyazoConfig", () => {
        it("should return complete Gyazo configuration", () => {
            vi.mocked(globalThis.localStorage.getItem).mockImplementation((key) => {
                if (key === "gyazo_client_id") return "test-client-id";
                if (key === "gyazo_client_secret") return "test-client-secret";
                if (key === "gyazo_access_token") return "test-token";
                return null;
            });

            const config = exportUtils.getGyazoConfig();

            expect(config).toEqual({
                clientId: "test-client-id",
                clientSecret: "test-client-secret",
                accessToken: "test-token",
            });
        });

        it("should return null values when nothing stored", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);

            const config = exportUtils.getGyazoConfig();

            expect(config).toEqual({
                clientId: null,
                clientSecret: null,
                accessToken: null,
            });
        });
    });

    describe("isGyazoAuthenticated", () => {
        it("should return true when access token exists", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue("test-token");

            const result = exportUtils.isGyazoAuthenticated();

            expect(result).toBe(true);
        });

        it("should return false when no access token", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);

            const result = exportUtils.isGyazoAuthenticated();

            expect(result).toBe(false);
        });
    });

    describe("isValidChart", () => {
        it("should return true for valid chart", () => {
            const validChart: any = {
                canvas: document.createElement("canvas"),
                data: { datasets: [{ data: [{ x: 1, y: 10 }] }] },
                options: {},
                toBase64Image: vi.fn(),
                update: vi.fn(),
                destroy: vi.fn(),
            };

            const result = exportUtils.isValidChart(validChart);

            expect(result).toBe(true);
        });

        it("should return false for invalid chart", () => {
            const invalidChart: any = null;

            const result = exportUtils.isValidChart(invalidChart);

            expect(result).toBe(false);
        });
    });

    describe("setGyazoAccessToken", () => {
        it("should store access token", () => {
            exportUtils.setGyazoAccessToken("new-token");

            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith("gyazo_access_token", "new-token");
        });
    });

    describe("setGyazoConfig", () => {
        it("should store Gyazo configuration", () => {
            exportUtils.setGyazoConfig("client-id", "client-secret");

            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith("gyazo_client_id", "client-id");
            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith("gyazo_client_secret", "client-secret");
        });
    });

    describe("uploadToGyazo", () => {
        it("should upload image to Gyazo successfully", async () => {
            const base64Image = "data:image/png;base64,test";

            vi.mocked(globalThis.fetch).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ url: "https://gyazo.com/test" }),
            } as Response);

            const result = await exportUtils.uploadToGyazo(base64Image);

            expect(result).toEqual({ url: "https://gyazo.com/test" });
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "https://upload.gyazo.com/api/upload",
                expect.objectContaining({
                    method: "POST",
                })
            );
        });

        it("should handle upload failure", async () => {
            const base64Image = "data:image/png;base64,test";

            vi.mocked(globalThis.fetch).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ error: "Bad request" }),
            } as Response);

            await expect(exportUtils.uploadToGyazo(base64Image)).rejects.toThrow();
        });
    });
});

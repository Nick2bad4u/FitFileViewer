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
        // Provide an onIpc mock used by authenticateWithGyazo
        onIpc: vi.fn(),
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

// Mock fetch with base64 data URL handling and upload response shapes
Object.defineProperty(globalThis, "fetch", {
    value: vi.fn((input: any, init?: any) => {
        // If fetching a data URL, return a Response-like with blob()
        if (typeof input === "string" && input.startsWith("data:")) {
            return Promise.resolve({
                ok: true,
                status: 200,
                blob: () => Promise.resolve(new Blob(["image-bytes"], { type: "image/png" })),
            } as any);
        }
        // Default JSON response for network calls
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { link: "https://i.imgur.com/test.png" } }),
            text: () => Promise.resolve("ok"),
        } as any);
    }),
    writable: true,
});

// Spy on document.createElement to inject canvas helpers
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, "createElement").mockImplementation((tagName: any): any => {
    const el: any = originalCreateElement(tagName as string);
    // augment with common stubs used by tests/implementation
    el.appendChild = el.appendChild ?? vi.fn();
    el.removeChild = el.removeChild ?? vi.fn();
    el.click = el.click ?? vi.fn();
    el.addEventListener = el.addEventListener ?? vi.fn();
    el.removeEventListener = el.removeEventListener ?? vi.fn();
    el.remove = el.remove ?? vi.fn();
    el.getAttribute = el.getAttribute ?? vi.fn();
    el.setAttribute = el.setAttribute ?? vi.fn();
    el.style = el.style ?? {};
    el.href = el.href ?? "";
    el.download = el.download ?? "";
    el.textContent = el.textContent ?? "";
    el.innerHTML = el.innerHTML ?? "";
    el.value = el.value ?? "";
    el.type = el.type ?? "";
    el.id = el.id ?? "";
    el.className = el.className ?? "";
    if ((tagName as string).toLowerCase() === "canvas") {
        el.getContext =
            el.getContext ??
            vi.fn(() => ({
                fillRect: vi.fn(),
                drawImage: vi.fn(),
                getImageData: vi.fn(),
                putImageData: vi.fn(),
            }));
        el.toDataURL = el.toDataURL ?? vi.fn(() => "data:image/png;base64,test");
        el.width = el.width ?? 800;
        el.height = el.height ?? 600;
    }
    return el;
});
// Spy body.appendChild/removeChild to avoid DOM mutation errors and to assert downloads
vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());
// Also stub append which is used by export flows
vi.spyOn(document.body, "append").mockImplementation(vi.fn());

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

            vi.mocked((globalThis as any).electronAPI.startGyazoServer).mockResolvedValue({
                success: true,
                port: 3000,
            });

            // Mock the authentication flow
            const authPromise = exportUtils.authenticateWithGyazo();

            expect((globalThis as any).electronAPI.startGyazoServer).toHaveBeenCalledWith(3000);
            // Allow microtask where setItem is called
            await Promise.resolve();
            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith("gyazo_oauth_state", expect.any(String));
        });

        it("cleans up state and subscriptions when user cancels", async () => {
            const unsubscribe = vi.fn();
            let capturedHandler: ((event: any, data: any) => void) | null = null;
            vi.mocked((globalThis as any).electronAPI.onIpc).mockImplementation((_channel: string, handler: any) => {
                capturedHandler = handler;
                return unsubscribe;
            });

            vi.mocked((globalThis as any).electronAPI.startGyazoServer).mockResolvedValue({ success: true, port: 3000 });
            vi.mocked((globalThis as any).electronAPI.stopGyazoServer).mockResolvedValue(undefined);

            // Ensure config has creds
            vi.mocked(globalThis.localStorage.getItem).mockImplementation((key) => {
                if (key === "gyazo_client_id") return "test-client-id";
                if (key === "gyazo_client_secret") return "test-client-secret";
                return null;
            });

            const authPromise = exportUtils.authenticateWithGyazo();
            await Promise.resolve();

            // Cancel from modal
            const cancelBtn = document.querySelector<HTMLButtonElement>("#gyazo-cancel-auth");
            expect(cancelBtn).toBeTruthy();
            cancelBtn!.click();

            await expect(authPromise).rejects.toThrow("User cancelled authentication");
            expect(unsubscribe).toHaveBeenCalled();
            expect((globalThis as any).electronAPI.stopGyazoServer).toHaveBeenCalled();
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith("gyazo_oauth_state");
            expect(document.querySelector(".gyazo-auth-modal-overlay")).toBeNull();
            // capturedHandler is unused here but ensures our onIpc wiring happened
            expect(capturedHandler).toBeTypeOf("function");
        });

        it("cleans up state and stops server on successful callback", async () => {
            const unsubscribe = vi.fn();
            let capturedHandler: ((event: any, data: any) => void) | null = null;

            vi.mocked((globalThis as any).electronAPI.onIpc).mockImplementation((_channel: string, handler: any) => {
                capturedHandler = handler;
                return unsubscribe;
            });

            vi.mocked((globalThis as any).electronAPI.startGyazoServer).mockResolvedValue({ success: true, port: 3000 });
            vi.mocked((globalThis as any).electronAPI.stopGyazoServer).mockResolvedValue(undefined);

            // Ensure config has creds
            vi.mocked(globalThis.localStorage.getItem).mockImplementation((key) => {
                if (key === "gyazo_client_id") return "test-client-id";
                if (key === "gyazo_client_secret") return "test-client-secret";
                return null;
            });

            // Make token exchange succeed
            vi.mocked(globalThis.fetch as any).mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ access_token: "test-token" }),
                    text: () => Promise.resolve("ok"),
                })
            );

            // Capture state set in localStorage
            let storedState: string | null = null;
            vi.mocked(globalThis.localStorage.setItem).mockImplementation((key, value) => {
                if (key === "gyazo_oauth_state") storedState = String(value);
            });

            const authPromise = exportUtils.authenticateWithGyazo();
            await Promise.resolve();

            expect(capturedHandler).toBeTypeOf("function");
            expect(typeof storedState).toBe("string");
            expect((storedState as string).length).toBeGreaterThan(0);

            await capturedHandler!({}, { code: "abc", state: storedState });
            await expect(authPromise).resolves.toBe("test-token");

            expect(unsubscribe).toHaveBeenCalled();
            expect((globalThis as any).electronAPI.stopGyazoServer).toHaveBeenCalled();
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith("gyazo_oauth_state");
        });

        it("should throw error when credentials not configured", async () => {
            // Ensure getGyazoConfig returns missing creds
            const cfgSpy = vi
                .spyOn(exportUtils, "getGyazoConfig")
                .mockReturnValue({ clientId: null, clientSecret: null } as any);
            const guideSpy = vi.spyOn(exportUtils, "showGyazoSetupGuide").mockImplementation(() => undefined);

            await expect(exportUtils.authenticateWithGyazo()).rejects.toThrow("Gyazo credentials not configured");

            expect(guideSpy).toHaveBeenCalled();
            cfgSpy.mockRestore();
            guideSpy.mockRestore();
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
                    // Provide minimal config required by exportAllAsZip when generating JSON
                    config: { type: "line" },
                    data: { datasets: [{ data: [{ x: 1, y: 10 }], label: "Test1" }] },
                    toBase64Image: vi.fn(() => "data:image/png;base64,test1"),
                },
            ];

            await exportUtils.exportAllAsZip(mockCharts);
            // Assert a ZIP was generated and a user notification occurred
            const notifMod = await import("../../ui/notifications/showNotification.js");
            expect(notifMod.showNotification).toHaveBeenCalled();
        });

        it("should handle empty charts array", async () => {
            await exportUtils.exportAllAsZip([]);
            // Should not proceed to create a blob URL for download
            expect(URL.createObjectURL).not.toHaveBeenCalled();
        });
    });

    describe("exportChartDataAsCSV", () => {
        it("should export chart data as CSV", async () => {
            const chartData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ];

            await exportUtils.exportChartDataAsCSV(chartData, "test-field", "test.csv");
            expect(URL.createObjectURL).toHaveBeenCalled();
        });

        it("should use default filename", async () => {
            const chartData = [{ x: 1, y: 10 }];

            await exportUtils.exportChartDataAsCSV(chartData, "test-field");
            expect(URL.createObjectURL).toHaveBeenCalled();
        });
    });

    describe("exportChartDataAsJSON", () => {
        it("should export chart data as JSON", async () => {
            const chartData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ];

            await exportUtils.exportChartDataAsJSON(chartData, "test-field", "test.json");
            expect(URL.createObjectURL).toHaveBeenCalled();
        });

        it("should use default filename", async () => {
            const chartData = [{ x: 1, y: 10 }];

            await exportUtils.exportChartDataAsJSON(chartData, "test-field");
            expect(URL.createObjectURL).toHaveBeenCalled();
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
            expect(URL.createObjectURL).toHaveBeenCalled();
        });

        it("should use default filename", async () => {
            const mockCharts = [
                {
                    data: { datasets: [{ data: [{ x: 1, y: 10 }], label: "Chart1" }] },
                },
            ];

            await exportUtils.exportCombinedChartsDataAsCSV(mockCharts);
            expect(URL.createObjectURL).toHaveBeenCalled();
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
                authUrl: "https://gyazo.com/oauth/authorize",
                clientId: "test-client-id",
                clientSecret: "test-client-secret",
                redirectUri: "http://localhost:3000/gyazo/callback",
                tokenUrl: "https://gyazo.com/oauth/token",
                uploadUrl: "https://upload.gyazo.com/api/upload",
            });
        });

        it("should return null values when nothing stored", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);

            const config = exportUtils.getGyazoConfig();
            // When nothing stored, defaults are returned for clientId/secret and urls are present
            expect(config).toEqual({
                authUrl: "https://gyazo.com/oauth/authorize",
                clientId: expect.any(String),
                clientSecret: expect.any(String),
                redirectUri: "http://localhost:3000/gyazo/callback",
                tokenUrl: "https://gyazo.com/oauth/token",
                uploadUrl: "https://upload.gyazo.com/api/upload",
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

            // Bypass auth by stubbing token and config
            vi.spyOn(exportUtils, "getGyazoAccessToken").mockReturnValue("token123" as any);
            vi.spyOn(exportUtils, "getGyazoConfig").mockReturnValue({
                uploadUrl: "https://upload.gyazo.com/api/upload",
            } as any);

            // First call: data URL -> blob
            vi.mocked(globalThis.fetch)
                .mockImplementationOnce((input: any) =>
                    Promise.resolve({
                        ok: true,
                        status: 200,
                        blob: () => Promise.resolve(new Blob(["img"], { type: "image/png" })),
                    } as any)
                )
                // Second call: upload -> json with url
                .mockImplementationOnce((input: any, init: any) =>
                    Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ url: "https://gyazo.com/test" }),
                        text: () => Promise.resolve("ok"),
                    } as any)
                );

            const result = await exportUtils.uploadToGyazo(base64Image);

            expect(result).toBe("https://gyazo.com/test");
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "https://upload.gyazo.com/api/upload",
                expect.objectContaining({
                    method: "POST",
                })
            );
        });

        it("should handle upload failure", async () => {
            const base64Image = "data:image/png;base64,test";

            // Bypass auth by stubbing token and config
            vi.spyOn(exportUtils, "getGyazoAccessToken").mockReturnValue("token123" as any);
            vi.spyOn(exportUtils, "getGyazoConfig").mockReturnValue({
                uploadUrl: "https://upload.gyazo.com/api/upload",
            } as any);

            vi.mocked(globalThis.fetch).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ error: "Bad request" }),
            } as Response);

            await expect(exportUtils.uploadToGyazo(base64Image)).rejects.toThrow();
        });
    });
});

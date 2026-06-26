// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportUtils } from "./exportUtils.js";
import {
    clearExportZipRuntimeForTests,
    setExportZipRuntime,
} from "./exportZipRuntime.js";
import type { RendererElectronApiScope } from "../../runtime/electronApiRuntime.js";

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
const localStorageEntries = new Map<string, string>();

function noopElectronIpcUnsubscribe(): void {}

function createElectronIpcUnsubscribe(): () => void {
    return noopElectronIpcUnsubscribe;
}

const electronApiMock = {
    showSaveDialog: vi.fn(() => Promise.resolve({ filePath: "test.png" })),
    showOpenDialog: vi.fn(() => Promise.resolve({ filePaths: ["test.fit"] })),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => "mock file content"),
    startGyazoServer: vi.fn(() =>
        Promise.resolve({ success: true, port: 3000 })
    ),
    stopGyazoServer: vi.fn(() => Promise.resolve()),
    openExternal: vi.fn(() => Promise.resolve()),
    // Provide an OAuth callback mock used by authenticateWithGyazo.
    onGyazoOAuthCallback: vi.fn(createElectronIpcUnsubscribe),
};

function createExportApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

Object.defineProperty(globalThis, "localStorage", {
    value: {
        clear: vi.fn(() => {
            localStorageEntries.clear();
        }),
        getItem: vi.fn((key: string) => localStorageEntries.get(key) ?? null),
        removeItem: vi.fn((key: string) => {
            localStorageEntries.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
            localStorageEntries.set(key, value);
        }),
    },
    writable: true,
});

function installZipMock(): void {
    const MockZip = vi.fn(function MockZip(this: any) {
        this.file = vi.fn();
        this.generateAsync = vi.fn(() =>
            Promise.resolve(new Blob(["test"], { type: "application/zip" }))
        );
    });

    setExportZipRuntime(MockZip);
}

// Mock fetch with base64 data URL handling and upload response shapes
Object.defineProperty(globalThis, "fetch", {
    value: vi.fn((input: any, _init?: any) => {
        // If fetching a data URL, return a Response-like with blob()
        if (typeof input === "string" && input.startsWith("data:")) {
            return Promise.resolve({
                ok: true,
                status: 200,
                blob: () =>
                    Promise.resolve(
                        new Blob(["image-bytes"], { type: "image/png" })
                    ),
            } as any);
        }
        // Default JSON response for network calls
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    data: { link: "https://i.imgur.com/test.png" },
                }),
            text: () => Promise.resolve("ok"),
        } as any);
    }),
    writable: true,
});

// Spy on document.createElement to inject canvas helpers
const createdAnchors: HTMLAnchorElement[] = [];
const originalCreateElement = document.createElement.bind(document);

function createMockElement(tagName: any): any {
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
    el.value = el.value ?? "";
    el.type = el.type ?? "";
    el.id = el.id ?? "";
    el.className = el.className ?? "";
    if ((tagName as string).toLowerCase() === "a") {
        createdAnchors.push(el);
    }
    if ((tagName as string).toLowerCase() === "canvas") {
        el.getContext = vi.fn(() => ({
            fillRect: vi.fn(),
            drawImage: vi.fn(),
            getImageData: vi.fn(),
            putImageData: vi.fn(),
        }));
        el.toDataURL = vi.fn(() => "data:image/png;base64,test");
        el.width = el.width ?? 800;
        el.height = el.height ?? 600;
    }
    return el;
}

function installDomMocks(): void {
    vi.spyOn(document, "createElement").mockImplementation(createMockElement);
}

// Preserve the URL constructor (used by production code). Only stub the static
// blob helpers needed by export flows.
function installUrlMocks(): void {
    if (typeof globalThis.URL === "function") {
        // @ts-expect-error test-only stubbing
        globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
        // @ts-expect-error test-only stubbing
        globalThis.URL.revokeObjectURL = vi.fn();
    } else {
        Object.defineProperty(globalThis, "URL", {
            value: {
                createObjectURL: vi.fn(() => "blob:mock-url"),
                revokeObjectURL: vi.fn(),
            },
            writable: true,
        });
    }
}

Object.defineProperty(globalThis, "navigator", {
    value: {
        clipboard: {
            writeText: vi.fn(() => Promise.resolve()),
        },
    },
    writable: true,
});

function getLastCreatedAnchor(): HTMLAnchorElement {
    const anchor = createdAnchors.at(-1);
    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    return anchor as HTMLAnchorElement;
}

async function getLastObjectUrlBlobText(): Promise<string> {
    const blob = vi.mocked(URL.createObjectURL).mock.calls.at(-1)?.[0];
    expect(blob).toBeInstanceOf(Blob);
    return await (blob as Blob).text();
}

function resetLocalStorageMock(): void {
    vi.mocked(globalThis.localStorage.clear).mockImplementation(() => {
        localStorageEntries.clear();
    });
    vi.mocked(globalThis.localStorage.getItem).mockImplementation(
        (key: string) => localStorageEntries.get(key) ?? null
    );
    vi.mocked(globalThis.localStorage.removeItem).mockImplementation(
        (key: string) => {
            localStorageEntries.delete(key);
        }
    );
    vi.mocked(globalThis.localStorage.setItem).mockImplementation(
        (key: string, value: string) => {
            localStorageEntries.set(key, value);
        }
    );
}

describe("exportUtils", () => {
    beforeEach(() => {
        installDomMocks();
        installUrlMocks();
        installZipMock();
        localStorageEntries.clear();
        createdAnchors.length = 0;
        vi.clearAllMocks();
        resetLocalStorageMock();
    });

    afterEach(() => {
        clearExportZipRuntimeForTests();
        vi.restoreAllMocks();
    });

    describe("addCombinedCSVToZip", () => {
        it("should add combined CSV data to ZIP file", async () => {
            const mockZip = {
                file: vi.fn(),
            };

            const mockCharts = [
                {
                    data: {
                        datasets: [
                            { data: [{ x: 1, y: 10 }], label: "Chart1" },
                        ],
                    },
                },
                {
                    data: {
                        datasets: [
                            { data: [{ x: 2, y: 20 }], label: "Chart2" },
                        ],
                    },
                },
            ];

            await exportUtils.addCombinedCSVToZip(mockZip, mockCharts);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                expect.stringContaining("timestamp,Chart1,Chart2")
            );
            const csvContent = mockZip.file.mock.calls[0]?.[1];
            expect(csvContent).toBe("timestamp,Chart1,Chart2\n1,10,\n2,,20");
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

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                "timestamp,chart-0"
            );
            const csvContent = mockZip.file.mock.calls[0]?.[1];
            expect(csvContent).not.toContain("10");
        });
    });

    describe("authenticateWithGyazo", () => {
        it("should initialize Gyazo authentication", async () => {
            // Mock Gyazo config
            vi.mocked(globalThis.localStorage.getItem).mockImplementation(
                (key) => {
                    if (key === "gyazo_client_id") return "test-client-id";
                    if (key === "gyazo_client_secret")
                        return "test-client-secret";
                    return null;
                }
            );

            vi.mocked(electronApiMock.startGyazoServer).mockResolvedValue({
                success: true,
                port: 3000,
            });

            // Mock the authentication flow
            const authPromise = exportUtils.authenticateWithGyazo({
                electronApiScope: createExportApiScope(electronApiMock),
            });

            expect(electronApiMock.startGyazoServer).toHaveBeenCalledWith(3000);
            // Allow microtask where setItem is called
            await Promise.resolve();
            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
                "gyazo_oauth_state",
                expect.any(String)
            );
            expect(localStorageEntries.get("gyazo_oauth_state")).toBeTypeOf(
                "string"
            );
            expect(
                document.querySelector(".gyazo-auth-modal-overlay")
            ).toBeInstanceOf(HTMLElement);
            void authPromise.catch(() => undefined);
        });

        it("rejects malformed Gyazo Electron API methods", async () => {
            vi.mocked(globalThis.localStorage.getItem).mockImplementation(
                (key) => {
                    if (key === "gyazo_client_id") return "test-client-id";
                    if (key === "gyazo_client_secret")
                        return "test-client-secret";
                    return null;
                }
            );

            await expect(
                exportUtils.authenticateWithGyazo({
                    electronApiScope: createExportApiScope({
                        onGyazoOAuthCallback: "not a callback listener",
                        startGyazoServer: vi.fn(),
                        stopGyazoServer: vi.fn(),
                    }),
                })
            ).rejects.toThrow(
                "Gyazo OAuth is only available in the Electron desktop build"
            );

            expect(electronApiMock.startGyazoServer).not.toHaveBeenCalled();
        });

        it("cleans up state and subscriptions when user cancels", async () => {
            const unsubscribe = vi.fn();
            let capturedHandler: ((data: any) => void) | null = null;
            vi.mocked(electronApiMock.onGyazoOAuthCallback).mockImplementation(
                (handler: any) => {
                    capturedHandler = handler;
                    return unsubscribe;
                }
            );

            vi.mocked(electronApiMock.startGyazoServer).mockResolvedValue({
                success: true,
                port: 3000,
            });
            vi.mocked(electronApiMock.stopGyazoServer).mockResolvedValue(
                undefined
            );
            // Ensure config has creds
            vi.mocked(globalThis.localStorage.getItem).mockImplementation(
                (key) => {
                    if (key === "gyazo_client_id") return "test-client-id";
                    if (key === "gyazo_client_secret")
                        return "test-client-secret";
                    return null;
                }
            );

            const authPromise = exportUtils.authenticateWithGyazo({
                electronApiScope: createExportApiScope(electronApiMock),
            });
            await Promise.resolve();

            // Cancel from modal
            const cancelBtn =
                document.querySelector<HTMLButtonElement>("#gyazo-cancel-auth");
            expect(cancelBtn).toBeInstanceOf(HTMLButtonElement);
            cancelBtn?.click();

            await expect(authPromise).rejects.toThrow(
                "User cancelled authentication"
            );
            expect(unsubscribe).toHaveBeenCalled();
            expect(electronApiMock.stopGyazoServer).toHaveBeenCalled();
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(
                "gyazo_oauth_state"
            );
            expect(
                document.querySelector(".gyazo-auth-modal-overlay")
            ).toBeNull();
            // capturedHandler is unused here but ensures our OAuth callback wiring happened
            expect(capturedHandler).toBeTypeOf("function");
        });

        it("cleans up state and stops server on successful callback", async () => {
            const unsubscribe = vi.fn();
            let capturedHandler: ((data: any) => void) | null = null;

            vi.mocked(electronApiMock.onGyazoOAuthCallback).mockImplementation(
                (handler: any) => {
                    capturedHandler = handler;
                    return unsubscribe;
                }
            );

            vi.mocked(electronApiMock.startGyazoServer).mockResolvedValue({
                success: true,
                port: 3000,
            });
            vi.mocked(electronApiMock.stopGyazoServer).mockResolvedValue(
                undefined
            );

            // Ensure config has creds
            vi.mocked(globalThis.localStorage.getItem).mockImplementation(
                (key) => {
                    if (key === "gyazo_client_id") return "test-client-id";
                    if (key === "gyazo_client_secret")
                        return "test-client-secret";
                    return null;
                }
            );
            vi.mocked(globalThis.fetch).mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ access_token: "test-token" }),
                text: () => Promise.resolve("ok"),
            } as any);

            // Capture state set in localStorage
            let storedState: string | null = null;
            vi.mocked(globalThis.localStorage.setItem).mockImplementation(
                (key, value) => {
                    if (key === "gyazo_oauth_state")
                        storedState = String(value);
                }
            );

            const authPromise = exportUtils.authenticateWithGyazo({
                electronApiScope: createExportApiScope(electronApiMock),
            });
            await Promise.resolve();

            expect(capturedHandler).toBeTypeOf("function");
            expect(typeof storedState).toBe("string");
            expect((storedState as string).length).toBeGreaterThan(0);

            await capturedHandler!({ code: "abc", state: storedState });
            await expect(authPromise).resolves.toBe("test-token");

            expect(unsubscribe).toHaveBeenCalled();
            expect(electronApiMock.stopGyazoServer).toHaveBeenCalled();
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(
                "gyazo_oauth_state"
            );
        });

        it("should throw error when credentials not configured", async () => {
            // Ensure getGyazoConfig returns missing creds
            const cfgSpy = vi
                .spyOn(exportUtils, "getGyazoConfig")
                .mockReturnValue({ clientId: null, clientSecret: null } as any);
            const guideSpy = vi
                .spyOn(exportUtils, "showGyazoSetupGuide")
                .mockImplementation(() => undefined);

            await expect(exportUtils.authenticateWithGyazo()).rejects.toThrow(
                "Gyazo credentials not configured"
            );

            expect(guideSpy).toHaveBeenCalled();
            cfgSpy.mockRestore();
            guideSpy.mockRestore();
        });
    });

    describe("clearGyazoAccessToken", () => {
        it("should clear stored Gyazo access token", () => {
            localStorageEntries.set("gyazo_access_token", "old-token");

            exportUtils.clearGyazoAccessToken();

            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(
                "gyazo_access_token"
            );
            expect(exportUtils.getGyazoAccessToken()).toBeNull();
            expect(globalThis.localStorage.removeItem).not.toHaveBeenCalledWith(
                "gyazo_client_id"
            );
        });
    });

    describe("clearGyazoConfig", () => {
        it("should clear stored Gyazo configuration", () => {
            localStorageEntries.set("gyazo_client_id", "old-client");
            localStorageEntries.set("gyazo_client_secret", "old-secret");
            localStorageEntries.set("gyazo_access_token", "old-token");
            localStorageEntries.set("gyazo_oauth_state", "old-state");

            exportUtils.clearGyazoConfig();

            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(
                "gyazo_client_id"
            );
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(
                "gyazo_client_secret"
            );
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(
                "gyazo_access_token"
            );
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith(
                "gyazo_oauth_state"
            );
            expect(exportUtils.isGyazoAuthenticated()).toBe(false);
            expect(globalThis.localStorage.removeItem).not.toHaveBeenCalledWith(
                "unrelated_key"
            );
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
            const anchor = getLastCreatedAnchor();
            expect(anchor.download).toBe("test-chart.png");
            expect(anchor.href).toBe("data:image/png;base64,test");
        });

        it("should use default filename", async () => {
            const mockChart = {
                canvas: document.createElement("canvas"),
                toBase64Image: vi.fn(() => "data:image/png;base64,test"),
            };

            await exportUtils.downloadChartAsPNG(mockChart);

            expect(mockChart.toBase64Image).toHaveBeenCalled();
            expect(getLastCreatedAnchor().download).toBe("chart.png");
        });

        it("should reject invalid chart objects without creating a download", async () => {
            await exportUtils.downloadChartAsPNG(null as any);

            expect(createdAnchors).toHaveLength(0);
            const notifMod =
                await import("../../ui/notifications/showNotification.js");
            expect(notifMod.showNotification).toHaveBeenCalledWith(
                "Failed to export chart as PNG",
                "error"
            );
        });
    });

    describe("exportAllAsZip", () => {
        it("should export all charts as ZIP", async () => {
            const mockCharts = [
                {
                    canvas: document.createElement("canvas"),
                    // Provide minimal config required by exportAllAsZip when generating JSON
                    config: { type: "line" },
                    data: {
                        datasets: [{ data: [{ x: 1, y: 10 }], label: "Test1" }],
                    },
                    toBase64Image: vi.fn(() => "data:image/png;base64,test1"),
                },
            ];

            await exportUtils.exportAllAsZip(mockCharts);
            // Assert a ZIP was generated and a user notification occurred
            const notifMod =
                await import("../../ui/notifications/showNotification.js");
            expect(notifMod.showNotification).toHaveBeenCalled();
            expect(URL.createObjectURL).toHaveBeenCalled();
            const zipBlob = vi
                .mocked(URL.createObjectURL)
                .mock.calls.at(-1)?.[0];
            expect(zipBlob).toBeInstanceOf(Blob);
        });

        it("should handle empty charts array", async () => {
            await exportUtils.exportAllAsZip([]);
            // Should not proceed to create a blob URL for download
            expect(URL.createObjectURL).not.toHaveBeenCalled();
            expect(createdAnchors).toHaveLength(0);
        });
    });

    describe("exportChartDataAsCSV", () => {
        it("should export chart data as CSV", async () => {
            const chartData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ];

            await exportUtils.exportChartDataAsCSV(
                chartData,
                "test-field",
                "test.csv"
            );
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(getLastCreatedAnchor().download).toBe("test.csv");
            await expect(getLastObjectUrlBlobText()).resolves.toBe(
                "timestamp,test-field\n1,10\n2,20"
            );
        });

        it("should use default filename", async () => {
            const chartData = [{ x: 1, y: 10 }];

            await exportUtils.exportChartDataAsCSV(chartData, "test-field");
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(getLastCreatedAnchor().download).toBe("chart-data.csv");
        });

        it("should export headers for empty CSV data", async () => {
            await exportUtils.exportChartDataAsCSV([], "test-field");

            await expect(getLastObjectUrlBlobText()).resolves.toBe(
                "timestamp,test-field"
            );
            expect(getLastCreatedAnchor().download).not.toBe("");
        });
    });

    describe("exportChartDataAsJSON", () => {
        it("should export chart data as JSON", async () => {
            const chartData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ];

            await exportUtils.exportChartDataAsJSON(
                chartData,
                "test-field",
                "test.json"
            );
            expect(URL.createObjectURL).toHaveBeenCalled();
            const jsonText = await getLastObjectUrlBlobText();
            expect(JSON.parse(jsonText)).toMatchObject({
                data: chartData,
                field: "test-field",
                totalPoints: 2,
            });
            expect(getLastCreatedAnchor().download).toBe("test.json");
        });

        it("should use default filename", async () => {
            const chartData = [{ x: 1, y: 10 }];

            await exportUtils.exportChartDataAsJSON(chartData, "test-field");
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(getLastCreatedAnchor().download).toBe("chart-data.json");
        });

        it("should record zero total points for empty JSON data", async () => {
            await exportUtils.exportChartDataAsJSON([], "test-field");

            const jsonText = await getLastObjectUrlBlobText();
            expect(JSON.parse(jsonText)).toMatchObject({
                data: [],
                field: "test-field",
                totalPoints: 0,
            });
            expect(jsonText).not.toContain('"x"');
        });
    });

    describe("exportCombinedChartsDataAsCSV", () => {
        it("should export combined charts data as CSV", async () => {
            const mockCharts = [
                {
                    data: {
                        datasets: [
                            { data: [{ x: 1, y: 10 }], label: "Chart1" },
                        ],
                    },
                },
                {
                    data: {
                        datasets: [
                            { data: [{ x: 1, y: 15 }], label: "Chart2" },
                        ],
                    },
                },
            ];

            await exportUtils.exportCombinedChartsDataAsCSV(
                mockCharts,
                "combined.csv"
            );
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(getLastCreatedAnchor().download).toBe("combined.csv");
            await expect(getLastObjectUrlBlobText()).resolves.toBe(
                "timestamp,Chart1,Chart2\n1,10,15"
            );
        });

        it("should use default filename", async () => {
            const mockCharts = [
                {
                    data: {
                        datasets: [
                            { data: [{ x: 1, y: 10 }], label: "Chart1" },
                        ],
                    },
                },
            ];

            await exportUtils.exportCombinedChartsDataAsCSV(mockCharts);
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(getLastCreatedAnchor().download).toBe(
                "combined-charts-data.csv"
            );
            await expect(getLastObjectUrlBlobText()).resolves.toContain(
                "timestamp,Chart1"
            );
        });

        it("should reject an empty chart list without creating a download", async () => {
            await exportUtils.exportCombinedChartsDataAsCSV([]);

            expect(URL.createObjectURL).not.toHaveBeenCalled();
            expect(createdAnchors).toHaveLength(0);
        });
    });

    describe("getExportThemeBackground", () => {
        it("should return background color for light theme", () => {
            const result = exportUtils.getExportThemeBackground();

            expect(result).toBe("#ffffff");
            expect(result).not.toBe("transparent");
        });
    });

    describe("getGyazoAccessToken", () => {
        it("should return stored access token", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(
                "test-token"
            );

            const token = exportUtils.getGyazoAccessToken();

            expect(token).toBe("test-token");
            expect(globalThis.localStorage.getItem).toHaveBeenCalledWith(
                "gyazo_access_token"
            );
        });

        it("should return null when no token stored", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(null);

            const token = exportUtils.getGyazoAccessToken();

            expect(token).toBeNull();
        });
    });

    describe("getGyazoConfig", () => {
        it("should return complete Gyazo configuration", () => {
            vi.mocked(globalThis.localStorage.getItem).mockImplementation(
                (key) => {
                    if (key === "gyazo_client_id") return "test-client-id";
                    if (key === "gyazo_client_secret")
                        return "test-client-secret";
                    if (key === "gyazo_access_token") return "test-token";
                    return null;
                }
            );

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
            expect(config.clientId).not.toBe("");
        });
    });

    describe("isGyazoAuthenticated", () => {
        it("should return true when access token exists", () => {
            vi.mocked(globalThis.localStorage.getItem).mockReturnValue(
                "test-token"
            );

            const result = exportUtils.isGyazoAuthenticated();

            expect(result).toBe(true);
            expect(result).not.toBe(false);
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

            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
                "gyazo_access_token",
                "new-token"
            );
            expect(exportUtils.getGyazoAccessToken()).toBe("new-token");
            expect(globalThis.localStorage.setItem).not.toHaveBeenCalledWith(
                "gyazo_client_id",
                "new-token"
            );
        });
    });

    describe("setGyazoConfig", () => {
        it("should store Gyazo configuration", () => {
            exportUtils.setGyazoConfig("client-id", "client-secret");

            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
                "gyazo_client_id",
                "client-id"
            );
            expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
                "gyazo_client_secret",
                "client-secret"
            );
            expect(exportUtils.getGyazoConfig()).toMatchObject({
                clientId: "client-id",
                clientSecret: "client-secret",
            });
            expect(globalThis.localStorage.setItem).not.toHaveBeenCalledWith(
                "gyazo_access_token",
                expect.any(String)
            );
        });
    });

    describe("uploadToGyazo", () => {
        it("should upload image to Gyazo successfully", async () => {
            const base64Image = "data:image/png;base64,test";

            // Bypass auth by stubbing token and config
            vi.spyOn(exportUtils, "getGyazoAccessToken").mockReturnValue(
                "token123" as any
            );
            vi.spyOn(exportUtils, "getGyazoConfig").mockReturnValue({
                uploadUrl: "https://upload.gyazo.com/api/upload",
            } as any);

            vi.mocked(globalThis.fetch).mockImplementationOnce(
                (_input: any, _init: any) =>
                    Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () =>
                            Promise.resolve({ url: "https://gyazo.com/test" }),
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
            vi.spyOn(exportUtils, "getGyazoAccessToken").mockReturnValue(
                "token123" as any
            );
            vi.spyOn(exportUtils, "getGyazoConfig").mockReturnValue({
                uploadUrl: "https://upload.gyazo.com/api/upload",
            } as any);

            vi.mocked(globalThis.fetch).mockImplementationOnce(
                (_input: any, _init: any) =>
                    Promise.resolve({
                        ok: false,
                        status: 400,
                        text: () => Promise.resolve("Bad request"),
                        json: () => Promise.resolve({ error: "Bad request" }),
                    } as any)
            );

            await expect(
                exportUtils.uploadToGyazo(base64Image)
            ).rejects.toThrow("Gyazo upload failed: 400");
        });

        it("should treat AbortError as a timeout", async () => {
            const base64Image = "data:image/png;base64,test";

            vi.spyOn(exportUtils, "getGyazoAccessToken").mockReturnValue(
                "token123" as any
            );
            vi.spyOn(exportUtils, "getGyazoConfig").mockReturnValue({
                uploadUrl: "https://upload.gyazo.com/api/upload",
            } as any);

            vi.mocked(globalThis.fetch).mockImplementationOnce(() =>
                Promise.reject({ name: "AbortError" })
            );

            await expect(
                exportUtils.uploadToGyazo(base64Image)
            ).rejects.toThrow("Gyazo upload timed out");
        });

        it("should reject unexpected upload host before uploading", async () => {
            const base64Image = "data:image/png;base64,test";

            vi.spyOn(exportUtils, "getGyazoAccessToken").mockReturnValue(
                "token123" as any
            );
            vi.spyOn(exportUtils, "getGyazoConfig").mockReturnValue({
                uploadUrl: "https://evil.example.com/api/upload",
            } as any);

            await expect(
                exportUtils.uploadToGyazo(base64Image)
            ).rejects.toThrow("Unexpected Gyazo endpoint host");
            expect(globalThis.fetch).not.toHaveBeenCalled();
        });
    });

    describe("uploadToImgur", () => {
        it("should upload image to Imgur successfully", async () => {
            const base64Image = "data:image/png;base64,abcd";
            vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
                clientId: "client123",
                uploadUrl: "https://api.imgur.com/3/image",
            } as any);

            vi.mocked(globalThis.fetch).mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () =>
                    Promise.resolve({
                        data: { link: "https://i.imgur.com/test.png" },
                    }),
                text: () => Promise.resolve("ok"),
            } as any);

            const url = await exportUtils.uploadToImgur(base64Image);
            expect(url).toBe("https://i.imgur.com/test.png");

            expect(globalThis.fetch).toHaveBeenCalledWith(
                "https://api.imgur.com/3/image",
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        Authorization: "Client-ID client123",
                    }),
                })
            );
        });

        it("rejects Imgur responses without an upload link", async () => {
            const base64Image = "data:image/png;base64,abcd";
            vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
                clientId: "client123",
                uploadUrl: "https://api.imgur.com/3/image",
            } as any);

            vi.mocked(globalThis.fetch).mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: "OK",
                json: () => Promise.resolve({ data: { link: "" } }),
                text: () => Promise.resolve("ok"),
            } as any);

            await expect(
                exportUtils.uploadToImgur(base64Image)
            ).rejects.toThrow("Invalid response from Imgur");
        });

        it("should treat AbortError as a timeout", async () => {
            const base64Image = "data:image/png;base64,abcd";
            vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
                clientId: "client123",
                uploadUrl: "https://api.imgur.com/3/image",
            } as any);

            vi.mocked(globalThis.fetch).mockRejectedValueOnce({
                name: "AbortError",
            });
            await expect(
                exportUtils.uploadToImgur(base64Image)
            ).rejects.toThrow("Imgur upload timed out");
        });

        it("should reject non-https Imgur endpoints", async () => {
            const base64Image = "data:image/png;base64,abcd";
            const uploadUrl = new URL("https://api.imgur.com/3/image");
            uploadUrl.protocol = "http:";
            vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
                clientId: "client123",
                uploadUrl: uploadUrl.toString(),
            } as any);

            await expect(
                exportUtils.uploadToImgur(base64Image)
            ).rejects.toThrow("Imgur endpoints must use HTTPS");
            expect(globalThis.fetch).not.toHaveBeenCalled();
        });
    });
});

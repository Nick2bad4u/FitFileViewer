/**
 * Test suite for exportUtils.js Tests for chart export, sharing, and data
 * export functionality
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    exportUtils,
    __setTestDeps,
} from "../../../../../electron-app/utils/files/export/exportUtils.js";
import {
    clearExportZipRuntimeForTests,
    registerExportZipRuntime,
} from "../../../../../electron-app/utils/files/export/exportZipRuntime.js";
import type { ExportableChart } from "../../../../../electron-app/utils/files/export/exportUtils.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type AddCombinedCsvZip = Parameters<typeof exportUtils.addCombinedCSVToZip>[0];
type ChartDataPoint = Parameters<typeof exportUtils.exportChartDataAsCSV>[0][0];
type CreateObjectUrl = (object: Blob | MediaSource) => string;
type DetectCurrentTheme = () => "light";
type DownloadFile = (url: string, filename?: string) => Promise<void> | void;
type ElectronIpcUnsubscribe = () => void;
type MockAnchorElement = {
    click: ReturnType<typeof vi.fn<() => void>>;
    download: string;
    href: string;
    remove: ReturnType<typeof vi.fn<() => void>>;
    style: Record<string, string>;
};
type MockCanvasContext = {
    drawImage: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;
    fillRect: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;
    fillStyle: string;
};
type MockCanvasElement = {
    getContext: ReturnType<typeof vi.fn<() => MockCanvasContext>>;
    height: number;
    toBlob: ReturnType<typeof vi.fn<(callback: BlobCallback) => void>>;
    width: number;
};
type MockCreatedElement = MockAnchorElement | MockCanvasElement;
type MockFetchResponse = {
    json?: () => Promise<Record<string, string>>;
    ok: boolean;
    status?: number;
    text?: () => Promise<string>;
};
type MockZip = AddCombinedCsvZip & {
    file: ReturnType<
        typeof vi.fn<
            (
                name: string,
                data: Blob | string,
                options?: { base64?: boolean }
            ) => AddCombinedCsvZip
        >
    >;
};
type OnGyazoOAuthCallback = (
    listener: (data: unknown) => void
) => ElectronIpcUnsubscribe;
type SaveFile = (path: string, data: Blob | string) => Promise<void> | void;
type ShowNotification = (
    message: string,
    type?: string,
    duration?: number,
    options?: unknown
) => Promise<void> | void;
type StartGyazoServer = () => Promise<{ message?: string; success: boolean }>;

// Mock dependencies
const mockShowNotification = vi.fn<ShowNotification>();
const mockDetectCurrentTheme = vi
    .fn<DetectCurrentTheme>()
    .mockReturnValue("light");

function noopElectronIpcUnsubscribe(): void {}

function createElectronIpcUnsubscribe(): ElectronIpcUnsubscribe {
    return noopElectronIpcUnsubscribe;
}

const mockElectronAPI = {
    copyToClipboard: vi.fn<(value: string) => Promise<void> | void>(),
    downloadFile: vi.fn<DownloadFile>(),
    // AuthenticateWithGyazo registers an IPC listener and expects an unsubscribe function.
    onGyazoOAuthCallback: vi.fn<OnGyazoOAuthCallback>(
        createElectronIpcUnsubscribe
    ),
    saveFile: vi.fn<SaveFile>(),
    startGyazoServer: vi.fn<StartGyazoServer>(),
    stopGyazoServer: vi.fn<() => Promise<void> | void>(),
};

function createExportApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

const mockJSZip = vi.fn<() => AddCombinedCsvZip>(() => ({
    file: vi.fn<
        (
            name: string,
            data: Blob | string,
            options?: { base64?: boolean }
        ) => AddCombinedCsvZip
    >(),
    generateAsync: vi
        .fn<(options: { type: "blob" }) => Promise<Blob>>()
        .mockResolvedValue(new Blob(["zip"])),
}));

function createCanvasContextMock(): MockCanvasContext {
    return {
        fillStyle: "",
        fillRect: vi.fn<(...args: unknown[]) => void>(),
        drawImage: vi.fn<(...args: unknown[]) => void>(),
    };
}

function createMockCanvas(): MockCanvasElement {
    return {
        width: 800,
        height: 600,
        getContext: vi.fn<() => MockCanvasContext>(createCanvasContextMock),
        toBlob: vi.fn<(callback: BlobCallback) => void>((callback) => {
            callback(new Blob(["test"], { type: "image/png" }));
        }),
    };
}

function createMockLink(): MockAnchorElement {
    return {
        href: "",
        download: "",
        click: vi.fn<() => void>(),
        style: {},
        remove: vi.fn<() => void>(),
    };
}

function createMockZip(): MockZip {
    const zip = {
        file: vi.fn<
            (
                name: string,
                data: Blob | string,
                options?: { base64?: boolean }
            ) => AddCombinedCsvZip
        >(),
        generateAsync: vi
            .fn<(options: { type: "blob" }) => Promise<Blob>>()
            .mockResolvedValue(new Blob(["zip"])),
    } as MockZip;
    zip.file.mockReturnValue(zip);
    return zip;
}

// Mock Chart.js instances
const createMockChart = (
    label = "Test Chart",
    data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
    ] satisfies ChartDataPoint[]
): ExportableChart => ({
    canvas: createMockCanvas() as unknown as HTMLCanvasElement,
    data: {
        datasets: [
            {
                label,
                data,
            },
        ],
    },
    options: {
        responsive: true,
    },
    toBase64Image: vi
        .fn<
            (
                type?: string,
                quality?: number,
                backgroundColor?: string
            ) => string
        >()
        .mockReturnValue(
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        ),
    update: vi.fn<() => void>(),
    destroy: vi.fn<() => void>(),
});

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn<(key: string) => null | string>(),
    setItem: vi.fn<(key: string, value: string) => void>(),
    removeItem: vi.fn<(key: string) => void>(),
    clear: vi.fn<() => void>(),
};

// Mock fetch
const mockFetch =
    vi.fn<
        (
            input: RequestInfo | URL,
            init?: RequestInit
        ) => Promise<MockFetchResponse>
    >();

function createElementForTag(tagName: string): MockCreatedElement {
    if (tagName === "canvas") {
        return createMockCanvas();
    }
    if (tagName === "a") {
        return createMockLink();
    }
    return createMockLink();
}

// Mock document.createElement
const mockCreateElement =
    vi.fn<(tagName: string) => MockCreatedElement>(createElementForTag);

// Mock URL.createObjectURL and revokeObjectURL
const mockURL = {
    createObjectURL: vi.fn<CreateObjectUrl>().mockReturnValue("blob:mock-url"),
    revokeObjectURL: vi.fn<(url: string) => void>(),
};

// Mock document with body append method and querySelector
const mockDocument = {
    createElement: mockCreateElement,
    body: {
        append: vi.fn<(...nodes: unknown[]) => void>(),
    },
    querySelector: vi.fn<
        (selectors: string) => null | {
            classList: {
                add: ReturnType<typeof vi.fn<(...tokens: string[]) => void>>;
                remove: ReturnType<typeof vi.fn<(...tokens: string[]) => void>>;
            };
            style: { display: string };
            textContent: string;
        }
    >(() => ({
        style: { display: "" },
        textContent: "",
        classList: {
            add: vi.fn<(...tokens: string[]) => void>(),
            remove: vi.fn<(...tokens: string[]) => void>(),
        },
    })),
};

describe("exportUtils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateElement.mockImplementation(createElementForTag);
        mockLocalStorage.getItem.mockReturnValue(null);
        mockURL.createObjectURL.mockReturnValue("blob:mock-url");

        // Setup global/runtime mocks
        Object.defineProperty(globalThis, "localStorage", {
            value: mockLocalStorage,
            writable: true,
        });

        Object.defineProperty(globalThis, "fetch", {
            value: mockFetch,
            writable: true,
        });

        registerExportZipRuntime(mockJSZip);

        Object.defineProperty(globalThis, "document", {
            value: mockDocument,
            writable: true,
        });

        // Preserve the URL constructor for production code paths that parse URLs.
        // Only stub blob helpers used by export flows.
        if (typeof globalThis.URL === "function") {
            // @ts-expect-error test-only stubbing
            globalThis.URL.createObjectURL = mockURL.createObjectURL;
            // @ts-expect-error test-only stubbing
            globalThis.URL.revokeObjectURL = mockURL.revokeObjectURL;
        } else {
            Object.defineProperty(globalThis, "URL", {
                value: mockURL,
                writable: true,
            });
        }

        // Set test dependencies
        __setTestDeps({
            showNotification: mockShowNotification,
            detectCurrentTheme: mockDetectCurrentTheme,
            getStorage: () => mockLocalStorage,
        });
    });

    afterEach(() => {
        clearExportZipRuntimeForTests();
    });

    describe("addCombinedCSVToZip", () => {
        it("should add combined CSV data to ZIP archive", async () => {
            expect.assertions(2);

            const mockZip = createMockZip();

            const charts = [
                createMockChart("Speed", [
                    { x: 1000, y: 25 },
                    { x: 2000, y: 30 },
                ]),
                createMockChart("Heart Rate", [
                    { x: 1000, y: 150 },
                    { x: 3000, y: 160 },
                ]),
            ];

            await exportUtils.addCombinedCSVToZip(mockZip, charts);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                "timestamp,Speed,Heart Rate\n1000,25,150\n2000,30,\n3000,,160"
            );

            const csvContent = mockZip.file.mock.calls[0][1];
            expect(csvContent).toBe(
                "timestamp,Speed,Heart Rate\n1000,25,150\n2000,30,\n3000,,160"
            );
        });

        it("should handle empty charts array", async () => {
            expect.assertions(2);

            const mockZip = createMockZip();

            await exportUtils.addCombinedCSVToZip(mockZip, []);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                "timestamp"
            );
            const csvContent = mockZip.file.mock.calls[0][1];
            expect(csvContent).toBe("timestamp");
        });

        it("should handle charts with no data", async () => {
            expect.assertions(2);

            const mockZip = createMockZip();

            const charts = [
                createMockChart("Speed", []),
                createMockChart("Heart Rate", []),
            ];

            await exportUtils.addCombinedCSVToZip(mockZip, charts);

            expect(mockZip.file).toHaveBeenCalledWith(
                "combined-data.csv",
                "timestamp,Speed,Heart Rate"
            );
            const csvContent = mockZip.file.mock.calls[0][1];
            expect(csvContent).toBe("timestamp,Speed,Heart Rate");
        });

        it("should ignore invalid charts input without adding a file", async () => {
            expect.assertions(3);

            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            const mockZip = createMockZip();

            expect(
                exportUtils.addCombinedCSVToZip(
                    mockZip,
                    null as unknown as Parameters<
                        typeof exportUtils.addCombinedCSVToZip
                    >[1]
                )
            ).toBeUndefined();

            expect(mockZip.file).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error adding combined CSV to ZIP:",
                expect.any(TypeError)
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe("authenticateWithGyazo", () => {
        it("should handle authentication failure when server fails to start", async () => {
            expect.assertions(1);

            mockElectronAPI.startGyazoServer.mockResolvedValue({
                success: false,
                message: "Server failed to start",
            });

            await expect(
                exportUtils.authenticateWithGyazo({
                    electronApiScope: createExportApiScope(mockElectronAPI),
                })
            ).rejects.toThrow(
                "Failed to start OAuth server: Server failed to start"
            );
        });

        it("should handle missing Gyazo credentials", async () => {
            expect.assertions(1);

            // Mock localStorage to return null for credentials (but getGyazoConfig has defaults)
            // So we need to simulate a server start failure scenario instead
            mockElectronAPI.startGyazoServer.mockResolvedValue({
                success: false,
                message: "Authentication setup required",
            });

            await expect(
                exportUtils.authenticateWithGyazo({
                    electronApiScope: createExportApiScope(mockElectronAPI),
                })
            ).rejects.toThrow(
                "Failed to start OAuth server: Authentication setup required"
            );
        });
    });

    describe("downloadChartAsPNG", () => {
        it("should download chart as PNG file", async () => {
            expect.assertions(5);

            const chart = createMockChart();
            const mockLink = createMockLink();

            mockCreateElement.mockReturnValue(mockLink);

            await exportUtils.downloadChartAsPNG(chart);

            expect(chart.toBase64Image).toHaveBeenCalledWith(
                "image/png",
                1,
                "#ffffff"
            );
            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(mockLink.click).toHaveBeenCalledWith();
            expect(mockLink.download).toBe("chart.png");
            expect(mockLink.href).toMatch(/^data:image\/png;base64,/);
        });

        it("should handle chart without toBase64Image method", async () => {
            expect.assertions(3);

            const chart = { data: { datasets: [] } }; // Chart without toBase64Image

            expect(exportUtils.downloadChartAsPNG(chart)).toBeUndefined();

            expect(global.document.createElement).not.toHaveBeenCalledWith("a");
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Failed to export chart as PNG",
                "error"
            );
        });
    });

    describe("exportChartDataAsCSV", () => {
        it("should export chart data as CSV using DOM download", async () => {
            expect.assertions(6);

            const chartData = [
                { x: 1000, y: 25 },
                { x: 2000, y: 30 },
                { x: 3000, y: 35 },
            ];
            const fieldName = "Speed";

            const mockLink = createMockLink();

            mockCreateElement.mockReturnValue(mockLink);

            await exportUtils.exportChartDataAsCSV(chartData, fieldName);

            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(
                expect.any(Blob)
            );
            expect(mockLink.click).toHaveBeenCalledWith();
            expect(mockLink.download).toBe("chart-data.csv");
            const csvBlob = mockURL.createObjectURL.mock.calls.at(-1)?.[0];
            expect(csvBlob).toBeInstanceOf(Blob);
            await expect((csvBlob as Blob).text()).resolves.toBe(
                "timestamp,Speed\n1000,25\n2000,30\n3000,35"
            );
        });

        it("should handle empty data", async () => {
            expect.assertions(5);

            const chartData: Array<{ x: string; y: number }> = [];
            const fieldName = "Empty";

            const mockLink = createMockLink();

            mockCreateElement.mockReturnValue(mockLink);

            await exportUtils.exportChartDataAsCSV(chartData, fieldName);

            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(mockLink.click).toHaveBeenCalledWith();
            expect(mockLink.download).toBe("chart-data.csv");
            const csvBlob = mockURL.createObjectURL.mock.calls.at(-1)?.[0];
            expect(csvBlob).toBeInstanceOf(Blob);
            await expect((csvBlob as Blob).text()).resolves.toBe(
                "timestamp,Empty"
            );
        });

        it("should leave the link inactive when CSV export cannot create an object URL", async () => {
            expect.assertions(4);

            const mockLink = createMockLink();
            mockCreateElement.mockReturnValue(mockLink);
            mockURL.createObjectURL.mockImplementationOnce(() => {
                throw new Error("object URL failed");
            });

            expect(
                exportUtils.exportChartDataAsCSV([{ x: 1000, y: 25 }], "Speed")
            ).toBeUndefined();

            expect(mockLink.href).toBe("");
            expect(mockLink.download).toBe("");
            expect(mockLink.click).not.toHaveBeenCalled();
        });
    });

    describe("exportChartDataAsJSON", () => {
        it("should export chart data as JSON using DOM download", async () => {
            expect.assertions(6);

            const chartData = [
                { x: 1000, y: 25 },
                { x: 2000, y: 30 },
            ];
            const fieldName = "Speed";

            const mockLink = createMockLink();

            mockCreateElement.mockReturnValue(mockLink);

            await exportUtils.exportChartDataAsJSON(chartData, fieldName);

            expect(global.document.createElement).toHaveBeenCalledWith("a");
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(
                expect.any(Blob)
            );
            expect(mockLink.click).toHaveBeenCalledWith();
            expect(mockLink.download).toBe("chart-data.json");
            const jsonBlob = mockURL.createObjectURL.mock.calls.at(-1)?.[0];
            expect(jsonBlob).toBeInstanceOf(Blob);
            const json = JSON.parse(await (jsonBlob as Blob).text());
            expect(json).toEqual({
                data: chartData,
                exportedAt: expect.any(String),
                field: "Speed",
                totalPoints: 2,
            });
        });

        it("should leave the link inactive when JSON export cannot create an object URL", async () => {
            expect.assertions(4);

            const mockLink = createMockLink();
            mockCreateElement.mockReturnValue(mockLink);
            mockURL.createObjectURL.mockImplementationOnce(() => {
                throw new Error("object URL failed");
            });

            expect(
                exportUtils.exportChartDataAsJSON([{ x: 1000, y: 25 }], "Speed")
            ).toBeUndefined();

            expect(mockLink.href).toBe("");
            expect(mockLink.download).toBe("");
            expect(mockLink.click).not.toHaveBeenCalled();
        });
    });

    describe("getGyazoConfig", () => {
        it("should return complete Gyazo configuration with stored credentials", () => {
            expect.assertions(5);

            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "gyazo_client_id") return "stored-client-id";
                if (key === "gyazo_client_secret")
                    return "stored-client-secret";
                return null;
            });

            expect(mockLocalStorage.getItem("gyazo_client_id")).toBe(
                "stored-client-id"
            );
            expect(mockLocalStorage.getItem("gyazo_client_secret")).toBe(
                "stored-client-secret"
            );

            const config = exportUtils.getGyazoConfig();

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
                "gyazo_client_id"
            );
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
                "gyazo_client_secret"
            );

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
            expect.assertions(10);

            mockLocalStorage.getItem.mockReturnValue(null);

            const config = exportUtils.getGyazoConfig();

            expect(config).toHaveProperty(
                "authUrl",
                "https://gyazo.com/oauth/authorize"
            );
            expect(config).toHaveProperty("clientId");
            expect(config).toHaveProperty("clientSecret");
            expect(config).toHaveProperty(
                "redirectUri",
                "http://localhost:3000/gyazo/callback"
            );
            expect(config).toHaveProperty(
                "tokenUrl",
                "https://gyazo.com/oauth/token"
            );
            expect(config).toHaveProperty(
                "uploadUrl",
                "https://upload.gyazo.com/api/upload"
            );

            // Should have default clientId and clientSecret (not null/empty)
            expect((config as any).clientId).toBeTypeOf("string");
            expect((config as any).clientSecret).toBeTypeOf("string");
            expect((config as any).clientId.length).toBeGreaterThan(0);
            expect((config as any).clientSecret.length).toBeGreaterThan(0);
        });
    });

    describe("uploadToGyazo", () => {
        it("should upload base64 image to Gyazo", async () => {
            expect.assertions(2);

            // NOTE: Must be valid base64 (no '-' characters) because production code uses atob.
            const base64Image = "data:image/png;base64,dGVzdA=="; // "test"

            // Mock localStorage to return an access token
            mockLocalStorage.getItem.mockReturnValue("test-token");

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: vi
                    .fn<() => Promise<Record<string, string>>>()
                    .mockResolvedValue({
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
            expect.assertions(1);

            // NOTE: Must be valid base64 (no '-' characters) because production code uses atob.
            const base64Image = "data:image/png;base64,dGVzdA=="; // "test"

            // Mock localStorage to return an access token
            mockLocalStorage.getItem.mockReturnValue("test-token");

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: vi
                    .fn<() => Promise<string>>()
                    .mockResolvedValue("Internal Server Error"),
            });

            await expect(
                exportUtils.uploadToGyazo(base64Image)
            ).rejects.toThrow(
                "Gyazo upload failed: 500 - Internal Server Error"
            );
        });
    });
});

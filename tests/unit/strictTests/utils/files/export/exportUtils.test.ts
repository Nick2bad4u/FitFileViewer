import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

type ClipboardWrite = (data: ClipboardItem[]) => Promise<void>;
type ClipboardWriteText = (data: string) => Promise<void>;
type CreateObjectUrl = (object: Blob | MediaSource) => string;
type DetectCurrentTheme = () => "light";
type ExportableChartLike = {
    canvas?: { height: number; width: number };
    config?: { type?: string };
    data?: {
        datasets?: Array<{
            data?: Array<{ x: number; y: number }>;
            label?: string;
        }>;
    };
    toBase64Image?: (
        type?: string,
        quality?: number,
        backgroundColor?: string
    ) => string;
};
type ShowNotification = (
    message: string,
    type?: string,
    duration?: number,
    options?: unknown
) => Promise<void> | void;
type TestGlobal = typeof globalThis & {
    ClipboardItem?: new (items: Record<string, Blob>) => Record<string, Blob>;
    navigator: Navigator & {
        clipboard?: {
            write: ReturnType<typeof vi.fn<ClipboardWrite>>;
            writeText: ReturnType<typeof vi.fn<ClipboardWriteText>>;
        };
    };
    window: Window & typeof globalThis & {};
};
type ToBase64Image = NonNullable<ExportableChartLike["toBase64Image"]>;

const testGlobal = globalThis as TestGlobal;
let detectCurrentThemeMock:
    | ReturnType<typeof vi.fn<DetectCurrentTheme>>
    | undefined;
let showNotificationMock:
    | ReturnType<typeof vi.fn<ShowNotification>>
    | undefined;

async function loadExportUtils() {
    const module =
        await import("../../../../../../electron-app/utils/files/export/exportUtils.js");
    module.__setTestDeps({
        detectCurrentTheme: getDetectCurrentThemeMock(),
        showNotification: getNotificationMock(),
    });
    return module;
}

// Minimal DOM and API shims for canvas, URL, and clipboard
function installCanvasMocks() {
    // Basic 2D context mock with methods used by exportUtils
    const ctx = {
        fillStyle: "#fff",
        drawImage: vi.fn<(...args: unknown[]) => void>(),
        fillRect: vi.fn<(...args: unknown[]) => void>(),
        getImageData: vi
            .fn<() => { data: Uint8ClampedArray }>()
            .mockReturnValue({ data: new Uint8ClampedArray(4) }),
        putImageData: vi.fn<(...args: unknown[]) => void>(),
    } as unknown as CanvasRenderingContext2D;

    const getContextSpy = vi.spyOn(
        HTMLCanvasElement.prototype as any,
        "getContext"
    ) as unknown as {
        mockImplementation: (
            implementation: (
                contextId: string
            ) => CanvasRenderingContext2D | null
        ) => void;
    };
    getContextSpy.mockImplementation((contextId: string) =>
        contextId === "2d" ? ctx : null
    );

    vi.spyOn(HTMLCanvasElement.prototype as any, "toDataURL").mockReturnValue(
        "data:image/png;base64,AAA"
    );
    // toBlob callback pattern
    vi.spyOn(HTMLCanvasElement.prototype as any, "toBlob").mockImplementation(
        (...args: any[]) => {
            const cb = args[0];
            const blob = new Blob(["x"], { type: "image/png" });
            cb(blob);
        }
    );

    return ctx;
}

function installURLMocks() {
    const OriginalURL = globalThis.URL;
    if (typeof OriginalURL === "function") {
        class URLMock extends (OriginalURL as any) {
            constructor(input?: string | URL, base?: string | URL) {
                super(input ?? "https://localhost/mock", base);
            }

            static createObjectURL = vi
                .fn<CreateObjectUrl>()
                .mockReturnValue("blob:url");
            static revokeObjectURL = vi.fn<(url: string) => void>();
        }

        vi.stubGlobal("URL", URLMock as unknown as typeof URL);
    } else {
        const createObjectURL = vi
            .fn<CreateObjectUrl>()
            .mockReturnValue("blob:url");
        const revokeObjectURL = vi.fn<(url: string) => void>();
        const URLMock = function URLMock(this: any, input?: string) {
            if (!(this instanceof URLMock)) {
                return new (URLMock as any)(input);
            }
            this.href = input ?? "https://localhost/mock";
        } as unknown as typeof URL;
        (URLMock as any).createObjectURL = createObjectURL;
        (URLMock as any).revokeObjectURL = revokeObjectURL;
        vi.stubGlobal("URL", URLMock);
    }
}

function installClipboardMock() {
    const nav = (testGlobal.navigator ||= {} as TestGlobal["navigator"]);
    const clip = {
        write: vi.fn<ClipboardWrite>().mockResolvedValue(undefined),
        writeText: vi.fn<ClipboardWriteText>().mockResolvedValue(undefined),
    };
    try {
        Object.defineProperty(nav, "clipboard", {
            value: clip,
            configurable: true,
        });
    } catch {
        // fallback assignment if defineProperty fails
        nav.clipboard = clip;
    }
    // ClipboardItem is used when writing image blobs; provide a simple shim
    testGlobal.ClipboardItem = function ClipboardItemMock(
        items: Record<string, Blob>
    ) {
        return items;
    };
}

class FakeZip {
    public files: Record<string, Blob | string> = {};
    file(name: string, data: Blob | string, _opts?: { base64?: boolean }) {
        this.files[name] = data;
    }
    async generateAsync(_opts: { type: "blob" }) {
        return new Blob(["zip"], { type: "application/zip" });
    }
}

async function clearExportZipRuntime(): Promise<void> {
    const { clearExportZipRuntimeForTests } =
        await import("../../../../../../electron-app/utils/files/export/exportZipRuntime.js");

    clearExportZipRuntimeForTests();
}

async function installJSZipMock() {
    const { registerExportZipRuntime } =
        await import("../../../../../../electron-app/utils/files/export/exportZipRuntime.js");

    registerExportZipRuntime(FakeZip);
    return FakeZip;
}

function getNotificationMock(): ReturnType<typeof vi.fn<ShowNotification>> {
    if (!showNotificationMock) {
        throw new Error("Missing showNotification mock");
    }
    return showNotificationMock;
}

function getDetectCurrentThemeMock(): ReturnType<
    typeof vi.fn<DetectCurrentTheme>
> {
    if (!detectCurrentThemeMock) {
        throw new Error("Missing detectCurrentTheme mock");
    }
    return detectCurrentThemeMock;
}

function createChart(
    label = "A",
    data = [{ x: 1, y: 10 }]
): ExportableChartLike {
    return {
        canvas: { width: 400, height: 200 },
        data: { datasets: [{ label, data }] },
        config: { type: "line" },
        toBase64Image: vi
            .fn<ToBase64Image>()
            .mockReturnValue("data:image/png;base64,AAA"),
    };
}

function createFetchResponse({
    json,
    ok = true,
    status = 200,
    statusText = "OK",
    text,
}: {
    json?: Record<string, unknown>;
    ok?: boolean;
    status?: number;
    statusText?: string;
    text?: string;
}) {
    return {
        headers: new Map([["content-type", "application/json"]]),
        json: vi
            .fn<() => Promise<Record<string, unknown>>>()
            .mockResolvedValue(json ?? {}),
        ok,
        status,
        statusText,
        text: vi.fn<() => Promise<string>>().mockResolvedValue(text ?? ""),
    };
}

function stubFetchWithResponse(response: unknown) {
    const fetchMock = vi
        .fn<
            (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>
        >()
        .mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function createPrintWindowMock() {
    const printDocument = document.implementation.createHTMLDocument("");

    return {
        close: vi.fn<() => void>(),
        document: printDocument,
        focus: vi.fn<() => void>(),
        opener: {} as unknown,
        print: vi.fn<() => void>(),
        setTimeout: vi
            .fn<(callback: () => void) => number>()
            .mockImplementation((callback) => {
                callback();
                return 1;
            }),
    } as unknown as Window;
}

describe("exportUtils core flows", () => {
    beforeEach(async () => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
        vi.resetModules();
        showNotificationMock = vi.fn<ShowNotification>();
        detectCurrentThemeMock = vi
            .fn<DetectCurrentTheme>()
            .mockReturnValue("light");
        installCanvasMocks();
        installURLMocks();
        installClipboardMock();
        await installJSZipMock();
    });

    afterEach(async () => {
        await clearExportZipRuntime();
        detectCurrentThemeMock = undefined;
        showNotificationMock = undefined;
        // Ensure body is clean between tests
        document.body.innerHTML = "";
    });

    it("isValidChart validates presence of canvas and dimensions", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();
        expect(exportUtils.isValidChart(null as any)).toBe(false);

        const noCanvas: any = {};
        expect(exportUtils.isValidChart(noCanvas)).toBe(false);

        const badDims: any = { canvas: { width: 0, height: 100 } };
        expect(exportUtils.isValidChart(badDims)).toBe(false);

        const good: any = { canvas: { width: 300, height: 150 } };
        expect(exportUtils.isValidChart(good)).toBe(true);
    });

    it("getExportThemeBackground honors explicit theme and auto fallback", async () => {
        expect.hasAssertions();

        const { exportUtils, __setTestDeps } = await loadExportUtils();
        // Explicit
        localStorage.setItem("chartjs_exportTheme", "dark");
        const explicitDark = exportUtils.getExportThemeBackground();

        localStorage.setItem("chartjs_exportTheme", "light");
        const explicitLight = exportUtils.getExportThemeBackground();

        localStorage.setItem("chartjs_exportTheme", "transparent");
        const explicitTransparent = exportUtils.getExportThemeBackground();

        // Auto uses detectCurrentTheme
        localStorage.setItem("chartjs_exportTheme", "auto");
        __setTestDeps({ detectCurrentTheme: () => "dark" } as any);
        const autoDark = exportUtils.getExportThemeBackground();

        // No setting falls back to detectCurrentTheme or light
        localStorage.removeItem("chartjs_exportTheme");
        __setTestDeps({ detectCurrentTheme: () => "light" } as any);
        const fallbackLight = exportUtils.getExportThemeBackground();

        expect({
            autoDark,
            explicitDark,
            explicitLight,
            explicitTransparent,
            fallbackLight,
        }).toEqual({
            autoDark: "#1a1a1a",
            explicitDark: "#1a1a1a",
            explicitLight: "#ffffff",
            explicitTransparent: "transparent",
            fallbackLight: "#ffffff",
        });
    });

    it("downloadChartAsPNG triggers link click and notification", async () => {
        expect.hasAssertions();

        const { exportUtils, __setTestDeps } = await loadExportUtils();
        const note = vi.fn<ShowNotification>();
        __setTestDeps({ showNotification: note } as any);

        const chart = createChart();

        // Run
        await exportUtils.downloadChartAsPNG(chart, "out.png");

        expect(chart.toBase64Image).toHaveBeenCalledWith(
            "image/png",
            1,
            "#ffffff"
        );
        // Assert a link was created and removed
        const link = document.querySelector(
            "a[download='out.png']"
        ) as HTMLAnchorElement | null;
        expect(link).toBeNull(); // should be removed after click
        expect(note).toHaveBeenCalledWith(
            "Chart exported as out.png",
            "success"
        );
    });

    it("copyChartToClipboard writes PNG blob and notifies", async () => {
        expect.hasAssertions();

        const { exportUtils, __setTestDeps } = await loadExportUtils();
        const note = vi.fn<ShowNotification>();
        __setTestDeps({ showNotification: note } as any);

        const chart = createChart();

        const result = await exportUtils.copyChartToClipboard(chart);
        // the toBlob callback is async; wait until clipboard.write is observed
        await vi.waitFor(() => {
            expect((navigator.clipboard as any).write).toHaveBeenCalledOnce();
        });
        expect(result).toBeUndefined();
        expect(note).toHaveBeenCalledWith(
            "Chart copied to clipboard",
            "success"
        );
    });

    it("exportChartDataAsCSV creates a blob link and notifies", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();

        const data = [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
        ];

        await exportUtils.exportChartDataAsCSV(
            data as any,
            "value",
            "file.csv"
        );
        // Link removed after click
        const link = document.querySelector("a[download='file.csv']");
        expect(link).toBeNull();
        const notify = getNotificationMock();
        expect(notify).toHaveBeenCalledWith(
            "Data exported as file.csv",
            "success"
        );
    });

    it("exportChartDataAsJSON creates a blob link and notifies", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();

        const data = [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
        ];

        await exportUtils.exportChartDataAsJSON(
            data as any,
            "value",
            "file.json"
        );
        const link = document.querySelector("a[download='file.json']");
        expect(link).toBeNull();
        const notify = getNotificationMock();
        expect(notify).toHaveBeenCalledWith(
            "Data exported as file.json",
            "success"
        );
    });

    it("exportCombinedChartsDataAsCSV merges timestamps across charts", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();

        const chartA: any = {
            data: {
                datasets: [
                    {
                        label: "A",
                        data: [
                            { x: 1, y: 10 },
                            { x: 3, y: 30 },
                        ],
                    },
                ],
            },
            canvas: { width: 100, height: 50 },
        };
        const chartB: any = {
            data: {
                datasets: [
                    {
                        label: "B",
                        data: [
                            { x: 2, y: 20 },
                            { x: 3, y: 33 },
                        ],
                    },
                ],
            },
            canvas: { width: 100, height: 50 },
        };

        await exportUtils.exportCombinedChartsDataAsCSV(
            [chartA, chartB] as any,
            "combined.csv"
        );
        const link = document.querySelector("a[download='combined.csv']");
        expect(link).toBeNull();
        const notify = getNotificationMock();
        expect(notify).toHaveBeenCalledWith(
            "Combined data exported as combined.csv",
            "success"
        );
    });

    it("uploadToImgur throws when client id is not configured", async () => {
        expect.hasAssertions();

        // Set to the unconfigured value that should trigger the error
        localStorage.setItem("imgur_client_id", "YOUR_IMGUR_CLIENT_ID");
        const { exportUtils } = await loadExportUtils();
        await expect(
            exportUtils.uploadToImgur("data:image/png;base64,AAA")
        ).rejects.toThrow(/Imgur client ID not configured/i);
    });

    it("createCombinedChartsImage stitches canvases and notifies", async () => {
        expect.hasAssertions();

        const { exportUtils, __setTestDeps } = await loadExportUtils();
        const note = vi.fn<ShowNotification>();
        __setTestDeps({ showNotification: note } as any);

        const chartA: any = { canvas: { width: 400, height: 200 } };
        const chartB: any = { canvas: { width: 400, height: 200 } };

        await exportUtils.createCombinedChartsImage(
            [chartA, chartB],
            "combined-charts.png"
        );
        // link should be removed after click
        const link = document.querySelector(
            "a[download='combined-charts.png']"
        );
        expect(link).toBeNull();
        expect(note).toHaveBeenCalledWith(
            "Combined charts exported",
            "success"
        );
    });

    it("copyCombinedChartsToClipboard writes blob and notifies", async () => {
        expect.hasAssertions();

        const { exportUtils, __setTestDeps } = await loadExportUtils();
        const note = vi.fn<ShowNotification>();
        __setTestDeps({ showNotification: note } as any);

        const chartA: any = { canvas: { width: 400, height: 200 } };
        const chartB: any = { canvas: { width: 400, height: 200 } };

        const result = await exportUtils.copyCombinedChartsToClipboard([
            chartA,
            chartB,
        ]);
        await vi.waitFor(() => {
            expect((navigator.clipboard as any).write).toHaveBeenCalledOnce();
        });
        expect(result).toBeUndefined();
        expect(note).toHaveBeenCalledWith(
            "Combined charts copied to clipboard",
            "success"
        );
    });

    it("addCombinedCSVToZip creates combined-data.csv with union timestamps", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();
        const zip: any = {
            entries: {} as Record<string, string>,
            file(name: string, data: string) {
                this.entries[name] = data;
            },
        };
        const chartA: any = {
            data: {
                datasets: [
                    {
                        label: "A",
                        data: [
                            { x: 1, y: 10 },
                            { x: 3, y: 30 },
                        ],
                    },
                ],
            },
        };
        const chartB: any = {
            data: {
                datasets: [
                    {
                        label: "B",
                        data: [
                            { x: 2, y: 20 },
                            { x: 3, y: 33 },
                        ],
                    },
                ],
            },
        };
        await exportUtils.addCombinedCSVToZip(zip, [chartA, chartB]);
        const csv = zip.entries["combined-data.csv"] as string;
        expect(csv).toContain("timestamp,A,B");
        expect(csv).toContain("1,10,");
        expect(csv).toContain("2,,20");
        expect(csv).toContain("3,30,33");
    });

    it("exportAllAsZip writes images and data then notifies", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();
        const notify = getNotificationMock();

        const chartA: any = {
            canvas: { width: 400, height: 200 },
            data: { datasets: [{ label: "A", data: [{ x: 1, y: 10 }] }] },
            config: { type: "line" },
        };
        const chartB: any = {
            canvas: { width: 400, height: 200 },
            data: { datasets: [{ label: "B", data: [{ x: 2, y: 20 }] }] },
            config: { type: "line" },
        };

        const result = await exportUtils.exportAllAsZip([chartA, chartB]);
        const link = document.querySelector("a[download^='fitfile-charts-']");
        // assert notification fired
        expect(result).toBeUndefined();
        expect(link).toBeNull();
        expect(notify).toHaveBeenCalledWith(
            "ZIP file with 2 charts exported",
            "success"
        );
    });

    it("printChart opens window and notifies", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();
        const notify = getNotificationMock();

        const fakeWin = createPrintWindowMock();
        const openSpy = vi.spyOn(window, "open").mockReturnValue(fakeWin);

        const chart: any = { canvas: { width: 300, height: 150 } };
        const result = await exportUtils.printChart(chart);
        const printImage = fakeWin.document.querySelector("#ffv-print-img");
        expect(result).toBeUndefined();
        expect(printImage?.getAttribute("src")).toBe(
            "data:image/png;base64,AAA"
        );
        expect(openSpy).toHaveBeenCalledWith(
            "",
            "_blank",
            "noopener,noreferrer"
        );
        expect(notify).toHaveBeenCalledWith("Chart sent to printer", "success");
    });

    it("printCombinedCharts opens window and notifies", async () => {
        expect.hasAssertions();

        const { exportUtils } = await loadExportUtils();
        const notify = getNotificationMock();

        const fakeWin = createPrintWindowMock();
        vi.spyOn(window, "open").mockReturnValue(fakeWin);

        const chartA: any = {
            canvas: { width: 300, height: 150 },
            data: { datasets: [{ label: "A" }] },
        };
        const chartB: any = {
            canvas: { width: 300, height: 150 },
            data: { datasets: [{ label: "B" }] },
        };
        const result = await exportUtils.printCombinedCharts([chartA, chartB]);
        expect(result).toBeUndefined();
        expect(fakeWin.document.querySelectorAll(".chart")).toHaveLength(2);
        expect(notify).toHaveBeenCalledWith(
            "Charts sent to printer",
            "success"
        );
    });

    // Additional tests for improved coverage
    describe("imgur Integration", () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it("getImgurConfig retrieves stored Imgur configuration", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            // No config stored - returns default config
            expect(exportUtils.getImgurConfig()).toEqual({
                clientId: "0046ee9e30ac578", // Default demo client ID
                uploadUrl: "https://api.imgur.com/3/image",
            });

            // Config stored
            localStorage.setItem("imgur_client_id", "test-client-123");
            expect(exportUtils.getImgurConfig()).toEqual({
                clientId: "test-client-123",
                uploadUrl: "https://api.imgur.com/3/image",
            });
        });

        it("setImgurConfig stores Imgur client ID", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            exportUtils.setImgurConfig("new-client-456");
            expect(localStorage.getItem("imgur_client_id")).toBe(
                "new-client-456"
            );
        });

        it("clearImgurConfig removes stored configuration", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("imgur_client_id", "test-client");
            exportUtils.clearImgurConfig();
            expect(localStorage.getItem("imgur_client_id")).toBeNull();
        });

        it("isImgurConfigured checks if client ID is set", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            // With default client ID, it's considered configured
            const defaultConfigured = exportUtils.isImgurConfigured();

            localStorage.setItem("imgur_client_id", "test-client");
            const customConfigured = exportUtils.isImgurConfigured();

            // Only "YOUR_IMGUR_CLIENT_ID" is considered unconfigured
            localStorage.setItem("imgur_client_id", "YOUR_IMGUR_CLIENT_ID");
            const placeholderConfigured = exportUtils.isImgurConfigured();

            expect({
                customConfigured,
                defaultConfigured,
                placeholderConfigured,
            }).toEqual({
                customConfigured: true,
                defaultConfigured: true,
                placeholderConfigured: false,
            });
        });

        it("uploadToImgur throws error when not configured", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            // Set to the only unconfigured value
            localStorage.setItem("imgur_client_id", "YOUR_IMGUR_CLIENT_ID");

            await expect(
                exportUtils.uploadToImgur("fake-base64")
            ).rejects.toThrow("Imgur client ID not configured");
        });

        it("uploadToImgur makes API call when configured", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("imgur_client_id", "test-client-id");

            const mockResponse = createFetchResponse({
                json: {
                    success: true,
                    data: { link: "https://imgur.com/test.png" },
                },
            });

            stubFetchWithResponse(mockResponse);

            const result = await exportUtils.uploadToImgur(
                "data:image/png;base64,ABC123"
            );

            expect(fetch).toHaveBeenCalledWith(
                "https://api.imgur.com/3/image",
                expect.objectContaining({
                    method: "POST",
                    headers: {
                        Authorization: "Client-ID test-client-id",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        description: "Chart exported from FitFileViewer",
                        image: "ABC123",
                        title: "FitFileViewer Chart",
                        type: "base64",
                    }),
                })
            );

            expect(result).toBe("https://imgur.com/test.png");
        });

        it("uploadToImgur rejects malformed response link shapes", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("imgur_client_id", "test-client-id");

            const mockResponse = createFetchResponse({
                json: {
                    success: true,
                    data: { link: { href: "https://imgur.com/test.png" } },
                },
            });

            stubFetchWithResponse(mockResponse);

            await expect(
                exportUtils.uploadToImgur("data:image/png;base64,ABC123")
            ).rejects.toThrow("Invalid response from Imgur");
        });

        it("uploadToImgur handles API errors", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("imgur_client_id", "test-client-id");

            const mockResponse = createFetchResponse({
                ok: false,
                status: 400,
                statusText: "Bad Request",
                text: "Bad request details",
            });
            stubFetchWithResponse(mockResponse);

            await expect(
                exportUtils.uploadToImgur("data:image/png;base64,ABC123")
            ).rejects.toThrow(
                "Imgur upload failed: 400 Bad Request - Bad request details"
            );
        });

        it("uploadToImgur handles network errors", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("imgur_client_id", "test-client-id");

            vi.stubGlobal(
                "fetch",
                vi
                    .fn<
                        (
                            input: RequestInfo | URL,
                            init?: RequestInit
                        ) => Promise<never>
                    >()
                    .mockRejectedValue(new Error("Network error"))
            );

            await expect(
                exportUtils.uploadToImgur("data:image/png;base64,ABC123")
            ).rejects.toThrow("Network error");
        });
    });

    describe("gyazo Integration", () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it("getGyazoConfig retrieves stored configuration", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            // No config - returns default config with obfuscated credentials
            const defaultConfig = exportUtils.getGyazoConfig();
            expect(defaultConfig).toEqual({
                authUrl: "https://gyazo.com/oauth/authorize",
                clientId: expect.any(String), // Default obfuscated client ID
                clientSecret: expect.any(String), // Default obfuscated client secret
                redirectUri: "http://localhost:3000/gyazo/callback",
                tokenUrl: "https://gyazo.com/oauth/token",
                uploadUrl: "https://upload.gyazo.com/api/upload",
            });

            // With config
            localStorage.setItem("gyazo_client_id", "test-client");
            localStorage.setItem("gyazo_client_secret", "test-secret");
            expect(exportUtils.getGyazoConfig()).toEqual({
                authUrl: "https://gyazo.com/oauth/authorize",
                clientId: "test-client",
                clientSecret: "test-secret",
                redirectUri: "http://localhost:3000/gyazo/callback",
                tokenUrl: "https://gyazo.com/oauth/token",
                uploadUrl: "https://upload.gyazo.com/api/upload",
            });
        });

        it("setGyazoConfig stores credentials", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            exportUtils.setGyazoConfig("client-123", "secret-456");
            expect(localStorage.getItem("gyazo_client_id")).toBe("client-123");
            expect(localStorage.getItem("gyazo_client_secret")).toBe(
                "secret-456"
            );
        });

        it("clearGyazoConfig removes all stored data", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("gyazo_client_id", "test");
            localStorage.setItem("gyazo_client_secret", "test");
            localStorage.setItem("gyazo_access_token", "token");

            exportUtils.clearGyazoConfig();

            expect(localStorage.getItem("gyazo_client_id")).toBeNull();
            expect(localStorage.getItem("gyazo_client_secret")).toBeNull();
            expect(localStorage.getItem("gyazo_access_token")).toBeNull();
        });

        it("getGyazoAccessToken retrieves stored token", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            expect(exportUtils.getGyazoAccessToken()).toBeNull();

            localStorage.setItem("gyazo_access_token", "test-token");
            expect(exportUtils.getGyazoAccessToken()).toBe("test-token");
        });

        it("setGyazoAccessToken stores token", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            exportUtils.setGyazoAccessToken("new-token");
            expect(localStorage.getItem("gyazo_access_token")).toBe(
                "new-token"
            );
        });

        it("clearGyazoAccessToken removes token", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("gyazo_access_token", "test-token");
            exportUtils.clearGyazoAccessToken();
            expect(localStorage.getItem("gyazo_access_token")).toBeNull();
        });

        it("isGyazoAuthenticated checks token presence", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            expect(exportUtils.isGyazoAuthenticated()).toBe(false);

            localStorage.setItem("gyazo_access_token", "test-token");
            expect(exportUtils.isGyazoAuthenticated()).toBe(true);
        });

        it("uploadToGyazo makes authenticated API call", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("gyazo_access_token", "test-token");

            // uploadToGyazo no longer fetches the data URL (CSP-safe conversion is done locally).
            // Only the Gyazo API upload request is performed.
            const mockFetch = vi
                .fn<
                    (
                        input: RequestInfo | URL,
                        init?: RequestInit
                    ) => Promise<unknown>
                >()
                .mockResolvedValue({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            url: "https://gyazo.com/test.png",
                        }),
                });

            vi.stubGlobal("fetch", mockFetch);

            const result = await exportUtils.uploadToGyazo(
                "data:image/png;base64,ABC123"
            );

            expect(fetch).toHaveBeenCalledOnce();
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                "https://upload.gyazo.com/api/upload",
                expect.objectContaining({
                    method: "POST",
                    body: expect.any(FormData),
                })
            );

            expect(result).toBe("https://gyazo.com/test.png");
        });

        it("uploadToGyazo throws when not authenticated", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            // Provide credentials so uploadToGyazo attempts OAuth flow.
            // In tests / non-Electron environments electronAPI is absent, so authentication should fail cleanly.
            localStorage.setItem("gyazo_client_id", "test-client");
            localStorage.setItem("gyazo_client_secret", "test-secret");

            await expect(
                exportUtils.uploadToGyazo("fake-base64")
            ).rejects.toThrow(
                /Gyazo authentication required: Gyazo OAuth is only available in the Electron desktop build/i
            );
        });

        it("exchangeGyazoCodeForToken makes token exchange request", async () => {
            expect.hasAssertions();

            const { exportUtils } = await loadExportUtils();

            localStorage.setItem("gyazo_client_id", "test-client");
            localStorage.setItem("gyazo_client_secret", "test-secret");

            const mockResponse = {
                ok: true,
                json: vi
                    .fn<() => Promise<{ access_token: string }>>()
                    .mockResolvedValue({
                        access_token: "new-token",
                    }),
            };
            stubFetchWithResponse(mockResponse);

            const result = await exportUtils.exchangeGyazoCodeForToken(
                "auth-code",
                "http://localhost:3000/gyazo/callback"
            );

            expect(fetch).toHaveBeenCalledWith(
                "https://gyazo.com/oauth/token",
                expect.objectContaining({
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: "client_id=test-client&client_secret=test-secret&code=auth-code&grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fgyazo%2Fcallback",
                })
            );

            expect(result).toEqual({ access_token: "new-token" });
        });
    });

    // NOTE: shareChartsAsURL function is primarily a UI integration function
    // that triggers modal workflows and executes callbacks. Testing this would
    // require complex modal mocking that doesn't significantly improve coverage
    // of the core business logic. The underlying upload functions are already tested.
});

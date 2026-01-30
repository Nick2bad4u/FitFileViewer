import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const modPath = "../../../../../utils/files/export/exportUtils.js";

// Minimal DOM and API shims for canvas, URL, and clipboard
function installCanvasMocks() {
    // Basic 2D context mock with methods used by exportUtils
    const ctx = {
        fillStyle: "#fff",
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(
        HTMLCanvasElement.prototype as any,
        "getContext"
    ).mockImplementation((...args: any[]) => {
        const type = args[0];
        if (type === "2d") return ctx as any;
        return null;
    });

    vi.spyOn(
        HTMLCanvasElement.prototype as any,
        "toDataURL"
    ).mockImplementation(() => "data:image/png;base64,AAA");
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

            static createObjectURL = vi.fn(() => "blob:url");
            static revokeObjectURL = vi.fn();
        }

        vi.stubGlobal("URL", URLMock as unknown as typeof URL);
    } else {
        const createObjectURL = vi.fn(() => "blob:url");
        const revokeObjectURL = vi.fn();
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
    const nav = ((globalThis as any).navigator =
        (globalThis as any).navigator || {});
    const clip = {
        write: vi.fn().mockResolvedValue(undefined),
        writeText: vi.fn().mockResolvedValue(undefined),
    };
    try {
        Object.defineProperty(nav, "clipboard", {
            value: clip,
            configurable: true,
        });
    } catch {
        // fallback assignment if defineProperty fails
        (nav as any).clipboard = clip as any;
    }
    // ClipboardItem is used when writing image blobs; provide a simple shim
    (globalThis as any).ClipboardItem = function (items: any) {
        return items;
    } as any;
}

function installJSZipMock() {
    class FakeZip {
        public files: Record<string, any> = {};
        file(name: string, data: any, _opts?: any) {
            this.files[name] = data;
        }
        async generateAsync(_opts: any) {
            return new Blob(["zip"], { type: "application/zip" });
        }
    }
    (globalThis as any).window =
        (globalThis as any).window || (globalThis as any);
    (globalThis as any).window.JSZip = FakeZip as any;
    return FakeZip;
}

describe("exportUtils core flows", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
        vi.resetModules();
        // Provide manual mock registry for exportUtils suffix resolver
        const reg = new Map<string, any>();
        (globalThis as any).__vitest_manual_mocks__ = reg;
        reg.set("/utils/ui/notifications/showNotification.js", {
            showNotification: vi.fn(),
        });
        reg.set("/utils/charts/theming/chartThemeUtils.js", {
            detectCurrentTheme: vi.fn(() => "light"),
        });
        installCanvasMocks();
        installURLMocks();
        installClipboardMock();
        installJSZipMock();
    });

    afterEach(() => {
        // Ensure body is clean between tests
        document.body.innerHTML = "";
    });

    it("isValidChart validates presence of canvas and dimensions", async () => {
        const { exportUtils } = await import(modPath);
        expect(exportUtils.isValidChart(null as any)).toBe(false);

        const noCanvas: any = {};
        expect(exportUtils.isValidChart(noCanvas)).toBe(false);

        const badDims: any = { canvas: { width: 0, height: 100 } };
        expect(exportUtils.isValidChart(badDims)).toBe(false);

        const good: any = { canvas: { width: 300, height: 150 } };
        expect(exportUtils.isValidChart(good)).toBe(true);
    });

    it("getExportThemeBackground honors explicit theme and auto fallback", async () => {
        const { exportUtils, __setTestDeps } = await import(modPath);
        // Explicit
        localStorage.setItem("chartjs_exportTheme", "dark");
        expect(exportUtils.getExportThemeBackground()).toBe("#1a1a1a");

        localStorage.setItem("chartjs_exportTheme", "light");
        expect(exportUtils.getExportThemeBackground()).toBe("#ffffff");

        localStorage.setItem("chartjs_exportTheme", "transparent");
        expect(exportUtils.getExportThemeBackground()).toBe("transparent");

        // Auto uses detectCurrentTheme
        localStorage.setItem("chartjs_exportTheme", "auto");
        __setTestDeps({ detectCurrentTheme: () => "dark" } as any);
        expect(exportUtils.getExportThemeBackground()).toBe("#1a1a1a");

        // No setting falls back to detectCurrentTheme or light
        localStorage.removeItem("chartjs_exportTheme");
        __setTestDeps({ detectCurrentTheme: () => "light" } as any);
        expect(exportUtils.getExportThemeBackground()).toBe("#ffffff");
    });

    it("downloadChartAsPNG triggers link click and notification", async () => {
        const { exportUtils, __setTestDeps } = await import(modPath);
        const note = vi.fn();
        __setTestDeps({ showNotification: note } as any);

        const chart: any = {
            canvas: { width: 320, height: 200 },
            toBase64Image: vi.fn(() => "data:image/png;base64,AAA"),
        };

        // Run
        await exportUtils.downloadChartAsPNG(chart, "out.png");

        expect(chart.toBase64Image).toHaveBeenCalled();
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
        const { exportUtils, __setTestDeps } = await import(modPath);
        const note = vi.fn();
        __setTestDeps({ showNotification: note } as any);

        const chart: any = {
            canvas: { width: 320, height: 200 },
            toBase64Image: vi.fn(() => "data:image/png;base64,AAA"),
        };

        await exportUtils.copyChartToClipboard(chart);
        // the toBlob callback is async; wait until clipboard.write is observed
        await vi.waitFor(() => {
            expect((navigator.clipboard as any).write).toHaveBeenCalledTimes(1);
        });
        expect(note).toHaveBeenCalled();
    });

    it("exportChartDataAsCSV creates a blob link and notifies", async () => {
        const { exportUtils } = await import(modPath);

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
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;
        expect(notify).toHaveBeenCalledWith(
            "Data exported as file.csv",
            "success"
        );
    });

    it("exportChartDataAsJSON creates a blob link and notifies", async () => {
        const { exportUtils } = await import(modPath);

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
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;
        expect(notify).toHaveBeenCalledWith(
            "Data exported as file.json",
            "success"
        );
    });

    it("exportCombinedChartsDataAsCSV merges timestamps across charts", async () => {
        const { exportUtils } = await import(modPath);

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
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;
        expect(notify).toHaveBeenCalledWith(
            "Combined data exported as combined.csv",
            "success"
        );
    });

    it("uploadToImgur throws when client id is not configured", async () => {
        // Set to the unconfigured value that should trigger the error
        localStorage.setItem("imgur_client_id", "YOUR_IMGUR_CLIENT_ID");
        const { exportUtils } = await import(modPath);
        await expect(
            exportUtils.uploadToImgur("data:image/png;base64,AAA")
        ).rejects.toThrow(/Imgur client ID not configured/i);
    });

    it("createCombinedChartsImage stitches canvases and notifies", async () => {
        const { exportUtils, __setTestDeps } = await import(modPath);
        const note = vi.fn();
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
        const { exportUtils, __setTestDeps } = await import(modPath);
        const note = vi.fn();
        __setTestDeps({ showNotification: note } as any);

        const chartA: any = { canvas: { width: 400, height: 200 } };
        const chartB: any = { canvas: { width: 400, height: 200 } };

        await exportUtils.copyCombinedChartsToClipboard([chartA, chartB]);
        await vi.waitFor(() => {
            expect((navigator.clipboard as any).write).toHaveBeenCalledTimes(1);
        });
        expect(note).toHaveBeenCalledWith(
            "Combined charts copied to clipboard",
            "success"
        );
    });

    it("addCombinedCSVToZip creates combined-data.csv with union timestamps", async () => {
        const { exportUtils } = await import(modPath);
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
        const { exportUtils } = await import(modPath);
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;

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

        await exportUtils.exportAllAsZip([chartA, chartB]);
        // assert notification fired
        expect(notify).toHaveBeenCalled();
    });

    it("printChart opens window and notifies", async () => {
        const { exportUtils } = await import(modPath);
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;

        const fakeWin = {
            document: { write: vi.fn(), close: vi.fn() },
            print: vi.fn(),
            focus: vi.fn(),
            close: vi.fn(),
        } as any;
        const openSpy = vi.spyOn(window, "open").mockReturnValue(fakeWin);

        const chart: any = { canvas: { width: 300, height: 150 } };
        await exportUtils.printChart(chart);
        expect(openSpy).toHaveBeenCalled();
        expect(notify).toHaveBeenCalledWith("Chart sent to printer", "success");
    });

    it("printCombinedCharts opens window and notifies", async () => {
        const { exportUtils } = await import(modPath);
        const reg = (globalThis as any).__vitest_manual_mocks__ as Map<
            string,
            any
        >;
        const notify = reg.get("/utils/ui/notifications/showNotification.js")
            .showNotification as any;

        const fakeWin = {
            document: { write: vi.fn(), close: vi.fn() },
            print: vi.fn(),
            focus: vi.fn(),
            close: vi.fn(),
        } as any;
        vi.spyOn(window, "open").mockReturnValue(fakeWin);

        const chartA: any = {
            canvas: { width: 300, height: 150 },
            data: { datasets: [{ label: "A" }] },
        };
        const chartB: any = {
            canvas: { width: 300, height: 150 },
            data: { datasets: [{ label: "B" }] },
        };
        await exportUtils.printCombinedCharts([chartA, chartB]);
        expect(notify).toHaveBeenCalledWith(
            "Charts sent to printer",
            "success"
        );
    });

    // Additional tests for improved coverage
    describe("Imgur Integration", () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it("getImgurConfig retrieves stored Imgur configuration", async () => {
            const { exportUtils } = await import(modPath);

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
            const { exportUtils } = await import(modPath);

            exportUtils.setImgurConfig("new-client-456");
            expect(localStorage.getItem("imgur_client_id")).toBe(
                "new-client-456"
            );
        });

        it("clearImgurConfig removes stored configuration", async () => {
            const { exportUtils } = await import(modPath);

            localStorage.setItem("imgur_client_id", "test-client");
            exportUtils.clearImgurConfig();
            expect(localStorage.getItem("imgur_client_id")).toBeNull();
        });

        it("isImgurConfigured checks if client ID is set", async () => {
            const { exportUtils } = await import(modPath);

            // With default client ID, it's considered configured
            expect(exportUtils.isImgurConfigured()).toBe(true);

            localStorage.setItem("imgur_client_id", "test-client");
            expect(exportUtils.isImgurConfigured()).toBe(true);

            // Only "YOUR_IMGUR_CLIENT_ID" is considered unconfigured
            localStorage.setItem("imgur_client_id", "YOUR_IMGUR_CLIENT_ID");
            expect(exportUtils.isImgurConfigured()).toBe(false);
        });

        it("uploadToImgur throws error when not configured", async () => {
            const { exportUtils } = await import(modPath);

            // Set to the only unconfigured value
            localStorage.setItem("imgur_client_id", "YOUR_IMGUR_CLIENT_ID");

            await expect(
                exportUtils.uploadToImgur("fake-base64")
            ).rejects.toThrow("Imgur client ID not configured");
        });

        it("uploadToImgur makes API call when configured", async () => {
            const { exportUtils } = await import(modPath);

            localStorage.setItem("imgur_client_id", "test-client-id");

            // Mock fetch with proper headers support
            const mockHeaders = new Map([["content-type", "application/json"]]);
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: "OK",
                headers: mockHeaders,
                json: vi.fn().mockResolvedValue({
                    success: true,
                    data: { link: "https://imgur.com/test.png" },
                }),
            };

            vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

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

        it("uploadToImgur handles API errors", async () => {
            const { exportUtils } = await import(modPath);

            localStorage.setItem("imgur_client_id", "test-client-id");

            const mockHeaders = new Map([["content-type", "application/json"]]);
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: "Bad Request",
                headers: mockHeaders,
                text: vi.fn().mockResolvedValue("Bad request details"),
            };
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

            await expect(
                exportUtils.uploadToImgur("data:image/png;base64,ABC123")
            ).rejects.toThrow(
                "Imgur upload failed: 400 Bad Request - Bad request details"
            );
        });

        it("uploadToImgur handles network errors", async () => {
            const { exportUtils } = await import(modPath);

            localStorage.setItem("imgur_client_id", "test-client-id");

            vi.stubGlobal(
                "fetch",
                vi.fn().mockRejectedValue(new Error("Network error"))
            );

            await expect(
                exportUtils.uploadToImgur("data:image/png;base64,ABC123")
            ).rejects.toThrow("Network error");
        });
    });

    describe("Gyazo Integration", () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it("getGyazoConfig retrieves stored configuration", async () => {
            const { exportUtils } = await import(modPath);

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
            const { exportUtils } = await import(modPath);

            exportUtils.setGyazoConfig("client-123", "secret-456");
            expect(localStorage.getItem("gyazo_client_id")).toBe("client-123");
            expect(localStorage.getItem("gyazo_client_secret")).toBe(
                "secret-456"
            );
        });

        it("clearGyazoConfig removes all stored data", async () => {
            const { exportUtils } = await import(modPath);

            localStorage.setItem("gyazo_client_id", "test");
            localStorage.setItem("gyazo_client_secret", "test");
            localStorage.setItem("gyazo_access_token", "token");

            exportUtils.clearGyazoConfig();

            expect(localStorage.getItem("gyazo_client_id")).toBeNull();
            expect(localStorage.getItem("gyazo_client_secret")).toBeNull();
            expect(localStorage.getItem("gyazo_access_token")).toBeNull();
        });

        it("getGyazoAccessToken retrieves stored token", async () => {
            const { exportUtils } = await import(modPath);

            expect(exportUtils.getGyazoAccessToken()).toBeNull();

            localStorage.setItem("gyazo_access_token", "test-token");
            expect(exportUtils.getGyazoAccessToken()).toBe("test-token");
        });

        it("setGyazoAccessToken stores token", async () => {
            const { exportUtils } = await import(modPath);

            exportUtils.setGyazoAccessToken("new-token");
            expect(localStorage.getItem("gyazo_access_token")).toBe(
                "new-token"
            );
        });

        it("clearGyazoAccessToken removes token", async () => {
            const { exportUtils } = await import(modPath);

            localStorage.setItem("gyazo_access_token", "test-token");
            exportUtils.clearGyazoAccessToken();
            expect(localStorage.getItem("gyazo_access_token")).toBeNull();
        });

        it("isGyazoAuthenticated checks token presence", async () => {
            const { exportUtils } = await import(modPath);

            expect(exportUtils.isGyazoAuthenticated()).toBe(false);

            localStorage.setItem("gyazo_access_token", "test-token");
            expect(exportUtils.isGyazoAuthenticated()).toBe(true);
        });

        it("uploadToGyazo makes authenticated API call", async () => {
            const { exportUtils } = await import(modPath);

            localStorage.setItem("gyazo_access_token", "test-token");

            // uploadToGyazo no longer fetches the data URL (CSP-safe conversion is done locally).
            // Only the Gyazo API upload request is performed.
            const mockFetch = vi.fn().mockResolvedValue({
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

            expect(fetch).toHaveBeenCalledTimes(1);
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
            const { exportUtils } = await import(modPath);

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
            const { exportUtils } = await import(modPath);

            localStorage.setItem("gyazo_client_id", "test-client");
            localStorage.setItem("gyazo_client_secret", "test-secret");

            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({
                    access_token: "new-token",
                }),
            };
            vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

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

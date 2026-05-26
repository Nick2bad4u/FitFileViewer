import { expect, test, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(__dirname, "../..");
const repositoryRoot = path.resolve(appRoot, "..");
const sampleFitPath = path.join(
    repositoryRoot,
    "fit-test-files",
    "_Fenton_Michigan_Afternoon_Ride_5_27_miles.fit"
);

const reportedFailureNeedles = [
    "Cannot read properties of undefined (reading 'NODE_ENV')",
    "navigator.cookieEnabled",
    "getRecordBoolean",
    "createMapThemeToggle] Error",
    "Error during chart rendering",
] as const;

test.describe("FitFileViewer Electron UI", () => {
    let electronApp: ElectronApplication;
    let page: Page;
    const failedRequests: string[] = [];
    const rendererMessages: string[] = [];
    const pageErrors: string[] = [];

    test.beforeAll(async () => {
        electronApp = await electron.launch({
            args: [appRoot, "--disable-http-cache"],
            cwd: appRoot,
            env: {
                ...process.env,
                ELECTRON_IS_DEV: "0",
                FFV_DISABLE_WEB_SECURITY: "false",
                NODE_ENV: "production",
            },
        });

        page = await electronApp.firstWindow();
        page.on("console", (message) => {
            const text = message.text();
            rendererMessages.push(text);
            if (message.type() === "error") {
                pageErrors.push(text);
            }
        });
        page.on("pageerror", (error) => {
            pageErrors.push(error.message);
        });
        page.on("requestfailed", (request) => {
            failedRequests.push(
                `${request.url()} ${request.failure()?.errorText ?? ""}`.trim()
            );
        });

        await page.waitForLoadState("domcontentloaded");
    });

    test.afterAll(async () => {
        await electronApp?.close();
    });

    test("starts with the main controls visible", async () => {
        await expect(page).toHaveTitle(/Fit File Viewer/u);
        await expect(page.locator("#open_file_btn")).toBeVisible();
        await expect(page.locator("#tabs")).toBeVisible();
        await expect(page.locator("#tab_map")).toHaveClass(/active/u);
        await expect(page.locator(".tab-button")).toHaveCount(7);

        const vendorGlobals = await page.evaluate(() => {
            const globalWindow = window as Window &
                Record<string, Record<string, unknown> | undefined>;

            return {
                hasArqueroTable:
                    typeof globalWindow.aq?.table === "function" &&
                    typeof globalWindow.arquero?.table === "function",
                hasChart:
                    typeof globalWindow.Chart === "function" &&
                    typeof globalWindow.Chart.register === "function",
                hasChartZoom:
                    typeof globalWindow.chartjsPluginZoom === "object" &&
                    globalWindow.chartjsPluginZoom !== null &&
                    globalWindow.chartjsPluginZoom.id === "zoom" &&
                    typeof globalWindow.ChartZoom === "object" &&
                    globalWindow.ChartZoom !== null &&
                    globalWindow.ChartZoom.id === "zoom",
                hasDomPurify:
                    typeof globalWindow.DOMPurify?.sanitize === "function",
                hasHammer: typeof globalWindow.Hammer === "function",
                hasJsZip: typeof globalWindow.JSZip === "function",
                hasJQueryDataTables:
                    typeof globalWindow.$ === "function" &&
                    typeof globalWindow.jQuery === "function" &&
                    typeof globalWindow.jQuery.fn?.DataTable === "function" &&
                    typeof globalWindow.DataTable === "function",
                hasScreenfull:
                    typeof globalWindow.screenfull === "object" &&
                    globalWindow.screenfull !== null &&
                    "isEnabled" in globalWindow.screenfull,
                isChartZoomRegistered:
                    typeof globalWindow.Chart === "function" &&
                    globalWindow.Chart.registry?.plugins?.get?.("zoom") !==
                        undefined,
                vendorBundleSource:
                    globalWindow.__FFV_RENDERER_VENDOR_BUNDLE__?.source,
            };
        });

        expect(vendorGlobals).toStrictEqual({
            hasArqueroTable: true,
            hasChart: true,
            hasChartZoom: true,
            hasDomPurify: true,
            hasHammer: true,
            hasJsZip: true,
            hasJQueryDataTables: true,
            hasScreenfull: true,
            isChartZoomRegistered: true,
            vendorBundleSource: "npm-bundle",
        });
    });

    test("renders a real FIT file across map, charts, data, and summary tabs", async () => {
        const fitBytes = Array.from(fs.readFileSync(sampleFitPath));

        const loadResult = await page.evaluate(
            async ({ filePath, bytes }) => {
                const api = window.electronAPI;
                if (!api?.parseFitFile) {
                    throw new Error(
                        "window.electronAPI.parseFitFile is not available"
                    );
                }
                if (typeof window.showFitData !== "function") {
                    throw new Error("window.showFitData is not available");
                }

                const data = await api.parseFitFile(
                    new Uint8Array(bytes).buffer
                );
                window.showFitData(data, filePath);

                return {
                    activeFileName: document
                        .querySelector("#active_file_name")
                        ?.textContent?.trim(),
                    globalRecordCount:
                        window.globalData?.recordMesgs?.length ?? 0,
                    globalSessionCount:
                        window.globalData?.sessionMesgs?.length ?? 0,
                    mapTabActive:
                        document
                            .querySelector("#tab_map")
                            ?.classList.contains("active") ?? false,
                    title: document.title,
                };
            },
            { bytes: fitBytes, filePath: sampleFitPath }
        );

        expect(loadResult.activeFileName).toContain(
            path.basename(sampleFitPath)
        );
        expect(loadResult).toMatchObject({
            globalRecordCount: 1285,
            globalSessionCount: 1,
            mapTabActive: true,
        });
        expect(loadResult.title).toContain(path.basename(sampleFitPath));

        await page.locator("#tab_map").click();
        await expect(page.locator("#leaflet-map")).toBeVisible();
        await expect(page.locator(".leaflet-control-layers")).toBeAttached();
        await expect(page.locator(".leaflet-control-scale")).toBeVisible();
        await expect(page.locator("#zoom-slider-input")).toBeVisible();
        await expect(
            page.getByRole("button", { name: /toggle map theme/iu })
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /print or export map/iu })
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /export gpx/iu })
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /elevation/iu })
        ).toBeVisible();

        const mapRuntime = await page.evaluate(() => {
            const globalWindow = window as Window &
                Record<string, Record<string, unknown> | undefined>;
            const layerLabels = Array.from(
                document.querySelectorAll(".leaflet-control-layers label"),
                (element) => element.textContent?.trim() ?? ""
            );

            return {
                hasLeafletControlLayers:
                    typeof globalWindow.L?.control?.layers === "function",
                hasLeafletMap: typeof globalWindow.L?.map === "function",
                hasMapLibreGlobal:
                    typeof globalWindow.maplibregl === "object" ||
                    typeof globalWindow.maplibregl === "function",
                hasMapLibreLeaflet:
                    typeof globalWindow.L?.maplibreGL === "function",
                layerLabels,
                routeElementCount: document.querySelectorAll(
                    ".leaflet-marker-icon, .leaflet-interactive"
                ).length,
            };
        });

        expect(mapRuntime.hasLeafletControlLayers).toBe(true);
        expect(mapRuntime.hasLeafletMap).toBe(true);
        expect(mapRuntime.hasMapLibreGlobal).toBe(true);
        expect(mapRuntime.hasMapLibreLeaflet).toBe(true);
        expect(mapRuntime.layerLabels.length).toBeGreaterThan(10);
        expect(
            mapRuntime.layerLabels.some((label) =>
                label.toLowerCase().includes("open free map")
            )
        ).toBe(true);
        expect(mapRuntime.routeElementCount).toBeGreaterThan(0);

        const gpxExport = await page.evaluate(async () => {
            const clickedDownloads: Array<{
                download: string;
                href: string;
            }> = [];
            const exportedBlobs: Array<{ size: number; type: string }> = [];
            const originalAnchorClick = HTMLAnchorElement.prototype.click;
            const originalCreateObjectUrl = URL.createObjectURL;
            const originalRevokeObjectUrl = URL.revokeObjectURL;

            HTMLAnchorElement.prototype.click = function click() {
                clickedDownloads.push({
                    download: this.download,
                    href: this.href,
                });
            };
            URL.createObjectURL = ((blob: Blob) => {
                exportedBlobs.push({ size: blob.size, type: blob.type });
                return "blob:ffv-playwright-gpx";
            }) as typeof URL.createObjectURL;
            URL.revokeObjectURL = (() =>
                undefined) as typeof URL.revokeObjectURL;

            try {
                const exportButton = Array.from(
                    document.querySelectorAll<HTMLButtonElement>(
                        ".map-action-btn"
                    )
                ).find((button) =>
                    button.textContent?.toLowerCase().includes("export gpx")
                );
                if (!exportButton) {
                    throw new Error("Export GPX button was not rendered");
                }

                exportButton.click();
                await new Promise((resolve) => setTimeout(resolve, 0));

                return {
                    clickedDownload: clickedDownloads.at(0),
                    exportedBlob: exportedBlobs.at(0),
                };
            } finally {
                HTMLAnchorElement.prototype.click = originalAnchorClick;
                URL.createObjectURL = originalCreateObjectUrl;
                URL.revokeObjectURL = originalRevokeObjectUrl;
            }
        });

        expect(gpxExport.clickedDownload?.download).toMatch(/\.gpx$/u);
        expect(gpxExport.clickedDownload?.href).toBe("blob:ffv-playwright-gpx");
        expect(gpxExport.exportedBlob?.size).toBeGreaterThan(0);
        expect(gpxExport.exportedBlob?.type).toContain("application/gpx+xml");

        const elevationPopup = await page.evaluate(async () => {
            const globalWindow = window as Window & { Chart?: unknown };
            const originalChart = globalWindow.Chart;
            const popupDocument =
                document.implementation.createHTMLDocument("");
            const originalOpen = window.open;
            const popupWindow = {
                document: popupDocument,
            } as Window & { Chart?: unknown };
            const chartConstructor = function chartConstructor(
                context: CanvasRenderingContext2D,
                config: unknown
            ) {
                void context;
                void config;
            };
            const chartMock = Object.assign(chartConstructor, {
                helpers: {
                    color: (color: string) => ({
                        alpha: (opacity: number) => ({
                            rgbString: () => `${color}:${opacity}`,
                        }),
                    }),
                },
            });

            globalWindow.Chart = chartMock;
            window.open = (() => popupWindow) as typeof window.open;

            try {
                const elevationButton = Array.from(
                    document.querySelectorAll<HTMLButtonElement>(
                        ".map-action-btn"
                    )
                ).find((button) =>
                    button.textContent?.toLowerCase().includes("elevation")
                );
                if (!elevationButton) {
                    throw new Error("Elevation button was not rendered");
                }

                elevationButton.click();
                await new Promise((resolve) => setTimeout(resolve, 0));

                return {
                    assignedChart: popupWindow.Chart === chartMock,
                    canvasCount: popupDocument.querySelectorAll(
                        ".elev-profile-canvas"
                    ).length,
                    containerExists:
                        popupDocument.querySelector("#elevChartsContainer") !==
                        null,
                    title: popupDocument.title,
                    vendorScriptCount: popupDocument.querySelectorAll(
                        "script[src*='vendor']"
                    ).length,
                };
            } finally {
                globalWindow.Chart = originalChart;
                window.open = originalOpen;
            }
        });

        expect(elevationPopup).toMatchObject({
            assignedChart: true,
            canvasCount: 1,
            containerExists: true,
            title: "Elevation Profiles",
            vendorScriptCount: 0,
        });

        await page.locator("#tab_chartjs").click();
        await expect(page.locator("#tab_chartjs")).toHaveClass(/active/u);
        await expect(page.locator("#content_chartjs")).toBeAttached();
        await expect(
            page.locator("#chartjs_chart_container canvas.chart-canvas").first()
        ).toBeVisible();

        const chartRuntimeHandle = await page.waitForFunction(() => {
            const globalWindow = window as Window & {
                _chartjsInstances?: Array<{ canvas?: HTMLCanvasElement }>;
            };
            const canvases = Array.from(
                document.querySelectorAll<HTMLCanvasElement>(
                    "#chartjs_chart_container canvas.chart-canvas"
                )
            );
            const instances = Array.isArray(globalWindow._chartjsInstances)
                ? globalWindow._chartjsInstances
                : [];

            if (canvases.length === 0 || instances.length === 0) {
                return null;
            }

            return {
                canvasCount: canvases.length,
                chartInstanceCount: instances.length,
                chartIds: canvases.map((canvas) => canvas.id),
            };
        });
        const chartRuntime = (await chartRuntimeHandle.jsonValue()) as {
            canvasCount: number;
            chartIds: string[];
            chartInstanceCount: number;
        } | null;

        expect(chartRuntime).toMatchObject({
            canvasCount: expect.any(Number),
            chartInstanceCount: expect.any(Number),
            chartIds: expect.arrayContaining([
                expect.stringMatching(/^chart/u),
            ]),
        });
        expect(chartRuntime?.canvasCount).toBeGreaterThan(0);
        expect(chartRuntime?.chartInstanceCount).toBeGreaterThan(0);

        for (const tabId of ["#tab_data", "#tab_summary"]) {
            await page.locator(tabId).click();
            await expect(page.locator(tabId)).toHaveClass(/active/u);
        }

        await expect(page.locator("#content_data")).toBeAttached();
        await expect(page.locator("#content_summary")).toBeAttached();

        await page.locator("#tab_data").click();
        const firstTableHeader = page
            .locator("#content_data .table-header")
            .first();
        await expect(firstTableHeader).toBeVisible();
        await firstTableHeader.click();
        await expect(
            page.locator("#content_data table.dataTable").first()
        ).toBeVisible();
        await expect(
            page.locator("#content_data .dt-container").first()
        ).toBeVisible();
    });

    test.afterAll(() => {
        const combinedMessages = [...rendererMessages, ...pageErrors];
        const matchedNeedles = reportedFailureNeedles.filter((needle) =>
            combinedMessages.some((message) => message.includes(needle))
        );

        expect(matchedNeedles).toEqual([]);
        expect(failedRequests).toEqual([]);
        expect(pageErrors).toEqual([]);
    });
});

import { expect, test, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const repositoryRoot = path.resolve(__dirname, "../..");
const appRoot = path.join(repositoryRoot, "electron-app");
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

const mapTileHosts = new Set([
    "basemaps.cartocdn.com",
    "server.arcgisonline.com",
    "tile.openstreetmap.org",
    "tile.openstreetmap.de",
    "tile.openstreetmap.fr",
    "tile.opentopomap.org",
    "tile.waymarkedtrails.org",
    "tiles.openfreemap.org",
    "tiles.openseamap.org",
    "tiles.openrailwaymap.org",
    "tile-cyclosm.openstreetmap.fr",
    "tile.thunderforest.com",
]);

function isIgnorableFailedRequest(url: string, errorText: string): boolean {
    if (!errorText.includes("ERR_ABORTED")) {
        return false;
    }

    try {
        const { hostname } = new URL(url);
        return (
            mapTileHosts.has(hostname) ||
            Array.from(mapTileHosts).some((host) =>
                hostname.endsWith(`.${host}`)
            )
        );
    } catch {
        return false;
    }
}

function formatCollectedEntries(entries: readonly string[]): string {
    return entries.map((entry, index) => `${index + 1}. ${entry}`).join("\n");
}

function expectNoCollectedEntries(
    label: string,
    entries: readonly string[]
): void {
    expect(
        entries,
        `${label}:${entries.length === 0 ? " none" : `\n${formatCollectedEntries(entries)}`}`
    ).toStrictEqual([]);
}

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
            const errorText = request.failure()?.errorText ?? "";
            const url = request.url();
            if (isIgnorableFailedRequest(url, errorText)) {
                return;
            }

            failedRequests.push(`${url} ${errorText}`.trim());
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

    test("opens a real FIT file through the Open File button", async () => {
        await electronApp.evaluate(({ dialog }, filePath) => {
            const mainGlobal = globalThis as typeof globalThis & {
                __ffvPlaywrightOriginalShowOpenDialog?: typeof dialog.showOpenDialog;
            };

            mainGlobal.__ffvPlaywrightOriginalShowOpenDialog ??=
                dialog.showOpenDialog;
            dialog.showOpenDialog = async () => ({
                canceled: false,
                filePaths: [filePath],
            });
        }, sampleFitPath);

        try {
            await page.waitForFunction(() => {
                const openButton = document.querySelector("#open_file_btn") as
                    | (HTMLButtonElement & {
                          __ffvLifecycleListenersCleanup?: unknown;
                      })
                    | null;

                return (
                    openButton !== null &&
                    !openButton.disabled &&
                    typeof openButton.__ffvLifecycleListenersCleanup ===
                        "function"
                );
            });
            await page.locator("#open_file_btn").click();

            await expect(page.locator("#active_file_name")).toContainText(
                path.basename(sampleFitPath)
            );
            await expect(page).toHaveTitle(
                new RegExp(path.basename(sampleFitPath), "u")
            );
            await expect(page.locator("#tab_map")).toHaveClass(/active/u);

            const openedFileState = await page.waitForFunction(() => {
                const recordCount = window.globalData?.recordMesgs?.length ?? 0;
                const sessionCount =
                    window.globalData?.sessionMesgs?.length ?? 0;

                if (recordCount === 0 || sessionCount === 0) {
                    return null;
                }

                return {
                    recordCount,
                    sessionCount,
                };
            });

            expect(await openedFileState.jsonValue()).toStrictEqual({
                recordCount: 1285,
                sessionCount: 1,
            });
        } finally {
            await electronApp.evaluate(({ dialog }) => {
                const mainGlobal = globalThis as typeof globalThis & {
                    __ffvPlaywrightOriginalShowOpenDialog?: typeof dialog.showOpenDialog;
                };

                if (mainGlobal.__ffvPlaywrightOriginalShowOpenDialog) {
                    dialog.showOpenDialog =
                        mainGlobal.__ffvPlaywrightOriginalShowOpenDialog;
                    delete mainGlobal.__ffvPlaywrightOriginalShowOpenDialog;
                }
            });
        }
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
            const runtimeFeatureChecks = {
                "Leaflet control layers":
                    typeof globalWindow.L?.control?.layers === "function",
                "Leaflet map factory":
                    typeof globalWindow.L?.map === "function",
                "MapLibre global":
                    typeof globalWindow.maplibregl === "object" ||
                    typeof globalWindow.maplibregl === "function",
                "MapLibre Leaflet bridge":
                    typeof globalWindow.L?.maplibreGL === "function",
            };

            return {
                layerLabels,
                missingRuntimeFeatures: Object.entries(runtimeFeatureChecks)
                    .filter(([, available]) => !available)
                    .map(([name]) => name),
                openFreeMapLabels: layerLabels.filter((label) =>
                    label.startsWith("Open Free Map ")
                ),
                routeElementCount: document.querySelectorAll(
                    ".leaflet-marker-icon, .leaflet-interactive"
                ).length,
            };
        });

        expect(mapRuntime.missingRuntimeFeatures).toStrictEqual([]);
        expect(mapRuntime.layerLabels).toHaveLength(33);
        expect(mapRuntime.openFreeMapLabels).toEqual([
            "Open Free Map Bright",
            "Open Free Map Dark",
            "Open Free Map Fiord",
            "Open Free Map Liberty",
            "Open Free Map Positron",
        ]);
        expect(mapRuntime.routeElementCount).toBe(58);

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
                for (let attempt = 0; attempt < 20; attempt += 1) {
                    if (
                        clickedDownloads.length > 0 &&
                        exportedBlobs.length > 0
                    ) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }

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
        expect(gpxExport.exportedBlob).toStrictEqual({
            size: 450_729,
            type: "application/gpx+xml;charset=utf-8",
        });

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

        expect(chartRuntime).toStrictEqual({
            canvasCount: 23,
            chartInstanceCount: 25,
            chartIds: [
                "chart-heartRate-1",
                "chart-power-2",
                "chart-cadence-3",
                "chart-temperature-4",
                "chart-distance-5",
                "chart-enhancedSpeed-6",
                "chart-enhancedAltitude-7",
                "chart-flow-8",
                "chart-grit-9",
                "chart-positionLat-10",
                "chart-positionLong-11",
                "chart-events-0",
                "chart-heart-rate-zones-0",
                "chart-power-zones-0",
                "chartjs-canvas-lap-hr-zones",
                "chartjs-canvas-lap-power-zones",
                "chartjs-canvas-single-lap-hr",
                "chartjs-canvas-single-lap-power",
                "chart-gps-track-0",
                "chart-gps-time-0",
                "chart-speed-vs-distance-0",
                "chart-power-vs-hr-0",
                "chart-altitude-profile-0",
            ],
        });

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
        const matchedReports = reportedFailureNeedles.flatMap((needle) =>
            combinedMessages
                .filter((message) => message.includes(needle))
                .map((message) => `${needle}: ${message}`)
        );

        expectNoCollectedEntries("Reported renderer failures", matchedReports);
        expectNoCollectedEntries("Unexpected request failures", failedRequests);
        expectNoCollectedEntries("Renderer page errors", pageErrors);
    });
});

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
                    throw new Error("window.electronAPI.parseFitFile is not available");
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
                    globalRecordCount: window.globalData?.recordMesgs?.length ?? 0,
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

        for (const tabId of ["#tab_chartjs", "#tab_data", "#tab_summary"]) {
            await page.locator(tabId).click();
            await expect(page.locator(tabId)).toHaveClass(/active/u);
        }

        await expect(page.locator("#content_chartjs")).toBeAttached();
        await expect(page.locator("#content_data")).toBeAttached();
        await expect(page.locator("#content_summary")).toBeAttached();

        await page.locator("#tab_data").click();
        const firstTableHeader = page.locator("#content_data .table-header").first();
        await expect(firstTableHeader).toBeVisible();
        await firstTableHeader.click();
        await expect(page.locator("#content_data table.dataTable").first()).toBeVisible();
        await expect(page.locator("#content_data .dt-container").first()).toBeVisible();
    });

    test.afterAll(() => {
        const combinedMessages = [...rendererMessages, ...pageErrors];
        const matchedNeedles = reportedFailureNeedles.filter((needle) =>
            combinedMessages.some((message) => message.includes(needle))
        );

        expect(matchedNeedles).toEqual([]);
        expect(pageErrors).toEqual([]);
    });
});

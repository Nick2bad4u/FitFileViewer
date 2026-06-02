import { expect, test, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

type ActivityUiState = {
    activeFileName: string;
    recordCount: number;
    sessionCount: number;
    title: string;
};

type FitFixtureFileState =
    | {
          byteLength: number;
          exists: true;
      }
    | {
          byteLength: null;
          exists: false;
      };

const repositoryRoot = path.resolve(__dirname, "../..");
const sampleFitFixture = {
    byteLength: 185_291,
    fileName: "_Fenton_Michigan_Afternoon_Ride_5_27_miles.fit",
    recordCount: 1285,
    sessionCount: 1,
} as const;
const sampleFitPath = path.join(
    repositoryRoot,
    "fit-test-files",
    sampleFitFixture.fileName
);
const sampleFitFileName = sampleFitFixture.fileName;
const missingFitPath = path.join(
    repositoryRoot,
    "fit-test-files",
    "__playwright_missing_file__.fit"
);
const sampleFitActivityState: ActivityUiState = {
    activeFileName: `Active:${sampleFitFileName}`,
    recordCount: sampleFitFixture.recordCount,
    sessionCount: sampleFitFixture.sessionCount,
    title: `Fit File Viewer - ${sampleFitFileName}`,
};

const reportedFailureNeedles = [
    "Cannot read properties of undefined (reading 'NODE_ENV')",
    "navigator.cookieEnabled",
    "getRecordBoolean",
    "createMapThemeToggle] Error",
    "Error during chart rendering",
] as const;

type MapThemeToggleState = {
    isActive: boolean;
    storageValue: null | string;
    title: string;
};

type CapturedDownload = {
    download: string;
    href: string;
};

function createElectronLaunchEnv({
    nodeEnvironment = "production",
}: {
    nodeEnvironment?: "production" | "unset";
} = {}): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        ELECTRON_IS_DEV: "0",
        FFV_DISABLE_WEB_SECURITY: "false",
    };

    if (nodeEnvironment === "unset") {
        delete env.NODE_ENV;
    } else {
        env.NODE_ENV = nodeEnvironment;
    }

    return env;
}

function getRequiredCapturedDownload(
    download: CapturedDownload | undefined
): CapturedDownload {
    if (!download) {
        throw new Error("Expected GPX export download to be captured");
    }

    return download;
}

function getFitFixtureFileState(filePath: string): FitFixtureFileState {
    if (!fs.existsSync(filePath)) {
        return {
            byteLength: null,
            exists: false,
        };
    }

    return {
        byteLength: fs.statSync(filePath).size,
        exists: true,
    };
}

const mapTileHosts = new Set([
    "basemaps.cartocdn.com",
    "server.arcgisonline.com",
    "tile.openstreetmap.org",
    "tile.openstreetmap.de",
    "tile.openstreetmap.fr",
    "tile.opentopomap.org",
    "tiles-eu.stadiamaps.com",
    "tiles-us.stadiamaps.com",
    "tile.waymarkedtrails.org",
    "tiles.openfreemap.org",
    "tiles.openseamap.org",
    "tiles.openrailwaymap.org",
    "tiles.stadiamaps.com",
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

async function resetRendererNotifications(page: Page): Promise<void> {
    await page.evaluate(async () => {
        const moduleUrl = new URL(
            "./utils/ui/notifications/showNotification.js",
            window.location.href
        ).href;
        // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to reset renderer notification state between Playwright tests.
        const notificationModule = (await import(moduleUrl)) as {
            __testResetNotifications?: () => void;
            clearAllNotifications?: () => void;
        };

        if (typeof notificationModule.__testResetNotifications === "function") {
            notificationModule.__testResetNotifications();
            return;
        }

        notificationModule.clearAllNotifications?.();
    });
}

function isExpectedMissingFitFileError(message: string): boolean {
    return (
        message.includes(path.basename(missingFitPath)) &&
        ((message.includes("HandleOpenFile: Failed to read file") &&
            message.includes("File not found.")) ||
            (message.includes("[FitFileState] File loading failed:") &&
                message.includes("ENOENT")))
    );
}

test.describe("FitFileViewer renderer environment fallbacks", () => {
    test("loads map controls when NODE_ENV is unset", async () => {
        const rendererMessages: string[] = [];
        const pageErrors: string[] = [];
        const noNodeEnvApp = await electron.launch({
            args: [repositoryRoot, "--disable-http-cache"],
            cwd: repositoryRoot,
            env: createElectronLaunchEnv({ nodeEnvironment: "unset" }),
        });

        try {
            const noNodeEnvPage = await noNodeEnvApp.firstWindow();
            noNodeEnvPage.on("console", (message) => {
                const text = message.text();
                rendererMessages.push(text);

                if (message.type() === "error") {
                    pageErrors.push(text);
                }
            });
            noNodeEnvPage.on("pageerror", (error) => {
                pageErrors.push(error.message);
            });

            await noNodeEnvPage.waitForLoadState("domcontentloaded");

            const mainNodeEnvironment = await noNodeEnvApp.evaluate(
                () => process.env.NODE_ENV ?? null
            );
            const fitBytes = Array.from(fs.readFileSync(sampleFitPath));
            const loadedState = await noNodeEnvPage.evaluate(
                async ({ bytes, filePath }) => {
                    const rendererGlobal = globalThis as typeof globalThis & {
                        process?: { env?: Record<string, string | undefined> };
                    };
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
                        activeFileName:
                            document
                                .querySelector("#active_file_name")
                                ?.textContent?.trim() ?? "",
                        rendererNodeEnvironment:
                            rendererGlobal.process?.env?.NODE_ENV ?? null,
                        routeRecords:
                            window.globalData?.recordMesgs?.length ?? 0,
                        sessionCount:
                            window.globalData?.sessionMesgs?.length ?? 0,
                    };
                },
                { bytes: fitBytes, filePath: sampleFitPath }
            );

            await expect(noNodeEnvPage.locator("#tab_map")).toHaveClass(
                /active/u
            );
            await noNodeEnvPage.waitForFunction(() => {
                const map = document.querySelector("#leaflet-map");
                const themeToggle = document.querySelector(
                    "#content_map.active #map-controls .map-theme-toggle"
                );

                return (
                    map instanceof HTMLElement &&
                    themeToggle instanceof HTMLElement &&
                    themeToggle.getClientRects().length > 0
                );
            });
            const noNodeEnvMapThemeToggle = noNodeEnvPage.locator(
                "#content_map.active #map-controls .map-theme-toggle"
            );
            await expect(noNodeEnvMapThemeToggle).toHaveAttribute(
                "aria-label",
                "Toggle map theme"
            );
            await noNodeEnvMapThemeToggle.scrollIntoViewIfNeeded();
            await expect(
                noNodeEnvPage.getByRole("button", {
                    name: /toggle map theme/iu,
                })
            ).toBeVisible();
            await expect(noNodeEnvPage.locator("#leaflet-map")).toBeVisible();

            const initialMapThemeState = await noNodeEnvPage.evaluate(() => {
                const button = document.querySelector(".map-theme-toggle");

                if (!(button instanceof HTMLElement)) {
                    throw new Error("Map theme toggle was not rendered");
                }

                return {
                    isActive: button.classList.contains("active"),
                    storageValue: localStorage.getItem(
                        "ffv-map-theme-inverted"
                    ),
                    title: button.title,
                };
            });

            await noNodeEnvPage
                .getByRole("button", { name: /toggle map theme/iu })
                .click();
            await expect
                .poll(async () =>
                    noNodeEnvPage.evaluate(() => {
                        const button =
                            document.querySelector(".map-theme-toggle");

                        if (!(button instanceof HTMLElement)) {
                            throw new Error(
                                "Map theme toggle was not rendered"
                            );
                        }

                        return {
                            isActive: button.classList.contains("active"),
                            storageValue: localStorage.getItem(
                                "ffv-map-theme-inverted"
                            ),
                            title: button.title,
                        };
                    })
                )
                .toStrictEqual({
                    isActive: !initialMapThemeState.isActive,
                    storageValue: initialMapThemeState.isActive
                        ? "false"
                        : "true",
                    title: initialMapThemeState.isActive
                        ? "Map: Light theme (click for dark theme)"
                        : "Map: Dark theme (click for light theme)",
                });

            const matchedReports = reportedFailureNeedles.flatMap((needle) =>
                [...rendererMessages, ...pageErrors]
                    .filter((message) => message.includes(needle))
                    .map((message) => `${needle}: ${message}`)
            );

            expect(mainNodeEnvironment).toBeNull();
            expect(loadedState).toStrictEqual({
                activeFileName: sampleFitActivityState.activeFileName,
                rendererNodeEnvironment: null,
                routeRecords: sampleFitActivityState.recordCount,
                sessionCount: sampleFitActivityState.sessionCount,
            });
            expectNoCollectedEntries(
                "NODE_ENV-unset renderer failures",
                matchedReports
            );
            expectNoCollectedEntries("NODE_ENV-unset page errors", pageErrors);
        } finally {
            await noNodeEnvApp.close();
        }
    });
});

test.describe("FitFileViewer Playwright fixtures", () => {
    test("keeps the sample FIT file stable", () => {
        expect({
            activityState: sampleFitActivityState,
            fileName: sampleFitFileName,
            fileState: getFitFixtureFileState(sampleFitPath),
        }).toStrictEqual({
            activityState: {
                activeFileName:
                    "Active:_Fenton_Michigan_Afternoon_Ride_5_27_miles.fit",
                recordCount: 1285,
                sessionCount: 1,
                title: "Fit File Viewer - _Fenton_Michigan_Afternoon_Ride_5_27_miles.fit",
            },
            fileName: "_Fenton_Michigan_Afternoon_Ride_5_27_miles.fit",
            fileState: {
                byteLength: sampleFitFixture.byteLength,
                exists: true,
            },
        });
    });
});

test.describe("FitFileViewer Electron UI", () => {
    let electronApp: ElectronApplication;
    let page: Page;
    const failedRequests: string[] = [];
    const rendererMessages: string[] = [];
    const pageErrors: string[] = [];

    async function mockOpenFileDialog(dialogResult: {
        canceled: boolean;
        filePaths: string[];
    }): Promise<void> {
        await electronApp.evaluate(({ dialog }, result) => {
            const mainGlobal = globalThis as typeof globalThis & {
                __ffvPlaywrightOpenFileDialogCalls?: number;
                __ffvPlaywrightOriginalShowOpenDialog?: typeof dialog.showOpenDialog;
            };

            mainGlobal.__ffvPlaywrightOriginalShowOpenDialog ??=
                dialog.showOpenDialog;
            mainGlobal.__ffvPlaywrightOpenFileDialogCalls = 0;
            dialog.showOpenDialog = async () => {
                mainGlobal.__ffvPlaywrightOpenFileDialogCalls =
                    (mainGlobal.__ffvPlaywrightOpenFileDialogCalls ?? 0) + 1;
                return result;
            };
        }, dialogResult);
    }

    async function restoreOpenFileDialog(): Promise<void> {
        await electronApp.evaluate(({ dialog }) => {
            const mainGlobal = globalThis as typeof globalThis & {
                __ffvPlaywrightOpenFileDialogCalls?: number;
                __ffvPlaywrightOriginalShowOpenDialog?: typeof dialog.showOpenDialog;
            };

            if (mainGlobal.__ffvPlaywrightOriginalShowOpenDialog) {
                dialog.showOpenDialog =
                    mainGlobal.__ffvPlaywrightOriginalShowOpenDialog;
                delete mainGlobal.__ffvPlaywrightOriginalShowOpenDialog;
            }
            delete mainGlobal.__ffvPlaywrightOpenFileDialogCalls;
        });
    }

    async function getOpenFileDialogCallCount(): Promise<number> {
        return electronApp.evaluate(() => {
            const mainGlobal = globalThis as typeof globalThis & {
                __ffvPlaywrightOpenFileDialogCalls?: number;
            };

            return mainGlobal.__ffvPlaywrightOpenFileDialogCalls ?? 0;
        });
    }

    async function waitForOpenFileButtonReady(): Promise<void> {
        await page.waitForFunction(() => {
            const openButton = document.querySelector("#open_file_btn") as
                | (HTMLButtonElement & {
                      __ffvLifecycleListenersCleanup?: unknown;
                  })
                | null;

            return (
                openButton !== null &&
                !openButton.disabled &&
                typeof openButton.__ffvLifecycleListenersCleanup === "function"
            );
        });
    }

    async function getActivityUiState(): Promise<ActivityUiState> {
        return page.evaluate(() => ({
            activeFileName:
                document
                    .querySelector("#active_file_name")
                    ?.textContent?.trim() ?? "",
            recordCount: window.globalData?.recordMesgs?.length ?? 0,
            sessionCount: window.globalData?.sessionMesgs?.length ?? 0,
            title: document.title,
        }));
    }

    async function expectMissingFitFileErrorAlert(): Promise<void> {
        const errorAlert = page.getByRole("alert", {
            name: /Error: Error reading file: File not found\./u,
        });

        await expect(errorAlert).toContainText(
            "Failed to load FIT file: Error invoking remote method 'file:read': Error: ENOENT"
        );
    }

    async function armMapThemeEventRecorder(): Promise<void> {
        await page.evaluate(() => {
            const globalWindow = window as Window & {
                __ffvPlaywrightMapThemeEvents?: unknown[];
            };
            const controller = new AbortController();

            globalWindow.__ffvPlaywrightMapThemeEvents = [];
            document.addEventListener(
                "mapThemeChanged",
                (event) => {
                    globalWindow.__ffvPlaywrightMapThemeEvents?.push(
                        (event as CustomEvent).detail
                    );
                },
                { once: true, signal: controller.signal }
            );
        });
    }

    async function getMapThemeEvents(): Promise<unknown[]> {
        return page.evaluate(() => {
            const globalWindow = window as Window & {
                __ffvPlaywrightMapThemeEvents?: unknown[];
            };

            return globalWindow.__ffvPlaywrightMapThemeEvents ?? [];
        });
    }

    async function getMapThemeToggleState(): Promise<MapThemeToggleState> {
        return page.evaluate(() => {
            const button = document.querySelector(".map-theme-toggle");

            if (!(button instanceof HTMLElement)) {
                throw new Error("Map theme toggle was not rendered");
            }

            return {
                isActive: button.classList.contains("active"),
                storageValue: localStorage.getItem("ffv-map-theme-inverted"),
                title: button.title,
            };
        });
    }

    async function openSampleFitThroughDialog(): Promise<ActivityUiState> {
        await mockOpenFileDialog({
            canceled: false,
            filePaths: [sampleFitPath],
        });

        try {
            await waitForOpenFileButtonReady();
            await page.locator("#open_file_btn").click();

            await expect(page.locator("#active_file_name")).toContainText(
                sampleFitFileName
            );
            await expect(page).toHaveTitle(new RegExp(sampleFitFileName, "u"));
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
                recordCount: sampleFitActivityState.recordCount,
                sessionCount: sampleFitActivityState.sessionCount,
            });

            return getActivityUiState();
        } finally {
            await restoreOpenFileDialog();
        }
    }

    test.beforeAll(async () => {
        electronApp = await electron.launch({
            args: [repositoryRoot, "--disable-http-cache"],
            cwd: repositoryRoot,
            env: createElectronLaunchEnv(),
        });

        page = await electronApp.firstWindow();
        page.on("console", (message) => {
            const text = message.text();
            rendererMessages.push(text);
            if (
                message.type() === "error" &&
                !isExpectedMissingFitFileError(text)
            ) {
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

    test("leaves the current activity unchanged when Open File is cancelled", async () => {
        await mockOpenFileDialog({
            canceled: true,
            filePaths: [],
        });

        try {
            await waitForOpenFileButtonReady();

            const stateBeforeCancel = await getActivityUiState();

            await page.locator("#open_file_btn").click();
            await expect.poll(getOpenFileDialogCallCount).toBe(1);

            const stateAfterCancel = await getActivityUiState();

            expect(stateAfterCancel).toStrictEqual(stateBeforeCancel);
            expect(stateAfterCancel).toStrictEqual({
                activeFileName: "",
                recordCount: 0,
                sessionCount: 0,
                title: stateBeforeCancel.title,
            });
        } finally {
            await restoreOpenFileDialog();
        }
    });

    test("reports a missing FIT file without changing the current activity", async () => {
        expect(getFitFixtureFileState(missingFitPath)).toStrictEqual({
            byteLength: null,
            exists: false,
        });

        await mockOpenFileDialog({
            canceled: false,
            filePaths: [missingFitPath],
        });

        try {
            await waitForOpenFileButtonReady();

            const stateBeforeMissingFile = await getActivityUiState();

            await page.locator("#open_file_btn").click();
            await expect.poll(getOpenFileDialogCallCount).toBe(1);

            await expectMissingFitFileErrorAlert();
            await expect(page.locator("#open_file_btn")).toBeEnabled();

            const stateAfterMissingFile = await getActivityUiState();

            expect(stateAfterMissingFile).toStrictEqual(stateBeforeMissingFile);
            expect(stateAfterMissingFile).toStrictEqual({
                activeFileName: "",
                recordCount: 0,
                sessionCount: 0,
                title: stateBeforeMissingFile.title,
            });
        } finally {
            await restoreOpenFileDialog();
        }
    });

    test("opens a real FIT file through the Open File button", async () => {
        await expect(openSampleFitThroughDialog()).resolves.toStrictEqual(
            sampleFitActivityState
        );
    });

    test("unloads a loaded FIT file through the unload button", async () => {
        await expect(openSampleFitThroughDialog()).resolves.toStrictEqual(
            sampleFitActivityState
        );
        await resetRendererNotifications(page);

        await page.getByRole("button", { name: /unload file/iu }).click();
        await expect(page.locator("#notification")).toContainText(
            "File unloaded successfully"
        );
        await expect(page.locator("#unload_file_btn")).not.toBeVisible();
        await expect(page.locator("#tab_map")).toBeDisabled();

        await expect.poll(getActivityUiState).toStrictEqual({
            activeFileName: "",
            recordCount: 0,
            sessionCount: 0,
            title: "Fit File Viewer",
        });
    });

    test("preserves the loaded activity when a later Open File is cancelled", async () => {
        await expect(openSampleFitThroughDialog()).resolves.toStrictEqual(
            sampleFitActivityState
        );

        await mockOpenFileDialog({
            canceled: true,
            filePaths: [],
        });

        try {
            await waitForOpenFileButtonReady();

            const stateBeforeCancel = await getActivityUiState();

            await page.locator("#open_file_btn").click();
            await expect.poll(getOpenFileDialogCallCount).toBe(1);

            const stateAfterCancel = await getActivityUiState();

            expect(stateAfterCancel).toStrictEqual(stateBeforeCancel);
            expect(stateAfterCancel).toStrictEqual(sampleFitActivityState);
        } finally {
            await restoreOpenFileDialog();
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

        expect(loadResult).toStrictEqual({
            activeFileName: sampleFitActivityState.activeFileName,
            globalRecordCount: 1285,
            globalSessionCount: 1,
            mapTabActive: true,
            title: sampleFitActivityState.title,
        });
        expect(loadResult.activeFileName).not.toBe("");

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

        const mapThemeToggleButton = page.getByRole("button", {
            name: /toggle map theme/iu,
        });
        const initialMapThemeState = await getMapThemeToggleState();
        const toggledStorageValue = initialMapThemeState.isActive
            ? "false"
            : "true";
        const restoredStorageValue = initialMapThemeState.isActive
            ? "true"
            : "false";

        await armMapThemeEventRecorder();
        await mapThemeToggleButton.click();
        await expect
            .poll(async () => getMapThemeToggleState())
            .toStrictEqual({
                isActive: !initialMapThemeState.isActive,
                storageValue: toggledStorageValue,
                title: initialMapThemeState.isActive
                    ? "Map: Light theme (click for dark theme)"
                    : "Map: Dark theme (click for light theme)",
            });
        expect(await getMapThemeEvents()).toStrictEqual([
            { inverted: !initialMapThemeState.isActive },
        ]);

        await armMapThemeEventRecorder();
        await mapThemeToggleButton.click();
        await expect
            .poll(async () => getMapThemeToggleState())
            .toStrictEqual({
                isActive: initialMapThemeState.isActive,
                storageValue: restoredStorageValue,
                title: initialMapThemeState.title,
            });
        expect(await getMapThemeEvents()).toStrictEqual([
            { inverted: initialMapThemeState.isActive },
        ]);

        if (initialMapThemeState.storageValue === null) {
            await page.evaluate(() => {
                localStorage.removeItem("ffv-map-theme-inverted");
            });
        }

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
        const clickedDownload = getRequiredCapturedDownload(
            gpxExport.clickedDownload
        );

        expect(clickedDownload.download).toMatch(/\.gpx$/u);
        expect(clickedDownload.href).toBe("blob:ffv-playwright-gpx");
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

        expect(elevationPopup).toStrictEqual({
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

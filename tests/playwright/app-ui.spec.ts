import { expect, test, _electron as electron } from "@playwright/test";
import type { ElectronApplication, Page } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

type ActivityUiState = {
    activeFileName: string;
    recordCount: number;
    sessionCount: number;
    title: string;
};

type ActivityDataCounts = {
    recordCount: number;
    sessionCount: number;
};

type TabReadinessSnapshot = {
    error: null | string;
    status: string;
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
const fitBrowserStatusRecorderId = "ffv-playwright-fit-browser-status-recorder";
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

type ElectronLaunchProfile = {
    args: string[];
    userDataDir: string;
};

const ELECTRON_EVALUATE_RETRY_ATTEMPTS = 3;
const ELECTRON_EVALUATE_RETRY_DELAY_MS = 250;

function createElectronLaunchProfile(): ElectronLaunchProfile {
    const userDataDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "fitfileviewer-playwright-")
    );

    return {
        args: [
            repositoryRoot,
            "--disable-http-cache",
            `--user-data-dir=${userDataDir}`,
        ],
        userDataDir,
    };
}

function removeElectronLaunchProfile(profile: ElectronLaunchProfile): void {
    fs.rmSync(profile.userDataDir, { force: true, recursive: true });
}

async function closeElectronApp(app: ElectronApplication): Promise<void> {
    try {
        await app.close();
    } catch {
        /* The app may already be closed after a failed Electron smoke path. */
    }
}

function isTransientElectronEvaluateError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("Execution context was destroyed");
}

async function evaluateElectronAppWithRetry<T>(
    evaluate: () => Promise<T>
): Promise<T> {
    let lastError: unknown;

    for (
        let attempt = 1;
        attempt <= ELECTRON_EVALUATE_RETRY_ATTEMPTS;
        attempt += 1
    ) {
        try {
            return await evaluate();
        } catch (error) {
            lastError = error;
            if (
                attempt >= ELECTRON_EVALUATE_RETRY_ATTEMPTS ||
                !isTransientElectronEvaluateError(error)
            ) {
                throw error;
            }
            await delay(ELECTRON_EVALUATE_RETRY_DELAY_MS);
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

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

async function mockOpenFileDialogForApp(
    electronApp: ElectronApplication,
    dialogResult: {
        canceled: boolean;
        filePaths: string[];
    }
): Promise<void> {
    await evaluateElectronAppWithRetry(() =>
        electronApp.evaluate(({ dialog }, result) => {
            type OpenFileDialogMock = typeof dialog.showOpenDialog & {
                __ffvPlaywrightOpenFileDialogCalls?: number;
                __ffvPlaywrightOriginalShowOpenDialog?: typeof dialog.showOpenDialog;
            };
            const currentShowOpenDialog =
                dialog.showOpenDialog as OpenFileDialogMock;
            const originalShowOpenDialog =
                currentShowOpenDialog.__ffvPlaywrightOriginalShowOpenDialog ??
                dialog.showOpenDialog;
            const mockedShowOpenDialog = (async () => {
                mockedShowOpenDialog.__ffvPlaywrightOpenFileDialogCalls =
                    (mockedShowOpenDialog.__ffvPlaywrightOpenFileDialogCalls ??
                        0) + 1;
                return result;
            }) as OpenFileDialogMock;

            mockedShowOpenDialog.__ffvPlaywrightOriginalShowOpenDialog =
                originalShowOpenDialog;
            mockedShowOpenDialog.__ffvPlaywrightOpenFileDialogCalls = 0;
            dialog.showOpenDialog = mockedShowOpenDialog;
        }, dialogResult)
    );
}

async function restoreOpenFileDialogForApp(
    electronApp: ElectronApplication
): Promise<void> {
    await evaluateElectronAppWithRetry(() =>
        electronApp.evaluate(({ dialog }) => {
            const currentShowOpenDialog =
                dialog.showOpenDialog as typeof dialog.showOpenDialog & {
                    __ffvPlaywrightOriginalShowOpenDialog?: typeof dialog.showOpenDialog;
                };

            if (currentShowOpenDialog.__ffvPlaywrightOriginalShowOpenDialog) {
                dialog.showOpenDialog =
                    currentShowOpenDialog.__ffvPlaywrightOriginalShowOpenDialog;
            }
        })
    );
}

async function getOpenFileDialogCallCountForApp(
    electronApp: ElectronApplication
): Promise<number> {
    return electronApp.evaluate(({ dialog }) => {
        const currentShowOpenDialog =
            dialog.showOpenDialog as typeof dialog.showOpenDialog & {
                __ffvPlaywrightOpenFileDialogCalls?: number;
            };

        return currentShowOpenDialog.__ffvPlaywrightOpenFileDialogCalls ?? 0;
    });
}

async function clickOpenFileButtonAndWaitForDialogCall(
    page: Page,
    getOpenFileDialogCallCount: () => Promise<number>
): Promise<void> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        await page.locator("#open_file_btn").click();
        try {
            await expect
                .poll(getOpenFileDialogCallCount, { timeout: 5_000 })
                .toBeGreaterThan(0);
            return;
        } catch (error) {
            if (attempt >= 3) {
                throw error;
            }
        }
    }
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

const ignorableAbortedHosts = new Set(["zwiftmap.com"]);

function isIgnorableFailedRequest(url: string, errorText: string): boolean {
    if (!errorText.includes("ERR_ABORTED")) {
        return false;
    }

    try {
        const { hostname } = new URL(url);
        return (
            ignorableAbortedHosts.has(hostname) ||
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

async function getRendererActivityDataCounts(
    page: Page
): Promise<ActivityDataCounts> {
    return page.evaluate(async () => {
        const moduleUrl = new URL(
            "./utils/state/domain/fitActivityDataState.js",
            window.location.href
        ).href;
        // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to inspect explicit renderer FIT state in Playwright smoke tests.
        const activityStateModule = (await import(moduleUrl)) as {
            getActiveFitActivityData: () => {
                recordMesgs: unknown[];
                sessionMesgs: unknown[];
            };
        };
        const activityData = activityStateModule.getActiveFitActivityData();

        return {
            recordCount: Array.isArray(activityData.recordMesgs)
                ? activityData.recordMesgs.length
                : 0,
            sessionCount: Array.isArray(activityData.sessionMesgs)
                ? activityData.sessionMesgs.length
                : 0,
        };
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
        const noNodeEnvProfile = createElectronLaunchProfile();
        const noNodeEnvApp = await electron.launch({
            args: noNodeEnvProfile.args,
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

            const mainNodeEnvironment = await evaluateElectronAppWithRetry(() =>
                noNodeEnvApp.evaluate(() => process.env.NODE_ENV ?? null)
            );
            await mockOpenFileDialogForApp(noNodeEnvApp, {
                canceled: false,
                filePaths: [sampleFitPath],
            });
            await noNodeEnvPage.waitForFunction(() => {
                const openButton = document.querySelector(
                    "#open_file_btn"
                ) as HTMLButtonElement | null;

                return openButton !== null && !openButton.disabled;
            });
            await clickOpenFileButtonAndWaitForDialogCall(noNodeEnvPage, () =>
                getOpenFileDialogCallCountForApp(noNodeEnvApp)
            );
            await expect
                .poll(
                    async () => {
                        const [uiState, activityDataCounts] = await Promise.all(
                            [
                                noNodeEnvPage.evaluate(() => ({
                                    activeFileName:
                                        document
                                            .querySelector("#active_file_name")
                                            ?.textContent?.trim() ?? "",
                                    title: document.title,
                                })),
                                getRendererActivityDataCounts(noNodeEnvPage),
                            ]
                        );

                        return {
                            ...uiState,
                            ...activityDataCounts,
                        };
                    },
                    { timeout: 60_000 }
                )
                .toStrictEqual({
                    activeFileName: sampleFitActivityState.activeFileName,
                    recordCount: sampleFitActivityState.recordCount,
                    sessionCount: sampleFitActivityState.sessionCount,
                    title: sampleFitActivityState.title,
                });
            const loadedState = await noNodeEnvPage.evaluate(() => {
                const rendererGlobal = globalThis as typeof globalThis & {
                    process?: { env?: Record<string, string | undefined> };
                };

                return {
                    activeFileName:
                        document
                            .querySelector("#active_file_name")
                            ?.textContent?.trim() ?? "",
                    rendererNodeEnvironment:
                        rendererGlobal.process?.env?.NODE_ENV ?? null,
                };
            });
            const {
                recordCount: loadedRecordCount,
                sessionCount: loadedSessionCount,
            } = await getRendererActivityDataCounts(noNodeEnvPage);

            await expect(noNodeEnvPage.locator("#tab_map")).toHaveClass(
                /active/u
            );
            const noNodeEnvMapThemeToggle = noNodeEnvPage.locator(
                "#content_map.active #map-controls .map-theme-toggle"
            );
            await expect(noNodeEnvPage.locator("#leaflet-map")).toBeVisible({
                timeout: 60_000,
            });
            await expect(noNodeEnvMapThemeToggle).toBeVisible({
                timeout: 60_000,
            });
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
            });
            expect({
                recordCount: loadedRecordCount,
                sessionCount: loadedSessionCount,
            }).toStrictEqual({
                recordCount: sampleFitActivityState.recordCount,
                sessionCount: sampleFitActivityState.sessionCount,
            });
            expectNoCollectedEntries(
                "NODE_ENV-unset renderer failures",
                matchedReports
            );
            expectNoCollectedEntries("NODE_ENV-unset page errors", pageErrors);
        } finally {
            try {
                await restoreOpenFileDialogForApp(noNodeEnvApp);
            } catch {
                /* The app may already be closed after a failed smoke path. */
            }
            try {
                await closeElectronApp(noNodeEnvApp);
            } finally {
                removeElectronLaunchProfile(noNodeEnvProfile);
            }
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
    let electronProfile: ElectronLaunchProfile | undefined;
    let page: Page;
    const failedRequests: string[] = [];
    const rendererMessages: string[] = [];
    const pageErrors: string[] = [];

    async function mockOpenFileDialog(dialogResult: {
        canceled: boolean;
        filePaths: string[];
    }): Promise<void> {
        await mockOpenFileDialogForApp(electronApp, dialogResult);
    }

    async function restoreOpenFileDialog(): Promise<void> {
        await restoreOpenFileDialogForApp(electronApp);
    }

    async function getOpenFileDialogCallCount(): Promise<number> {
        return getOpenFileDialogCallCountForApp(electronApp);
    }

    async function waitForOpenFileButtonReady(): Promise<void> {
        await page.waitForFunction(() => {
            const openButton = document.querySelector(
                "#open_file_btn"
            ) as HTMLButtonElement | null;

            return openButton !== null && !openButton.disabled;
        });
    }

    async function getActivityUiState(): Promise<ActivityUiState> {
        const [uiState, activityDataCounts] = await Promise.all([
            page.evaluate(() => ({
                activeFileName:
                    document
                        .querySelector("#active_file_name")
                        ?.textContent?.trim() ?? "",
                title: document.title,
            })),
            getRendererActivityDataCounts(page),
        ]);

        return {
            ...uiState,
            ...activityDataCounts,
        };
    }

    async function expectLoadedActivityStatePreserved(
        context: string
    ): Promise<void> {
        await expect
            .poll(getActivityUiState, {
                message: `loaded activity state after ${context}`,
                timeout: 30_000,
            })
            .toStrictEqual(sampleFitActivityState);
    }

    async function getTabReadinessSnapshot(
        tabName: string
    ): Promise<TabReadinessSnapshot> {
        return page.evaluate(async (requestedTabName) => {
            const moduleUrl = new URL(
                "./utils/state/core/stateManager.js",
                window.location.href
            ).href;
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to inspect explicit renderer tab readiness state in Playwright smoke tests.
            const stateManagerModule = (await import(moduleUrl)) as {
                getState: <T = unknown>(path?: string) => T | undefined;
            };
            const readiness = stateManagerModule.getState<{
                error?: null | string;
                status?: string;
            }>(`ui.tabReadiness.${requestedTabName}`);

            return {
                error:
                    typeof readiness?.error === "string"
                        ? readiness.error
                        : null,
                status:
                    typeof readiness?.status === "string"
                        ? readiness.status
                        : "missing",
            };
        }, tabName);
    }

    async function expectTabReady(tabName: string): Promise<void> {
        await expect
            .poll(async () => getTabReadinessSnapshot(tabName), {
                message: `${tabName} tab readiness`,
                timeout: 30_000,
            })
            .toStrictEqual({
                error: null,
                status: "ready",
            });
    }

    async function expectMissingFitFileErrorAlert(): Promise<void> {
        const errorAlert = page.getByRole("alert", {
            name: /Error: Error reading file: File not found\./u,
        });

        await expect(errorAlert).toContainText(
            "Error reading file: File not found. It may have been moved, deleted, or opened from an old recent-file entry."
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

    async function expectAltFitIframeLoadedActivity(): Promise<void> {
        await page.locator("#tab_altfit").click();
        await expect(page.locator("#tab_altfit")).toHaveClass(/active/u);

        const altFitIframe = page.locator("#altfit_iframe");
        await expect(altFitIframe).toBeVisible();

        const iframeHandle = await altFitIframe.elementHandle();
        const altFitFrame = await iframeHandle?.contentFrame();
        if (!altFitFrame) {
            throw new Error("AltFit iframe content frame was not available");
        }

        await expect
            .poll(async () => {
                const rootText =
                    (await altFitFrame.locator("#root").textContent()) ?? "";

                return {
                    hasLandingCopy: rootText.includes("A FIT file consists"),
                    hasRecordData: /record/iu.test(rootText),
                    hasSessionData: /session/iu.test(rootText),
                };
            })
            .toStrictEqual({
                hasLandingCopy: false,
                hasRecordData: true,
                hasSessionData: true,
            });
    }

    async function armFitBrowserStatusRecorder(): Promise<void> {
        await page.evaluate((recorderId) => {
            const previousRecorder = document.getElementById(recorderId);
            previousRecorder?.dispatchEvent(
                new Event("ffv-playwright-stop-recorder")
            );
            previousRecorder?.remove();

            const recorder = document.createElement("div");
            recorder.hidden = true;
            recorder.id = recorderId;
            recorder.dataset["snapshots"] = "[]";
            document.body.append(recorder);

            let statusObserver: MutationObserver | undefined;
            const readSnapshots = (): string[] => {
                try {
                    const parsed = JSON.parse(
                        recorder.dataset["snapshots"] ?? "[]"
                    ) as unknown;

                    return Array.isArray(parsed)
                        ? parsed.filter(
                              (snapshot): snapshot is string =>
                                  typeof snapshot === "string"
                          )
                        : [];
                } catch {
                    return [];
                }
            };
            const appendSnapshot = (snapshot: string) => {
                recorder.dataset["snapshots"] = JSON.stringify([
                    ...readSnapshots(),
                    snapshot,
                ]);
            };
            const recordStatus = () => {
                const status = document.querySelector("#fit-browser-status");
                appendSnapshot(
                    status instanceof HTMLElement
                        ? `${status.textContent ?? ""}|${status.className}`
                        : ""
                );
            };
            const attachStatusObserver = () => {
                const status = document.querySelector("#fit-browser-status");
                if (!(status instanceof HTMLElement) || statusObserver) {
                    return;
                }
                statusObserver = new MutationObserver(recordStatus);
                statusObserver.observe(status, {
                    attributes: true,
                    characterData: true,
                    childList: true,
                    subtree: true,
                });
                recordStatus();
            };
            const bodyObserver = new MutationObserver(attachStatusObserver);
            bodyObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });
            attachStatusObserver();

            const cleanupController = new AbortController();
            const stopRecorder = () => {
                bodyObserver.disconnect();
                statusObserver?.disconnect();
                cleanupController.abort();
            };
            recorder.addEventListener(
                "ffv-playwright-stop-recorder",
                stopRecorder,
                { once: true, signal: cleanupController.signal }
            );
        }, fitBrowserStatusRecorderId);
    }

    async function getFitBrowserStatusSnapshots(): Promise<string[]> {
        return page.evaluate((recorderId) => {
            const recorder = document.getElementById(recorderId);
            if (!recorder) {
                return [];
            }

            try {
                const parsed = JSON.parse(
                    recorder.dataset["snapshots"] ?? "[]"
                ) as unknown;

                return Array.isArray(parsed)
                    ? parsed.filter(
                          (snapshot): snapshot is string =>
                              typeof snapshot === "string"
                      )
                    : [];
            } catch {
                return [];
            }
        }, fitBrowserStatusRecorderId);
    }

    async function stopFitBrowserStatusRecorder(): Promise<void> {
        await page.evaluate((recorderId) => {
            const recorder = document.getElementById(recorderId);
            recorder?.dispatchEvent(new Event("ffv-playwright-stop-recorder"));
            recorder?.remove();
        }, fitBrowserStatusRecorderId);
    }

    async function openSampleFitThroughDialog(): Promise<ActivityUiState> {
        await mockOpenFileDialog({
            canceled: false,
            filePaths: [sampleFitPath],
        });

        try {
            await waitForOpenFileButtonReady();
            await clickOpenFileButtonAndWaitForDialogCall(
                page,
                getOpenFileDialogCallCount
            );

            await expect(page.locator("#active_file_name")).toContainText(
                sampleFitFileName
            );
            await expect(page).toHaveTitle(new RegExp(sampleFitFileName, "u"));
            await expect(page.locator("#tab_map")).toHaveClass(/active/u);

            await expect
                .poll(() => getRendererActivityDataCounts(page))
                .toStrictEqual({
                    recordCount: sampleFitActivityState.recordCount,
                    sessionCount: sampleFitActivityState.sessionCount,
                });

            return getActivityUiState();
        } finally {
            await restoreOpenFileDialog();
        }
    }

    async function ensureSampleFitLoaded(): Promise<ActivityUiState> {
        const currentState = await getActivityUiState();
        if (
            currentState.activeFileName ===
                sampleFitActivityState.activeFileName &&
            currentState.recordCount === sampleFitActivityState.recordCount &&
            currentState.sessionCount === sampleFitActivityState.sessionCount
        ) {
            return currentState;
        }

        return openSampleFitThroughDialog();
    }

    test.beforeAll(async () => {
        electronProfile = createElectronLaunchProfile();
        electronApp = await electron.launch({
            args: electronProfile.args,
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
        if (electronApp) {
            await closeElectronApp(electronApp);
        }
        if (electronProfile) {
            removeElectronLaunchProfile(electronProfile);
        }
    });

    test("starts with the main controls visible", async () => {
        await expect(page).toHaveTitle(/Fit File Viewer/u);
        await expect(page.locator("#open_file_btn")).toBeVisible();
        await expect(page.locator("#tabs")).toBeVisible();
        await expect(page.locator("#tab_map")).toHaveClass(/active/u);
        await expect(page.locator(".tab-button")).toHaveCount(7);

        const rendererVendorState = await page.evaluate(() => {
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
                hasDataTableCompatibilityGlobals:
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
                hasCoreVendorScript: Boolean(
                    document.querySelector(
                        'script[src*="renderer-vendor-core.js"]'
                    )
                ),
                hasVendorBundleGlobal:
                    "__FFV_RENDERER_VENDOR_BUNDLE__" in globalWindow,
            };
        });

        expect(rendererVendorState).toStrictEqual({
            hasArqueroTable: false,
            hasChart: false,
            hasChartZoom: false,
            hasDomPurify: false,
            hasHammer: false,
            hasJsZip: false,
            hasDataTableCompatibilityGlobals: false,
            hasScreenfull: false,
            hasCoreVendorScript: true,
            hasVendorBundleGlobal: false,
            isChartZoomRegistered: false,
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

            await clickOpenFileButtonAndWaitForDialogCall(
                page,
                getOpenFileDialogCallCount
            );

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

            await clickOpenFileButtonAndWaitForDialogCall(
                page,
                getOpenFileDialogCallCount
            );

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
        await expectAltFitIframeLoadedActivity();
    });

    test("auto-renders the selected FIT file in the Raw Data tab", async () => {
        await expect(openSampleFitThroughDialog()).resolves.toStrictEqual(
            sampleFitActivityState
        );

        await page.locator("#tab_data").click();
        await expect(page.locator("#tab_data")).toHaveClass(/active/u);

        const firstTableHeader = page
            .locator("#content_data .table-header")
            .first();
        await expect(firstTableHeader).toBeVisible();
        await expect(firstTableHeader).toContainText(/record/iu);
        await firstTableHeader.click();
        await expect(
            page.locator("#content_data table.dataTable").first()
        ).toBeVisible({ timeout: 30_000 });
        await expect(
            page.locator("#content_data .dt-container").first()
        ).toBeVisible({ timeout: 30_000 });
    });

    test("loads the Zwift map iframe when the Zwift tab is selected", async () => {
        await expect(ensureSampleFitLoaded()).resolves.toMatchObject({
            activeFileName: sampleFitActivityState.activeFileName,
        });

        try {
            await page.locator("#tab_zwift").click();
            await expect(page.locator("#tab_zwift")).toHaveClass(/active/u);

            const zwiftFrame = page.locator(
                '#content_zwift.active iframe#zwift_iframe[src="https://zwiftmap.com/"]'
            );
            await expect(zwiftFrame).toBeVisible();
            await expect(zwiftFrame).toHaveAttribute("allow", "geolocation");
            await expect(zwiftFrame).toHaveClass(/fullsize-container/u);
            await expectTabReady("zwift");
        } finally {
            await page.evaluate(() => {
                document.querySelector("#zwift_iframe")?.remove();
            });
            await page.locator("#tab_map").click();
        }
    });

    test("clears distance and area map measurements through the registered measure control", async () => {
        await expect(ensureSampleFitLoaded()).resolves.toMatchObject({
            activeFileName: sampleFitActivityState.activeFileName,
        });

        await page.locator("#tab_map").click();
        await expect(page.locator("#leaflet-map")).toBeVisible();
        await expect
            .poll(async () =>
                page.evaluate(async () => {
                    const moduleUrl = new URL(
                        "./utils/maps/state/mapMeasureControlState.js",
                        window.location.href
                    ).href;
                    // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to inspect explicit renderer map measurement state in Playwright smoke tests.
                    const mapMeasurementStateModule = (await import(
                        moduleUrl
                    )) as {
                        getRegisteredMapMeasureControl: () => unknown;
                    };

                    return (
                        mapMeasurementStateModule.getRegisteredMapMeasureControl() !==
                        null
                    );
                })
            )
            .toBe(true);

        const clearResult = await page.evaluate(async () => {
            type LeafletRuntime = {
                Edit?: { Poly?: unknown };
                latLng?: (lat: number, lng: number) => unknown;
            };
            type LayerGroupRuntime = {
                getLayers?: () => unknown[];
            };
            type LeafletMeasureControlRuntime = {
                _finishMeasure?: () => void;
                _latlngs?: unknown[];
                _map?: {
                    getContainer?: () => HTMLElement;
                };
                _measurementRunningTotal?: number;
                _resultLayer?: LayerGroupRuntime;
                _segmentMeters?: number[];
                _startMeasure?: () => void;
                clearMeasurements?: () => void;
            };
            const moduleUrl = new URL(
                "./utils/maps/state/mapMeasureControlState.js",
                window.location.href
            ).href;
            const leafletRuntimeModuleUrl = new URL(
                "./utils/maps/core/leafletRuntime.js",
                window.location.href
            ).href;
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to exercise explicit renderer map measurement state in Playwright smoke tests.
            const mapMeasurementStateModule = (await import(moduleUrl)) as {
                clearRegisteredMapMeasurements: () => void;
                getRegisteredMapMeasureControl: () => LeafletMeasureControlRuntime | null;
            };
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to exercise explicit renderer Leaflet runtime registration in Playwright smoke tests.
            const leafletRuntimeModule = (await import(
                leafletRuntimeModuleUrl
            )) as {
                resolveLeafletRuntime: <T>(
                    isRuntime: (value: unknown) => value is T
                ) => T | null;
            };
            const isLeafletRuntime = (
                value: unknown
            ): value is LeafletRuntime =>
                typeof (value as LeafletRuntime | null)?.latLng === "function";
            const control =
                mapMeasurementStateModule.getRegisteredMapMeasureControl();
            const leafletRuntime =
                leafletRuntimeModule.resolveLeafletRuntime(isLeafletRuntime);

            if (!control) {
                throw new Error("Map measure control was not registered");
            }
            if (
                !leafletRuntime ||
                typeof leafletRuntime.latLng !== "function"
            ) {
                throw new Error("Leaflet runtime was not registered");
            }
            if (
                typeof control._startMeasure !== "function" ||
                typeof control._finishMeasure !== "function" ||
                typeof control.clearMeasurements !== "function"
            ) {
                throw new Error("Registered map measure control is incomplete");
            }

            function createLatLng(lat: number, lng: number): unknown {
                return leafletRuntime.latLng?.(lat, lng) ?? { lat, lng };
            }

            function completeMeasurement(
                latLngs: unknown[],
                segmentMeters: number[]
            ): void {
                control._startMeasure?.();
                control._latlngs = latLngs;
                control._segmentMeters = segmentMeters;
                control._measurementRunningTotal =
                    Math.sumPrecise(segmentMeters);
                control._finishMeasure?.();
            }

            completeMeasurement(
                [createLatLng(42, -83), createLatLng(42.001, -83.001)],
                [100]
            );
            completeMeasurement(
                [
                    createLatLng(42, -83),
                    createLatLng(42.001, -83),
                    createLatLng(42.001, -83.001),
                    createLatLng(42, -83),
                ],
                [
                    100,
                    100,
                    100,
                ]
            );

            const mapContainer =
                control._map?.getContainer?.() ??
                document.querySelector<HTMLElement>("#leaflet-map");
            const popupElement = document.createElement("div");
            popupElement.className = "leaflet-popup";
            const popupBody = document.createElement("div");
            popupBody.className = "leaflet-measure-resultpopup";
            popupBody.textContent = "Area measurement";
            popupElement.append(popupBody);
            mapContainer?.append(popupElement);

            const before = {
                completedLayerCount:
                    control._resultLayer?.getLayers?.().length ?? 0,
                popupDomCount:
                    mapContainer?.querySelectorAll(
                        ".leaflet-measure-resultpopup"
                    ).length ?? 0,
            };

            mapMeasurementStateModule.clearRegisteredMapMeasurements();

            return {
                after: {
                    completedLayerCount:
                        control._resultLayer?.getLayers?.().length ?? 0,
                    latLngCount: control._latlngs?.length ?? null,
                    popupDomCount:
                        mapContainer?.querySelectorAll(
                            ".leaflet-measure-resultpopup"
                        ).length ?? 0,
                    runningTotal: control._measurementRunningTotal ?? null,
                    segmentCount: control._segmentMeters?.length ?? null,
                },
                before,
            };
        });

        expect(clearResult.before.completedLayerCount).toBeGreaterThan(0);
        expect(clearResult.before.popupDomCount).toBe(1);
        expect(clearResult.after).toStrictEqual({
            completedLayerCount: 0,
            latLngCount: 0,
            popupDomCount: 0,
            runningTotal: 0,
            segmentCount: 0,
        });
    });

    test("shows loading and loaded states for an empty Browser folder", async () => {
        await expect(ensureSampleFitLoaded()).resolves.toMatchObject({
            activeFileName: sampleFitActivityState.activeFileName,
        });

        const emptyBrowserFolder = path.join(
            repositoryRoot,
            "tests",
            "fixtures"
        );
        await armFitBrowserStatusRecorder();
        await mockOpenFileDialog({
            canceled: false,
            filePaths: [emptyBrowserFolder],
        });

        try {
            await page.locator("#tab_browser").click();
            await expect(page.locator("#tab_browser")).toHaveClass(/active/u);
            await expect(
                page.locator("#fit-browser-pick-folder")
            ).toBeVisible();
            await page.locator("#fit-browser-pick-folder").click();
            await expect.poll(getOpenFileDialogCallCount).toBe(1);

            await expect(page.locator("#fit-browser-view-files")).toBeVisible();
            await page.locator("#fit-browser-view-files").click();

            const browserStatus = page.locator("#fit-browser-status");
            await expect(browserStatus).toBeVisible();

            await expect(browserStatus).toContainText(
                /Loaded 0 items from root/u
            );
            await expect(browserStatus).not.toHaveClass(
                /file-browser__status--loading/u
            );
            await expect(page.locator("#fit-browser-list")).toContainText(
                "No .fit files found in this folder."
            );
            expect(await getFitBrowserStatusSnapshots()).toContainEqual(
                expect.stringMatching(
                    /Loading folder\.\.\.\|.*file-browser__status--loading/u
                )
            );
        } finally {
            await restoreOpenFileDialog();
            await stopFitBrowserStatusRecorder();
            await page.locator("#tab_map").click();
        }
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

            await clickOpenFileButtonAndWaitForDialogCall(
                page,
                getOpenFileDialogCallCount
            );

            const stateAfterCancel = await getActivityUiState();

            expect(stateAfterCancel).toStrictEqual(stateBeforeCancel);
            expect(stateAfterCancel).toStrictEqual(sampleFitActivityState);
        } finally {
            await restoreOpenFileDialog();
        }
    });

    test("renders a real FIT file across map, charts, data, and summary tabs", async () => {
        const loadResult = await openSampleFitThroughDialog();

        expect(loadResult).toStrictEqual({
            activeFileName: sampleFitActivityState.activeFileName,
            recordCount: sampleFitActivityState.recordCount,
            sessionCount: sampleFitActivityState.sessionCount,
            title: sampleFitActivityState.title,
        });
        expect(loadResult.activeFileName).not.toBe("");

        await page.locator("#tab_map").click();
        await expectLoadedActivityStatePreserved("switching to Map");
        await expectTabReady("map");
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

        const mapRuntime = await page.evaluate(async () => {
            type LeafletDrawRuntime = {
                Edit?: { Poly?: unknown };
            };
            const globalWindow = window as Window &
                Record<string, Record<string, unknown> | undefined>;
            const leafletRuntimeModuleUrl = new URL(
                "./utils/maps/core/leafletRuntime.js",
                window.location.href
            ).href;
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to exercise explicit renderer Leaflet runtime registration in Playwright smoke tests.
            const leafletRuntimeModule = (await import(
                leafletRuntimeModuleUrl
            )) as {
                resolveLeafletRuntime: <T>(
                    isRuntime: (value: unknown) => value is T
                ) => T | null;
            };
            const isLeafletDrawRuntime = (
                value: unknown
            ): value is LeafletDrawRuntime =>
                typeof (value as LeafletDrawRuntime | null)?.Edit?.Poly ===
                "function";
            const layerLabels = Array.from(
                document.querySelectorAll(".leaflet-control-layers label"),
                (element) => element.textContent?.trim() ?? ""
            );
            const leafletRuntime =
                leafletRuntimeModule.resolveLeafletRuntime(
                    isLeafletDrawRuntime
                );

            return {
                exposesMapLibreGlobal:
                    typeof globalWindow.maplibregl === "object" ||
                    typeof globalWindow.maplibregl === "function",
                exposesLeafletGlobal: "L" in globalWindow,
                exposesLeafletAlias: "Leaflet" in globalWindow,
                hasLeafletDrawEditRuntime:
                    typeof leafletRuntime?.Edit?.Poly === "function",
                layerLabels,
                openFreeMapLabels: layerLabels.filter((label) =>
                    label.startsWith("Open Free Map ")
                ),
                routeElementCount: document.querySelectorAll(
                    ".leaflet-marker-icon, .leaflet-interactive"
                ).length,
            };
        });

        expect(mapRuntime.exposesLeafletGlobal).toBe(false);
        expect(mapRuntime.exposesLeafletAlias).toBe(false);
        expect(mapRuntime.hasLeafletDrawEditRuntime).toBe(true);
        expect(mapRuntime.exposesMapLibreGlobal).toBe(false);
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
            size: 450_785,
            type: "application/gpx+xml;charset=utf-8",
        });

        const elevationPopup = await page.evaluate(async () => {
            type RuntimeFunction = (...args: unknown[]) => unknown;
            type ChartRuntimeModule = {
                clearChartRuntimeForTests: () => void;
                resolveChartRuntime: <T>(
                    isRuntime: (value: unknown) => value is T
                ) => T | null;
                setChartRuntime: (
                    runtime: unknown,
                    zoomPlugin?: unknown
                ) => void;
            };

            const chartRuntimeModuleUrl = new URL(
                "./utils/charts/core/chartRuntime.js",
                window.location.href
            ).href;
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used to install an isolated chart runtime in the Playwright elevation popup smoke test.
            const chartRuntimeModule = (await import(
                chartRuntimeModuleUrl
            )) as ChartRuntimeModule;
            const originalChartRuntime = chartRuntimeModule.resolveChartRuntime(
                (value): value is RuntimeFunction => typeof value === "function"
            );
            const popupDocument =
                document.implementation.createHTMLDocument("");
            const originalOpenDescriptor = Object.getOwnPropertyDescriptor(
                window,
                "open"
            );
            if (!originalOpenDescriptor) {
                throw new Error("window.open descriptor was not available");
            }
            const setWindowOpenFixture = (open: typeof window.open) => {
                Object.defineProperty(window, "open", {
                    configurable: true,
                    enumerable: originalOpenDescriptor.enumerable,
                    value: open,
                    writable: true,
                });
            };
            const restoreWindowOpen = () => {
                Object.defineProperty(window, "open", originalOpenDescriptor);
            };
            const popupWindow = {
                document: popupDocument,
            } as Window & { Chart?: unknown };
            const chartMock = Object.assign(function chartConstructor() {}, {
                helpers: {
                    color: (color: string) => ({
                        alpha: (opacity: number) => ({
                            rgbString: () => `${color}:${opacity}`,
                        }),
                    }),
                },
            });

            chartRuntimeModule.setChartRuntime(chartMock);
            setWindowOpenFixture((() => popupWindow) as typeof window.open);

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
                for (let attempt = 0; attempt < 20; attempt += 1) {
                    if (popupDocument.querySelector("#elevChartsContainer")) {
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }

                return {
                    canvasCount: popupDocument.querySelectorAll(
                        ".elev-profile-canvas"
                    ).length,
                    containerExists:
                        popupDocument.querySelector("#elevChartsContainer") !==
                        null,
                    hasPopupChartGlobal: Object.prototype.hasOwnProperty.call(
                        popupWindow,
                        "Chart"
                    ),
                    title: popupDocument.title,
                    vendorScriptCount: popupDocument.querySelectorAll(
                        "script[src*='vendor']"
                    ).length,
                };
            } finally {
                if (originalChartRuntime) {
                    chartRuntimeModule.setChartRuntime(originalChartRuntime);
                } else {
                    chartRuntimeModule.clearChartRuntimeForTests();
                }
                restoreWindowOpen();
            }
        });

        expect(elevationPopup).toStrictEqual({
            canvasCount: 1,
            containerExists: true,
            hasPopupChartGlobal: false,
            title: "Elevation Profiles",
            vendorScriptCount: 0,
        });

        await page.locator("#tab_chartjs").click();
        await expectLoadedActivityStatePreserved("switching to Charts");
        await expectTabReady("chartjs");
        await expect(page.locator("#tab_chartjs")).toHaveClass(/active/u);
        await expect(page.locator("#content_chartjs")).toBeAttached();
        await expect(
            page.locator("#chartjs_chart_container canvas.chart-canvas").first()
        ).toBeVisible();

        const chartRuntimeHandle = await page.waitForFunction(() => {
            const canvases = Array.from(
                document.querySelectorAll<HTMLCanvasElement>(
                    "#chartjs_chart_container canvas.chart-canvas"
                )
            );

            if (canvases.length === 0) {
                return null;
            }

            return {
                canvasCount: canvases.length,
                chartIds: canvases.map((canvas) => canvas.id),
            };
        });
        const chartRuntime = (await chartRuntimeHandle.jsonValue()) as {
            canvasCount: number;
            chartIds: string[];
        } | null;

        expect(chartRuntime).toStrictEqual({
            canvasCount: 23,
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
            await expectLoadedActivityStatePreserved(`switching to ${tabId}`);
            await expect(page.locator(tabId)).toHaveClass(/active/u);
            await expectTabReady(tabId === "#tab_data" ? "data" : "summary");
        }

        await expect(page.locator("#content_data")).toBeAttached();
        await expect(page.locator("#content_summary")).toBeAttached();

        await page.locator("#tab_data").click();
        await expectLoadedActivityStatePreserved(
            "returning to Raw Data after Summary"
        );
        await expectTabReady("data");
        const firstTableHeader = page
            .locator("#content_data .table-header")
            .first();
        await expect(firstTableHeader).toBeVisible();
        await firstTableHeader.click();
        await expect(
            page.locator("#content_data table.dataTable").first()
        ).toBeVisible({ timeout: 30_000 });
        await expect(
            page.locator("#content_data .dt-container").first()
        ).toBeVisible({ timeout: 30_000 });
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

import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { App, BrowserWindow, WebContents } from "electron";

import { approveFilePath } from "../security/fileAccessPolicy.js";
import { setAutoUpdaterInitialized } from "../state/appState.js";

type SmokeConfiguration = Readonly<{
    directory: string;
    fixture: string;
    nonce: string;
}>;

type SmokeApp = Readonly<Pick<App, "exit" | "getVersion" | "on" | "setPath">>;
type SmokeWindow = Readonly<
    Pick<BrowserWindow, "isDestroyed" | "isVisible">
> & {
    readonly webContents: Readonly<
        Pick<WebContents, "on" | "getURL" | "executeJavaScript" | "capturePage">
    >;
};

const configurationError =
    "Packaged smoke requires an absolute report directory, fixture and nonce";

/** Configure the opt-in release self-test before any windows or sessions exist. */
export function configurePackagedSmoke(app?: SmokeApp): void {
    if (!process.argv.includes("--ffv-smoke-test")) {
        return;
    }
    if (!app) {
        throw new Error(configurationError);
    }
    const configuration = readSmokeConfiguration();
    const profile = path.join(configuration.directory, "user-data");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Explicit local smoke opt-in supplies an absolute diagnostics directory; the profile child name is fixed.
    mkdirSync(profile, { recursive: true });
    app.setPath("userData", profile);
    // Release verification must never download or install another release.
    setAutoUpdaterInitialized(true);
    approveFilePath(configuration.fixture, { source: "packaged-smoke" });
    let started = false;
    app.on("browser-window-created", (_event, mainWindow) => {
        if (started) {
            return;
        }
        started = true;
        void verifyPackagedWindow(mainWindow, configuration, app);
    });
}

function requireSmokeValue(value?: string): string {
    if (value === undefined || value.length === 0) {
        throw new Error(configurationError);
    }
    return value;
}

function requireAbsoluteSmokePath(value?: string): string {
    const candidate = requireSmokeValue(value);
    if (!path.isAbsolute(candidate)) {
        throw new Error(configurationError);
    }
    return candidate;
}

function readSmokeConfiguration(): SmokeConfiguration {
    const {
        FFV_SMOKE_DIRECTORY: directory,
        FFV_SMOKE_NONCE: nonce,
        FFV_SMOKE_FIXTURE: fixture,
    } = process.env;
    return {
        directory: requireAbsoluteSmokePath(directory),
        fixture: requireAbsoluteSmokePath(fixture),
        nonce: requireSmokeValue(nonce),
    };
}

function observeWindowFailures(mainWindow: SmokeWindow): string[] {
    const failures: string[] = [];
    mainWindow.webContents.on("render-process-gone", (_event, details) => {
        failures.push(
            `Renderer terminated: ${details.reason} (${details.exitCode})`
        );
    });
    mainWindow.webContents.on(
        "preload-error",
        (_event, _preloadPath, error) => {
            failures.push(`Preload failed: ${error.message}`);
        }
    );
    mainWindow.webContents.on(
        "did-fail-load",
        (_event, code, description, url, isMainFrame) => {
            if (isMainFrame) {
                failures.push(
                    `Main frame failed: ${code} ${description} ${url}`
                );
            }
        }
    );
    return failures;
}

function assertWindowHealthy(
    mainWindow: SmokeWindow,
    failures: readonly string[],
    message: string,
    requireVisible = false
): void {
    if (
        failures.length > 0 ||
        mainWindow.isDestroyed() ||
        (requireVisible && !mainWindow.isVisible())
    ) {
        throw new Error(failures.join("; ") || message);
    }
}

async function waitForRendererReady(
    mainWindow: SmokeWindow,
    failures: readonly string[]
): Promise<void> {
    // did-finish-load alone does not prove module initialization.
    for (let attempt = 0; attempt < 200; attempt += 1) {
        assertWindowHealthy(
            mainWindow,
            failures,
            "Window closed during startup"
        );
        if (
            mainWindow.isVisible() &&
            mainWindow.webContents.getURL().startsWith("file:")
        ) {
            const ready: boolean = await mainWindow.webContents
                .executeJavaScript(`(async () => {
                const { getState } = await import(new URL('./utils/state/core/stateManager.js', location.href).href);
                return getState('app.initialized') === true && Boolean(document.querySelector('#open_file_btn') && !document.querySelector('#open_file_btn').disabled && document.querySelector('#tab_map'));
            })()`);
            if (ready) {
                return;
            }
        }
        await delay(100);
    }
    throw new Error("Visible renderer UI did not initialize");
}

// Only fixed, packaged modules are imported. The fixture is a JSON string,
// never executable input. Existing file IPC performs the read and parse.
function createFixtureProbeScript(fixture: string): string {
    return `
            const { openFitFileFromPath } = await import(new URL('./utils/files/import/openFitFileFromPath.js', location.href).href);
            const { getActiveFitActivityData } = await import(new URL('./utils/state/domain/fitActivityDataState.js', location.href).href);
            const { getBrowserElectronApiCandidate } = await import(new URL('./utils/runtime/browserRuntime.js', location.href).href);
            const { getState } = await import(new URL('./utils/state/core/stateManager.js', location.href).href);
            const notifications = [];
            const loaded = await openFitFileFromPath({electronApiScope: {getElectronAPI: getBrowserElectronApiCandidate}, filePath: ${JSON.stringify(fixture)}, showNotification: (message, type) => { if (type === 'error') notifications.push(message); }});
            const data = getActiveFitActivityData();
            const recordCount = Array.isArray(data?.recordMesgs) ? data.recordMesgs.length : 0;
            const sessionCount = Array.isArray(data?.sessionMesgs) ? data.sessionMesgs.length : 0;
            const activeFileName = document.querySelector('#active_file_name')?.textContent?.trim() || '';
            if (!loaded || recordCount < 1 || sessionCount < 1 || !activeFileName.includes(${JSON.stringify(path.basename(fixture))})) throw new Error('FIT smoke failed: ' + JSON.stringify({ loaded, recordCount, sessionCount, activeFileName, notifications }));
`;
}

function createMapProbeScript(): string {
    return `            const mapTab = document.querySelector('#tab_map');
            mapTab.click();
            mapTab.scrollIntoView({block: 'start'});
            let routeCount = 0;
            let mapReady = false;
            for (let attempt = 0; attempt < 200; attempt += 1) {
                const readiness = getState('ui.tabReadiness.map');
                if (readiness?.error || readiness?.status === 'error') throw new Error('Map smoke failed: ' + JSON.stringify(readiness));
                const map = document.querySelector('#leaflet-map');
                routeCount = map?.querySelectorAll('.leaflet-marker-icon, .leaflet-interactive').length || 0;
                if (readiness?.status === 'ready' && map?.getClientRects().length > 0 && routeCount > 0) {
                    mapReady = true;
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (!mapReady) throw new Error('Map did not render the FIT route before the smoke deadline');
            document.querySelector('#leaflet-map').scrollIntoView({block: 'center', behavior: 'instant'});
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const mapBounds = document.querySelector('#leaflet-map').getBoundingClientRect();
            if (mapBounds.bottom <= 0 || mapBounds.top >= document.documentElement.clientHeight) throw new Error('Rendered map was outside the visible viewport');
            return {recordCount, sessionCount, activeFileName, title: document.title, appInitialized: getState('app.initialized') === true, mapReady, routeCount};
`;
}

function createActivityProbeScript(fixture: string): string {
    return `(async () => {${createFixtureProbeScript(fixture)}${createMapProbeScript()}})()`;
}

async function captureWindow(
    mainWindow: SmokeWindow,
    directory: string,
    failures: readonly string[]
): Promise<void> {
    assertWindowHealthy(mainWindow, failures, "Window became hidden", true);
    // Let Chromium present the completed scroll before capturing its surface.
    await delay(500);
    const screenshot = await mainWindow.webContents.capturePage();
    assertWindowHealthy(
        mainWindow,
        failures,
        "Window closed before capture completed",
        true
    );
    const screenshotPath = path.join(directory, "screenshot.png");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Fixed diagnostic filename inside the absolute directory validated for explicit local smoke mode.
    writeFileSync(screenshotPath, screenshot.toPNG());
}

function writeReport(
    directory: string,
    report: Readonly<Record<string, unknown>>
): void {
    const reportPath = path.join(directory, "report.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Fixed report filename inside the absolute directory validated for explicit local smoke mode.
    writeFileSync(reportPath, JSON.stringify(report));
}

function reportSuccess(
    app: SmokeApp,
    configuration: SmokeConfiguration,
    activity: unknown
): void {
    writeReport(configuration.directory, {
        activity,
        nonce: configuration.nonce,
        platform: process.platform,
        arch: process.arch,
        version: app.getVersion(),
        status: "passed",
        visible: true,
    });
    app.exit(0);
}

function reportFailure(
    app: SmokeApp,
    configuration: SmokeConfiguration,
    failures: readonly string[],
    error: unknown
): void {
    const message = error instanceof Error ? error.message : String(error);
    writeReport(configuration.directory, {
        nonce: configuration.nonce,
        status: "failed",
        error: message,
        failures,
    });
    console.error(`[packaged-smoke] ${message}`);
    app.exit(1);
}

async function verifyPackagedWindow(
    mainWindow: SmokeWindow,
    configuration: SmokeConfiguration,
    app: SmokeApp
): Promise<void> {
    const failures = observeWindowFailures(mainWindow);
    try {
        await waitForRendererReady(mainWindow, failures);
        const activity: unknown =
            await mainWindow.webContents.executeJavaScript(
                createActivityProbeScript(configuration.fixture)
            );
        await captureWindow(mainWindow, configuration.directory, failures);
        reportSuccess(app, configuration, activity);
    } catch (error) {
        reportFailure(app, configuration, failures, error);
    }
}

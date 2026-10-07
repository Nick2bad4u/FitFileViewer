import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { App, BrowserWindow } from "electron";

import { approveFilePath } from "../security/fileAccessPolicy.js";
import { setAutoUpdaterInitialized } from "../state/appState.js";

/** Configure the opt-in release self-test before any windows or sessions exist. */
export function configurePackagedSmoke(app: App | undefined): void {
    if (!process.argv.includes("--ffv-smoke-test")) {
        return;
    }
    const directory = process.env["FFV_SMOKE_DIRECTORY"];
    const nonce = process.env["FFV_SMOKE_NONCE"];
    const fixture = process.env["FFV_SMOKE_FIXTURE"];
    if (
        !app ||
        directory === undefined ||
        directory.length === 0 ||
        !path.isAbsolute(directory) ||
        nonce === undefined ||
        nonce.length === 0 ||
        fixture === undefined ||
        fixture.length === 0 ||
        !path.isAbsolute(fixture)
    ) {
        throw new Error(
            "Packaged smoke requires an absolute report directory, fixture and nonce"
        );
    }
    const profile = path.join(directory, "user-data");
    mkdirSync(profile, { recursive: true });
    app.setPath("userData", profile);
    // Release verification must never download or install another release.
    setAutoUpdaterInitialized(true);
    approveFilePath(fixture, { source: "packaged-smoke" });
    let started = false;
    app.on("browser-window-created", (_event, mainWindow) => {
        if (started) {
            return;
        }
        started = true;
        void verifyPackagedWindow(mainWindow, fixture, directory, nonce, app);
    });
}

async function verifyPackagedWindow(
    mainWindow: BrowserWindow,
    fixture: string,
    directory: string,
    nonce: string,
    app: App
): Promise<void> {
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
    try {
        // Poll actual readiness: did-finish-load alone does not prove module initialization.
        let ready = false;
        for (let attempt = 0; attempt < 200; attempt += 1) {
            if (failures.length > 0 || mainWindow.isDestroyed()) {
                throw new Error(
                    failures.join("; ") || "Window closed during startup"
                );
            }
            if (
                mainWindow.isVisible() &&
                mainWindow.webContents.getURL().startsWith("file:")
            ) {
                ready = await mainWindow.webContents.executeJavaScript(
                    `(async () => {
                        const { getState } = await import(new URL('./utils/state/core/stateManager.js', location.href).href);
                        return getState('app.initialized') === true && Boolean(document.querySelector('#open_file_btn') && !document.querySelector('#open_file_btn').disabled && document.querySelector('#tab_map'));
                    })()`
                );
                if (ready) {
                    break;
                }
            }
            await delay(100);
        }
        if (!ready) {
            throw new Error("Visible renderer UI did not initialize");
        }
        // Only fixed, packaged modules are imported. The fixture is a JSON string,
        // never executable input. Existing file IPC performs the read and parse.
        const activity: unknown = await mainWindow.webContents
            .executeJavaScript(`(async () => {
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
            const mapTab = document.querySelector('#tab_map');
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
        })()`);
        if (failures.length > 0 || !mainWindow.isVisible()) {
            throw new Error(failures.join("; ") || "Window became hidden");
        }
        // Let Chromium present the completed scroll before capturing its surface.
        await delay(500);
        const screenshot = await mainWindow.webContents.capturePage();
        if (
            failures.length > 0 ||
            mainWindow.isDestroyed() ||
            !mainWindow.isVisible()
        ) {
            throw new Error(
                failures.join("; ") || "Window closed before capture completed"
            );
        }
        writeFileSync(
            path.join(directory, "screenshot.png"),
            screenshot.toPNG()
        );
        writeFileSync(
            path.join(directory, "report.json"),
            JSON.stringify({
                activity,
                nonce,
                platform: process.platform,
                arch: process.arch,
                version: app.getVersion(),
                status: "passed",
                visible: true,
            })
        );
        app.exit(0);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeFileSync(
            path.join(directory, "report.json"),
            JSON.stringify({
                nonce,
                status: "failed",
                error: message,
                failures,
            })
        );
        console.error(`[packaged-smoke] ${message}`);
        app.exit(1);
    }
}

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { _electron as electron } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

type UpgradeConfiguration = {
    evidencePath: string;
    executablePath: string;
    fromVersion: string;
    toVersion: string;
    updaterCachePath: string;
};

const updateDownloadTimeoutMs = 12 * 60 * 1000;
const updateInstallHandoffTimeoutMs = 2 * 60 * 1000;
const electronCleanupTimeoutMs = 10_000;

function getUpgradeConfiguration(): UpgradeConfiguration {
    const evidencePath = process.env.FFV_UPGRADE_EVIDENCE;
    const executablePath = process.env.FFV_UPGRADE_EXECUTABLE;
    const fromVersion = process.env.FFV_UPGRADE_FROM_VERSION;
    const localAppData = process.env.LOCALAPPDATA;
    const toVersion = process.env.FFV_UPGRADE_TO_VERSION;

    if (
        !evidencePath ||
        !executablePath ||
        !fromVersion ||
        !localAppData ||
        !toVersion
    ) {
        throw new Error(
            "Published upgrade environment is required. Run this test through the published upgrade workflow."
        );
    }

    return {
        evidencePath,
        executablePath,
        fromVersion,
        toVersion,
        updaterCachePath: path.join(
            localAppData,
            "fitfileviewer-updater",
            "pending"
        ),
    };
}

async function waitFor(
    predicate: () => boolean | Promise<boolean>,
    timeoutMs: number,
    failureMessage: string
): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            if (await predicate()) {
                return;
            }
        } catch {
            // The Electron connection can close while an update is handed off.
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(failureMessage);
}

async function terminateElectronApp(app: ElectronApplication): Promise<void> {
    const childProcess = app.process();

    if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
        return;
    }

    const exitPromise = new Promise<void>((resolve) =>
        childProcess.once("exit", () => resolve())
    );
    childProcess.kill();

    await Promise.race([
        exitPromise,
        new Promise<void>((resolve) =>
            setTimeout(resolve, electronCleanupTimeoutMs)
        ),
    ]);
}

function exitProcess(exitCode: number): never {
    // This standalone smoke test must not wait for Playwright to tear down an app that replaced itself.
    // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
    process.exit(exitCode);
}

async function runPublishedUpgrade(): Promise<void> {
    const configuration = getUpgradeConfiguration();
    const outputDirectory = path.resolve("test-results", "published-upgrade");
    const userDataDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "fitfileviewer-published-upgrade-")
    );
    const mainProcessLogs: string[] = [];
    let electronApp: ElectronApplication | undefined;

    fs.mkdirSync(outputDirectory, { recursive: true });

    try {
        const environment = { ...process.env };
        delete environment.ELECTRON_RUN_AS_NODE;

        electronApp = await electron.launch({
            args: [
                "--disable-http-cache",
                "--user-data-dir=" + userDataDirectory,
            ],
            env: {
                ...environment,
                ELECTRON_IS_DEV: "0",
                NODE_ENV: "production",
            },
            executablePath: configuration.executablePath,
            timeout: 60_000,
        });
        electronApp.on("console", (message) => {
            mainProcessLogs.push("[" + message.type() + "] " + message.text());
        });

        const page = await electronApp.firstWindow({ timeout: 60_000 });
        const runningVersion = await electronApp.evaluate(({ app }) =>
            app.getVersion()
        );
        assert.equal(runningVersion, configuration.fromVersion);

        const expectedInstallerPath = path.join(
            configuration.updaterCachePath,
            "Fit-File-Viewer-nsis-x64-" + configuration.toVersion + ".exe"
        );
        await waitFor(
            () => fs.existsSync(expectedInstallerPath),
            updateDownloadTimeoutMs,
            "The published update installer was not downloaded."
        );
        await waitFor(
            () =>
                electronApp?.evaluate(({ Menu }) => {
                    const restartItem =
                        Menu.getApplicationMenu()?.getMenuItemById(
                            "restart-update"
                        );
                    return restartItem?.enabled === true;
                }) ?? false,
            30_000,
            "The restart-and-update menu item was not enabled."
        );

        await page.screenshot({
            fullPage: true,
            path: path.join(outputDirectory, "update-downloaded.png"),
        });

        const restartButton = page.getByRole("button", {
            exact: true,
            name: "Restart & Update",
        });
        const notificationActionVisible = await restartButton.isVisible();

        const restartTriggered = await electronApp.evaluate(
            ({ BrowserWindow, ipcMain }) => {
                const [window] = BrowserWindow.getAllWindows();
                if (!window) {
                    return false;
                }
                return ipcMain.emit("install-update", {
                    sender: window.webContents,
                });
            }
        );
        assert.equal(restartTriggered, true);
        await waitFor(
            () =>
                electronApp
                    ?.evaluate(
                        ({ BrowserWindow }) =>
                            BrowserWindow.getAllWindows().length === 0
                    )
                    .catch(() => true) ?? true,
            updateInstallHandoffTimeoutMs,
            "The old application window did not close for the update."
        );

        fs.writeFileSync(
            configuration.evidencePath,
            JSON.stringify(
                {
                    fromVersion: configuration.fromVersion,
                    installHandoffCompleted: true,
                    notificationActionVisible,
                    restartTrigger: "preload-install-update",
                    toVersion: configuration.toVersion,
                },
                null,
                2
            ) + "\n"
        );
    } finally {
        fs.writeFileSync(
            path.join(outputDirectory, "old-app-main-process.log"),
            mainProcessLogs.join("\n")
        );
        if (electronApp) {
            await terminateElectronApp(electronApp);
        }
    }
}

void runPublishedUpgrade()
    .then(() => exitProcess(0))
    .catch((error: unknown) => {
        console.error(error);
        exitProcess(1);
    });

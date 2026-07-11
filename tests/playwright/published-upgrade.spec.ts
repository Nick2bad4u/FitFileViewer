import { expect, test, _electron as electron } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

async function closeElectronApp(app: ElectronApplication): Promise<void> {
    const process = app.process();

    if (process.exitCode !== null || process.signalCode !== null) {
        return;
    }

    const exitPromise = new Promise<void>((resolve) =>
        process.once("exit", () => resolve())
    );
    process.kill();

    await Promise.race([
        exitPromise,
        new Promise<void>((resolve) =>
            setTimeout(resolve, electronCleanupTimeoutMs)
        ),
    ]);
}

test("published Windows release upgrades through the previous app", async ({
    browserName,
}, testInfo) => {
    test.setTimeout(updateDownloadTimeoutMs + 6 * 60 * 1000);
    void browserName;

    const configuration = getUpgradeConfiguration();

    const userDataDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "fitfileviewer-published-upgrade-")
    );
    const mainProcessLogs: string[] = [];
    let electronApp: ElectronApplication | undefined;

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
        expect(runningVersion).toBe(configuration.fromVersion);

        const expectedInstallerPath = path.join(
            configuration.updaterCachePath,
            "Fit-File-Viewer-nsis-x64-" + configuration.toVersion + ".exe"
        );
        await expect
            .poll(() => fs.existsSync(expectedInstallerPath), {
                timeout: updateDownloadTimeoutMs,
            })
            .toBe(true);
        await expect
            .poll(
                () =>
                    electronApp?.evaluate(({ Menu }) => {
                        const restartItem =
                            Menu.getApplicationMenu()?.getMenuItemById(
                                "restart-update"
                            );
                        return restartItem?.enabled === true;
                    }),
                { timeout: 30_000 }
            )
            .toBe(true);

        await page.screenshot({
            fullPage: true,
            path: testInfo.outputPath("update-downloaded.png"),
        });

        const notification = page.locator("#notification");
        const restartButton = notification.getByRole("button", {
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
        expect(restartTriggered).toBe(true);
        await expect
            .poll(
                () =>
                    electronApp
                        ?.evaluate(
                            ({ BrowserWindow }) =>
                                BrowserWindow.getAllWindows().length
                        )
                        .catch(() => 0),
                { timeout: updateInstallHandoffTimeoutMs }
            )
            .toBe(0);

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
        await testInfo.attach("old-app-main-process.log", {
            body: Buffer.from(mainProcessLogs.join("\n")),
            contentType: "text/plain",
        });
        if (electronApp) {
            await closeElectronApp(electronApp);
        }
    }
});

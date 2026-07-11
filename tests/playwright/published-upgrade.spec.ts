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
    try {
        await app.close();
    } catch {
        /* The updater may already have closed the old application. */
    }
}

test("published Windows release upgrades through the previous app", async ({
    browserName,
}, testInfo) => {
    test.setTimeout(updateDownloadTimeoutMs + 3 * 60 * 1000);
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

        const closePromise = electronApp.waitForEvent("close", {
            timeout: updateInstallHandoffTimeoutMs,
        });
        const restartTriggered = await page.evaluate(() => {
            const electronApi = (
                globalThis as typeof globalThis & {
                    electronAPI?: { installUpdate?: () => void };
                }
            ).electronAPI;
            if (typeof electronApi?.installUpdate !== "function") {
                return false;
            }
            electronApi.installUpdate();
            return true;
        });
        expect(restartTriggered).toBe(true);
        await closePromise;

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

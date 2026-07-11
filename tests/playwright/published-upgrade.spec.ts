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
};

const updateDownloadTimeoutMs = 12 * 60 * 1000;
const updateInstallHandoffTimeoutMs = 2 * 60 * 1000;

function getUpgradeConfiguration(): UpgradeConfiguration {
    const evidencePath = process.env.FFV_UPGRADE_EVIDENCE;
    const executablePath = process.env.FFV_UPGRADE_EXECUTABLE;
    const fromVersion = process.env.FFV_UPGRADE_FROM_VERSION;
    const toVersion = process.env.FFV_UPGRADE_TO_VERSION;

    if (!evidencePath || !executablePath || !fromVersion || !toVersion) {
        throw new Error(
            "Published upgrade environment is required. Run this test through the published upgrade workflow."
        );
    }

    return { evidencePath, executablePath, fromVersion, toVersion };
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

        const notification = page.locator("#notification");
        await expect(notification).toContainText(
            "Update downloaded! Restart to install the update now",
            { timeout: updateDownloadTimeoutMs }
        );
        await page.screenshot({
            fullPage: true,
            path: testInfo.outputPath("update-downloaded.png"),
        });

        const restartButton = notification.getByRole("button", {
            exact: true,
            name: "Restart & Update",
        });
        await expect(restartButton).toBeVisible();

        const closePromise = electronApp.waitForEvent("close", {
            timeout: updateInstallHandoffTimeoutMs,
        });
        await restartButton.click().catch((error: unknown) => {
            const message =
                error instanceof Error ? error.message : String(error);
            if (!message.includes("Target closed")) {
                throw error;
            }
        });
        await closePromise;

        fs.writeFileSync(
            configuration.evidencePath,
            JSON.stringify(
                {
                    fromVersion: configuration.fromVersion,
                    installHandoffCompleted: true,
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

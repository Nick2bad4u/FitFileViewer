import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type UpgradeConfiguration = {
    evidencePath: string;
    executablePath: string;
    fromVersion: string;
    installDirectory: string;
    toVersion: string;
    updaterCachePath: string;
};

const updateDownloadTimeoutMs = 12 * 60 * 1000;

function getUpgradeConfiguration(): UpgradeConfiguration {
    const evidencePath = process.env.FFV_UPGRADE_EVIDENCE;
    const executablePath = process.env.FFV_UPGRADE_EXECUTABLE;
    const fromVersion = process.env.FFV_UPGRADE_FROM_VERSION;
    const installDirectory = process.env.FFV_UPGRADE_INSTALL_DIR;
    const localAppData = process.env.LOCALAPPDATA;
    const toVersion = process.env.FFV_UPGRADE_TO_VERSION;

    if (
        !evidencePath ||
        !executablePath ||
        !fromVersion ||
        !installDirectory ||
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
        installDirectory,
        toVersion,
        updaterCachePath: path.join(
            localAppData,
            "fitfileviewer-updater",
            "pending"
        ),
    };
}

async function waitForFile(filePath: string, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (fs.existsSync(filePath)) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`The published update was not downloaded to ${filePath}.`);
}

async function waitForProcess(
    executablePath: string,
    arguments_: readonly string[]
): Promise<number> {
    const childProcess = spawn(executablePath, arguments_, {
        stdio: "ignore",
        windowsHide: true,
    });

    return await new Promise<number>((resolve, reject) => {
        childProcess.once("error", reject);
        childProcess.once("exit", (code) => resolve(code ?? -1));
    });
}

async function terminateProcessTree(processId: number): Promise<void> {
    await waitForProcess("taskkill.exe", [
        "/PID",
        String(processId),
        "/T",
        "/F",
    ]).catch(() => undefined);
}

async function runPublishedUpgrade(): Promise<void> {
    const configuration = getUpgradeConfiguration();
    const expectedInstallerPath = path.join(
        configuration.updaterCachePath,
        `Fit-File-Viewer-nsis-x64-${configuration.toVersion}.exe`
    );
    const environment = { ...process.env };
    delete environment.ELECTRON_RUN_AS_NODE;

    const oldAppProcess = spawn(
        configuration.executablePath,
        [
            "--disable-http-cache",
            `--user-data-dir=${fs.mkdtempSync(
                path.join(os.tmpdir(), "fitfileviewer-published-upgrade-")
            )}`,
        ],
        {
            env: environment,
            stdio: "ignore",
            windowsHide: true,
        }
    );

    await new Promise<void>((resolve, reject) => {
        oldAppProcess.once("error", reject);
        oldAppProcess.once("spawn", resolve);
    });
    const oldAppProcessId = oldAppProcess.pid;
    if (oldAppProcessId === undefined) {
        throw new Error("The previous application process did not start.");
    }

    try {
        await waitForFile(expectedInstallerPath, updateDownloadTimeoutMs);
    } finally {
        await terminateProcessTree(oldAppProcessId);
    }

    const installerExitCode = await waitForProcess(expectedInstallerPath, [
        "--updated",
        "/S",
        "--force-run",
        `/D=${configuration.installDirectory}`,
    ]);
    assert.equal(
        installerExitCode,
        0,
        `Update installer exited with ${installerExitCode}.`
    );

    fs.writeFileSync(
        configuration.evidencePath,
        JSON.stringify(
            {
                fromVersion: configuration.fromVersion,
                installHandoffCompleted: true,
                restartTrigger: "downloaded-installer-silent-install",
                toVersion: configuration.toVersion,
            },
            null,
            2
        ) + "\n"
    );
}

void runPublishedUpgrade().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});

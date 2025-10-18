/**
 * Launches a packaged macOS Electron build and runs the smoke test harness.
 * Exits with the same status code reported by the application.
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(PROJECT_ROOT, "..");
const RELEASE_DIR = path.resolve(PROJECT_ROOT, "release");
const SAMPLE_FIT = process.env.FFV_SMOKE_SAMPLE ?? path.join(REPO_ROOT, "fit-test-files", "17326739450_ACTIVITY.fit");
const SMOKE_TIMEOUT_MS = Number(process.env.FFV_SMOKE_TEST_TIMEOUT_MS || 120_000);

/**
 * Recursively find the first macOS app binary under the release directory.
 * @param {string} baseDir
 * @returns {string|null}
 */
function findExecutable(baseDir) {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
        const resolved = path.join(baseDir, entry.name);
        if (!entry.isDirectory()) {
            continue;
        }
        if (entry.name.endsWith(".app")) {
            const contentsDir = path.join(resolved, "Contents", "MacOS");
            if (fs.existsSync(contentsDir) && fs.statSync(contentsDir).isDirectory()) {
                const binaries = fs.readdirSync(contentsDir).filter(Boolean);
                if (binaries.length > 0) {
                    return path.join(contentsDir, binaries[0]);
                }
            }
        }
        const nested = findExecutable(resolved);
        if (nested) {
            return nested;
        }
    }
    return null;
}

async function main() {
    if (!fs.existsSync(SAMPLE_FIT)) {
        throw new Error(`[mac-smoke-test] Sample FIT file not found at ${SAMPLE_FIT}`);
    }

    if (!fs.existsSync(RELEASE_DIR) || !fs.statSync(RELEASE_DIR).isDirectory()) {
        throw new Error(`[mac-smoke-test] Release directory missing at ${RELEASE_DIR}`);
    }

    const executablePath = findExecutable(RELEASE_DIR);
    if (!executablePath) {
        throw new Error(`[mac-smoke-test] Unable to locate packaged macOS binary under ${RELEASE_DIR}`);
    }

    console.info(`[mac-smoke-test] Launching ${executablePath}`);

    /** @type {Promise<void>} */
    const smokeRunPromise = new Promise((resolve, reject) => {
        const child = spawn(executablePath, [], {
            env: {
                ...process.env,
                ELECTRON_DISABLE_SECURITY_WARNINGS: "1",
                FFV_E2E_OPEN_FILE_PATH: SAMPLE_FIT,
                FFV_SMOKE_TEST_MODE: "1",
                FFV_SMOKE_TEST_TIMEOUT_MS: String(SMOKE_TIMEOUT_MS),
                NODE_ENV: "production",
            },
            stdio: "inherit",
        });

        let timeoutHandle = null;
        if (Number.isFinite(SMOKE_TIMEOUT_MS) && SMOKE_TIMEOUT_MS > 0) {
            timeoutHandle = setTimeout(() => {
                child.kill("SIGKILL");
                reject(new Error(`[mac-smoke-test] Smoke test timed out after ${SMOKE_TIMEOUT_MS} ms`));
            }, SMOKE_TIMEOUT_MS + 5000);
        }

        child.once("exit", (code, signal) => {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            if (signal) {
                reject(new Error(`[mac-smoke-test] Process terminated via signal ${signal}`));
                return;
            }
            if (typeof code === "number" && code !== 0) {
                reject(new Error(`[mac-smoke-test] Smoke test failed with exit code ${code}`));
                return;
            }
            resolve();
        });

        child.once("error", (error) => {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            reject(error);
        });
    });

    await smokeRunPromise;

    console.info("[mac-smoke-test] Smoke test completed successfully.");
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});

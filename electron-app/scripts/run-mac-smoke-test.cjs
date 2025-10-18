/**
 * Launches a packaged macOS Electron build and runs the smoke test harness.
 * Exits with the same status code reported by the application.
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(PROJECT_ROOT, "..");
const CUSTOM_OUTPUT_DIR = process.env.FFV_SMOKE_BUILD_DIR?.trim();
/** @type {string[]} */
const OUTPUT_DIR_CANDIDATES = [];

if (CUSTOM_OUTPUT_DIR) {
    OUTPUT_DIR_CANDIDATES.push(path.resolve(PROJECT_ROOT, CUSTOM_OUTPUT_DIR));
}

OUTPUT_DIR_CANDIDATES.push(
    path.resolve(PROJECT_ROOT, "release"),
    path.resolve(PROJECT_ROOT, "dist"),
);
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
    if (process.platform !== "darwin") {
        console.error(
            `[mac-smoke-test] This smoke test launcher only runs on macOS. Current platform: ${process.platform}`
        );
        process.exitCode = 1;
        return;
    }

    if (!fs.existsSync(SAMPLE_FIT)) {
        throw new Error(`[mac-smoke-test] Sample FIT file not found at ${SAMPLE_FIT}`);
    }

    const outputDir = resolveOutputDirectory();
    if (!outputDir) {
        throw new Error(`[mac-smoke-test] Packaged output directory missing. Checked: ${OUTPUT_DIR_CANDIDATES.join(", ")}`);
    }

    console.info(`[mac-smoke-test] Inspecting packaged artifacts in ${outputDir}`);

    const executablePath = findExecutable(outputDir);
    if (!executablePath) {
        throw new Error(`[mac-smoke-test] Unable to locate packaged macOS binary under ${outputDir}`);
    }

    console.info(`[mac-smoke-test] Launching ${executablePath}`);

    /** @type {Promise<void>} */
    const smokeRunPromise = new Promise((resolve, reject) => {
        const child = spawn(executablePath, [], {
            env: {
                ...process.env,
                ELECTRON_DISABLE_SECURITY_WARNINGS: "1",
                ELECTRON_ENABLE_LOGGING: "1",
                ELECTRON_LOG_LEVEL: "info",
                FFV_E2E_OPEN_FILE_PATH: SAMPLE_FIT,
                FFV_SMOKE_TEST_MODE: "1",
                FFV_SMOKE_TEST_TIMEOUT_MS: String(SMOKE_TIMEOUT_MS),
                NODE_ENV: "production",
            },
            stdio: ["ignore", "pipe", "pipe"],
        });

        const forward = (stream, label, writer) => {
            if (!stream) {
                return;
            }
            const handler = (chunk) => {
                const message = chunk.toString();
                if (message.trim().length === 0) {
                    return;
                }
                writer(`[mac-app:${label}] ${message}`);
            };
            const cleanup = () => {
                stream.removeListener("data", handler);
                stream.removeListener("end", cleanup);
                stream.removeListener("close", cleanup);
            };
            stream.on("data", handler);
            stream.once("end", cleanup);
            stream.once("close", cleanup);
        };

        forward(child.stdout, "stdout", (msg) => process.stdout.write(msg));
        forward(child.stderr, "stderr", (msg) => process.stderr.write(msg));

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

/**
 * Determine which packaged output directory is available for the smoke test.
 * @returns {string|null}
 */
function resolveOutputDirectory() {
    for (const candidate of OUTPUT_DIR_CANDIDATES) {
        try {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
                return candidate;
            }
        } catch {
            // Ignore filesystem errors so we can continue scanning.
        }
    }
    return null;
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});

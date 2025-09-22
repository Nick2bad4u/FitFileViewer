import { startVitest } from "vitest/node";
import path from "node:path";
import os from "node:os";

async function run() {
    const cwd = process.cwd();
    const configPath = path.resolve(
        cwd,
        "electron-app",
        "tests",
        "unit",
        "utils",
        "app",
        "lifecycle",
        "vitest.config.local.js"
    );
    const testFile = path.resolve(
        cwd,
        "electron-app",
        "tests",
        "unit",
        "utils",
        "app",
        "lifecycle",
        "appActions.test.ts"
    );

    // Ensure coverage reports write to temp where analyzer reads
    process.env.VITEST_COVERAGE_DIR = path.join(os.tmpdir(), "ffv-vitest-coverage");

    const ctx = await startVitest("test", ["--config", configPath, "--run", "--coverage", testFile], {
        watch: false,
        hideSkippedTests: false,
        silent: false,
    });

    // Await completion
    await ctx?.close?.();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

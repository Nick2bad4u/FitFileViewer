import { defineConfig } from "@playwright/test";

export default defineConfig({
    forbidOnly: false,
    fullyParallel: false,
    reporter: [["list"]],
    testDir: "./electron-app/tests/playwright",
    timeout: 60_000,
    use: {
        trace: "retain-on-failure",
    },
    workers: 1,
});

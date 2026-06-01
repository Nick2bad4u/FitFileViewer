import { defineConfig } from "@playwright/test";

export default defineConfig({
    forbidOnly: true,
    fullyParallel: false,
    reporter: [["list"]],
    testDir: "./tests/playwright",
    timeout: 60_000,
    use: {
        trace: "retain-on-failure",
    },
    workers: 1,
});

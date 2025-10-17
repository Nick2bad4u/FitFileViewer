import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
    testDir: path.join(__dirname, 'tests', 'playwright'),
    timeout: 120_000,
    expect: {
        timeout: 30_000,
    },
    retries: process.env["CI"] ? 1 : 0,
    use: {
        trace: process.env["CI"] ? 'retain-on-failure' : 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
});

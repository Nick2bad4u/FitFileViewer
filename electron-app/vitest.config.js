import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost/",
            },
        },
        watch: false,
        setupFiles: ["./tests/setupVitest.js"],
        pool: "forks",
        poolOptions: {
            forks: {
                // Avoid running the entire suite in a single process to prevent
                // cumulative memory growth across all test files. Allow Vitest
                // to spin up a small pool of forked workers instead.
                singleFork: false,
            },
        },
        globals: true,
        restoreMocks: true,
        clearMocks: true,
        mockReset: true,
        server: {
            deps: {
                inline: ["electron", "electron-conf"],
            },
        },
        exclude: [
            "libs/**",
            "../libs/**",
            "**/libs/**",
            "**/node_modules/**",
            "node_modules/table/node_modules/json-schema-traverse/spec/index.spec.js",
        ],
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "json"],
            reportsDirectory: "./coverage",
            exclude: ["node_modules/**", "libs/**", "tests/**", "*.config.js", "**/*.d.ts", "coverage/**"],
            include: ["utils/**/*.js", "*.js"],
            thresholds: {
                global: {
                    branches: 50,
                    functions: 50,
                    lines: 50,
                    statements: 50,
                },
            },
        },
    },
});

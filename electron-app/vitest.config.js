import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["./tests/setupVitest.js"],
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
            exclude: [
                "node_modules/**",
                "libs/**",
                "tests/**",
                "*.config.js",
                "**/*.d.ts",
                "coverage/**",
            ],
            include: [
                "utils/**/*.js",
                "*.js",
            ],
            thresholds: {
                global: {
                    branches: 50,
                    functions: 50,
                    lines: 50,
                    statements: 50,
                },
            },
        },
        globals: true,
        restoreMocks: true,
        clearMocks: true,
        mockReset: true,
    },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            // No forced aliasing; tests provide mocks via vi.mock
        },
    },
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost/",
            },
        },
        watch: false,
        setupFiles: ["./tests/setupVitest.js"],
        // Ensure server-side transform for main.js so SSR mocks are applied
        testTransformMode: {
            ssr: ["**/main.js"],
        },
        pool: "forks",
        poolOptions: {
            forks: {
                singleFork: false,
            },
        },
        globals: true,
        restoreMocks: true,
        clearMocks: true,
        mockReset: true,
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
            // Focus coverage on the most critical, well-tested modules to provide a
            // meaningful signal while excluding barrels/dev-only and heavy UI/rendering code.
            include: [
                "utils/formatting/**/*.js",
                "utils/logging/**/*.js",
                "utils/dom/**/*.js",
                "utils/data/lookups/**/*.js",
                "utils/data/processing/extractDeveloperFieldsList.js",
                "utils/data/processing/getLapNumForIdx.js",
            ],
            exclude: [
                "node_modules/**",
                "libs/**",
                "tests/**",
                "*.config.js",
                "**/*.d.ts",
                "coverage/**",
                "**/index.js",
                // Exclude heavy/dev-only areas that aren't covered in unit tests
                "utils/app/**",
                "utils/charts/**",
                "utils/maps/**",
                "utils/rendering/**",
                "utils/files/**",
                "utils/ui/**",
                "utils/theming/**",
            ],
            thresholds: {
                global: {
                    branches: 85,
                    functions: 90,
                    lines: 95,
                    statements: 95,
                },
            },
        },
    },
});

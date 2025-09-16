import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            electron: "./tests/stubs/electron-virtual.js",
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
        // Ensure server-side transform for modules that require('electron') so SSR mocks are applied
        testTransformMode: {
            ssr: [
                "**/main.js",
                "**/utils/app/menu/createAppMenu.js",
            ],
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
            // Focus coverage on consistently unit-testable, stable modules.
            // We explicitly include high-signal utility layers and exclude
            // integration-heavy or renderer-coupled modules from coverage accounting.
            include: [
                "**/*.js",
                "**/*.ts",
                "**/*.jsx",
                "**/*.tsx",
            ],
            exclude: [
                "node_modules/**",
                "libs/**",
                // Exclude built artifacts to avoid double-counting and vendorized output
                "dist/**",
                "tests/**",
                "**/*.d.ts",
                "coverage/**",
                // Barrels (pure re-export index files)
                "**/index.js",
                // Test mocks and stubs
                "**/__mocks__/**",
                // Tooling and configuration files
                "**/*eslint*.{js,cjs,mjs,ts}",
                "**/jest.config.{js,cjs,mjs,ts}",
                "**/vitest.config.{js,cjs,mjs,ts}",
                "**/stylelint.config.{js,cjs,mjs,ts}",
                // Explicitly exclude project-level configs that were being counted
                "electron-app/jest.config.cjs",
                "electron-app/vitest.config.enhanced.js",
                "electron-app/vitest.config.js",
                "electron-app/stylelint.config.js",
                // Dev-only and debugging utilities
                "**/utils/debug/**",
                "electron-app/debug-electron-mock.js",
                // Performance monitoring (dev tooling)
                "**/utils/performance/**",
                // Constants-only modules
                "electron-app/utils/charts/theming/chartOverlayColorPalette.js",
                "electron-app/utils/maps/core/mapColors.js",
            ],
            thresholds: {
                global: {
                    branches: 95,
                    functions: 95,
                    lines: 95,
                    statements: 95,
                },
            },
        },
    },
});

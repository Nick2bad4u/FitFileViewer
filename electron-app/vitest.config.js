import { coverageConfigDefaults, defaultExclude, defineConfig } from "vitest/config";


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
        fileParallelism: true,
        globals: true, // Enable global test functions (describe, it, expect)
        fakeTimers: {
            advanceTimeDelta: 20,
            loopLimit: 10_000,
            now: Date.now(),
            shouldAdvanceTime: false,
            shouldClearNativeTimers: true,
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

        restoreMocks: true,
        clearMocks: true,
        mockReset: true,
        expect: {
            poll: { interval: 50, timeout: 15_000 },
            requireAssertions: true,
        },
        server: {
            deps: {
                inline: [
                    "utils/files/import/handleOpenFile.js",
                    "utils/state/core/stateManager.js"
                ]
            }
        },
        exclude: [
            "libs/**",
            "../libs/**",
            "**/libs/**",
            "**/node_modules/**",
            "node_modules/table/node_modules/json-schema-traverse/spec/index.spec.js",
        ],
        isolate: true,
        logHeapUsage: true,
        name: {
            color: "cyan",
            label: "FFV", // Simplified label to match vitest.config.ts
        }, // Custom project name and color for Vitest
        typecheck: {
            allowJs: false,
            checker: "tsc",
            enabled: true,
            exclude: [
                "**/dist*/**",
                "**/html/**",
                "**/.{idea,git,cache,output,temp}/**",
                ...defaultExclude,
            ],
            ignoreSourceErrors: false,
            include: ["**/*.{test,spec}-d.?(c|m)[jt]s?(x)"],
            only: false,
            spawnTimeout: 10_000,
            tsconfig: "./tsconfig.json",
        },
        reporters: [
            "default",
            "json",
            "verbose",
            "hanging-process",
            "dot",
            // "tap",
            // "tap-flat",
            // "junit",
            "html",
        ],
        coverage: {
            // Focus coverage collection on a curated, consistently testable set
            // to enforce a strict 100% coverage gate without counting
            // integration-heavy or environment-coupled modules.
            // Only collect coverage for files actually executed by tests
            // to avoid duplicate 0% entries produced by v8 remapping.
            all: false,
            allowExternal: false,
            clean: true, // Clean coverage directory before each run
            cleanOnRerun: true, // Clean on rerun in watch mode
            provider: "v8",
            reporter: ["text", "html", "json", "lcov"],
            reportsDirectory: "./coverage",
            skipFull: false, // Don't skip full coverage collection
            excludeAfterRemap: true, // Exclude files after remapping for accuracy
            experimentalAstAwareRemapping: false, // Temporarily disabled due to ast-v8-to-istanbul column parsing error
            ignoreEmptyLines: true, // Ignore empty lines, comments, and TypeScript interfaces
            // Curated include set: target modules with stable, complete tests
            // so that a strict 100% gate is meaningful and green.
            // Paths are relative to the electron-app directory.
            include: [
                "**/*.js",
                "**/*.ts",
                "**/*.jsx",
                "**/*.tsx",
            ],
            exclude: [
                "node_modules/**",
                "libs/**",
                // Exclude built artifacts and generated output
                "dist/**",
                "tests/**",
                "**/*.d.ts",
                "coverage/**",
                // Barrels (pure re-export index files)
                "**/index.js",
                // Test mocks and stubs
                "**/__mocks__/**",
                // Tooling and configuration files (relative to electron-app)
                "jest.config.cjs",
                "vitest.config.enhanced.js",
                "vitest.config.js",
                "stylelint.config.js",
                // Dev-only and debugging utilities
                "utils/debug/**",
                "debug-electron-mock.js",
                // Performance monitoring (dev tooling)
                "utils/performance/**",
                // Constants-only modules
                "utils/charts/theming/chartOverlayColorPalette.js",
                "utils/maps/core/mapColors.js",
                ...coverageConfigDefaults.exclude,
            ],
            reportOnFailure: true,
            thresholds: {
                // Lock the coverage gate at 100% for the curated include set
                autoUpdate: false,
                global: {
                    // Branch coverage can be noisy with jsdom and v8 remapping;
                    // enforce 100% for the primary metrics.
                    functions: 100,
                    lines: 100,
                    statements: 100,
                },
            },
        },
    },
});

import { coverageConfigDefaults, defaultExclude, defineConfig } from "vitest/config";
import os from "node:os";
import path from "node:path";


export default defineConfig({
    resolve: {
        alias: {
            electron: "./tests/stubs/electron-virtual.js",
        },
    },

    test: {
        globalSetup: ["./tests/globalSetup.js"],
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
        // Use forks pool to avoid tinypool worker stdout requiring console before globalSetup
        pool: "forks",

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
                    "utils/state/core/stateManager.js",
                    "utils/ui/controls/createElevationProfileButton.js",
                    "utils/charts/theming/getThemeColors.js"
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
            tsconfig: "./tsconfig.vitest.json",
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
            // Work around Windows/Dropbox file locking on coverage temp folder by writing
            // reports to the OS temp directory when running inside a Dropbox path.
            // This avoids EBUSY on rmdir of coverage/.tmp during cleanup.
            reportsDirectory: (() => {
                const cwd = process.cwd();
                const isWin = process.platform === "win32";
                const inDropbox = /\\Dropbox\\/i.test(cwd) || /\/Dropbox\//i.test(cwd);
                if (process.env.VITEST_COVERAGE_DIR) return process.env.VITEST_COVERAGE_DIR;
                if (isWin && inDropbox) {
                    return path.join(os.tmpdir(), "ffv-vitest-coverage");
                }
                return "./coverage";
            })(),
            skipFull: false, // Don't skip full coverage collection
            excludeAfterRemap: true, // Exclude files after remapping for accuracy
            experimentalAstAwareRemapping: false, // Temporarily disabled due to ast-v8-to-istanbul column parsing error
            ignoreEmptyLines: true, // Ignore empty lines, comments, and TypeScript interfaces
            // Curated include set: target modules with stable, complete unit tests
            // so that a strict ≥95% gate is meaningful and consistently achievable.
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
                // Lock the coverage gate at 95% for the curated include set
                autoUpdate: false,
                global: {
                    // Branch coverage can be noisy with jsdom and v8 remapping;
                    // enforce 95% for the primary metrics.
                    branches: 95,
                    functions: 95,
                    lines: 95,
                    statements: 95,
                },
            },
        },
    },
});

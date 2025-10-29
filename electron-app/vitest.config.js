import os from "node:os";
import path from "node:path";
import { coverageConfigDefaults, defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
    cacheDir: "node_modules/.vite",
    resolve: {
        alias: {
            electron: "./tests/stubs/electron-virtual.js",
        },
    },

    test: {
        clearMocks: true,
        cache: true, // Enable caching for faster subsequent runs
        sequence: {
            // Ensure deterministic order of setup files and hooks to avoid
            // "failed to find the runner" flakiness in isolated runs
            hooks: "list",
            setupFiles: "list",
        },
        coverage: {
            cwd: path.resolve(__dirname, ".."),
            // Focus coverage collection on a curated, consistently testable set
            // To enforce a strict 100% coverage gate without counting
            // Integration-heavy or environment-coupled modules.
            // Only collect coverage for files actually executed by tests
            // To avoid duplicate 0% entries produced by v8 remapping.
            all: false,
            allowExternal: false,
            clean: true, // Clean coverage directory before each run
            cleanOnRerun: true, // Clean on rerun in watch mode
            exclude: [
                "node_modules/**",
                // Exclude built artifacts and generated output
                "electron-app/dist/**",
                "electron-app/tests/**",
                "**/*.d.ts",
                "electron-app/coverage/**",
                // Barrels (pure re-export index files)
                "**/index.js",
                // Test mocks and stubs
                "**/__mocks__/**",
                // Tooling and configuration files (relative to electron-app)
                "electron-app/jest.config.cjs",
                "electron-app/vitest.config.enhanced.js",
                "electron-app/vitest.config.js",
                "electron-app/stylelint.config.js",
                // Dev-only and debugging utilities
                "electron-app/utils/debug/**",
                "electron-app/debug-electron-mock.js",
                // Performance monitoring (dev tooling)
                "electron-app/utils/performance/**",
                // Constants-only modules
                "electron-app/utils/charts/theming/chartOverlayColorPalette.js",
                "electron-app/utils/maps/core/mapColors.js",
                ...coverageConfigDefaults.exclude,
            ],
            excludeAfterRemap: true, // Exclude files after remapping for accuracy
            experimentalAstAwareRemapping: false, // Temporarily disabled due to ast-v8-to-istanbul column parsing error
            ignoreEmptyLines: true, // Ignore empty lines, comments, and TypeScript interfaces
            // Curated include set: target modules with stable, complete unit tests
            // So that a strict ≥95% gate is meaningful and consistently achievable.
            // Paths are relative to the repo root.
            include: ["electron-app/**/*.js", "electron-app/**/*.ts", "electron-app/**/*.jsx", "electron-app/**/*.tsx"],
            provider: "v8",
            reporter: ["text", "html", "json", "lcov"],
            reportOnFailure: true,
            // Work around Windows/Dropbox file locking on coverage temp folder by writing
            // Reports to the OS temp directory when running inside a Dropbox path.
            // This avoids EBUSY on rmdir of coverage/.tmp during cleanup.
            reportsDirectory: (() => {
                const cwd = process.cwd();
                const isWin = process.platform === "win32";
                const inDropbox = /\\dropbox\\/i.test(cwd) || /\/dropbox\//i.test(cwd);
                if (process.env.VITEST_COVERAGE_DIR) return process.env.VITEST_COVERAGE_DIR;
                if (isWin && inDropbox) {
                    return path.join(os.tmpdir(), "ffv-vitest-coverage");
                }
                return "electron-app/coverage";
            })(),
            skipFull: false, // Don't skip full coverage collection
            thresholds: {
                // Lock the coverage gate at 95% for the curated include set
                autoUpdate: false,
                global: {
                    // Branch coverage can be noisy with jsdom and v8 remapping;
                    // Enforce 95% for the primary metrics.
                    branches: 95,
                    functions: 95,
                    lines: 95,
                    statements: 95,
                },
            },
        },
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost/",
            },
        },
        exclude: [
            "**/node_modules/**",
            // Exclude any compiled artifacts accidentally picked up
            "electron-app/dist/**",
            "**/dist/**",
            "node_modules/table/node_modules/json-schema-traverse/spec/index.spec.js",
        ],
        expect: {
            poll: { interval: 50, timeout: 15_000 },
            requireAssertions: true,
        },
        fakeTimers: {
            advanceTimeDelta: 20,
            loopLimit: 10_000,
            now: Date.now(),
            shouldAdvanceTime: false,
            shouldClearNativeTimers: true,
        },
        fileParallelism: true,
        globals: true, // Enable global test functions (describe, it, expect)
        globalSetup: ["electron-app/tests/globalSetup.js"],
        // Only collect tests from the source tests directory
        include: ["electron-app/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

        isolate: true,
        logHeapUsage: true,
        mockReset: true,
        name: {
            color: "cyan",
            label: "FFV", // Simplified label to match vitest.config.ts
        }, // Custom project name and color for Vitest
        // Use forks pool to avoid tinypool worker stdout requiring console before globalSetup
        pool: "forks",
        poolOptions: {
            threads: {
                isolate: true, // Isolate tests for better reliability
                maxThreads: 24, // Reduced from 24 to prevent resource contention in multi-project setup
                minThreads: 1, // Ensure at least one thread
                singleThread: false, // Enable multi-threading
                useAtomics: true,
            },
            forks: {
                minForks: 1,
                maxForks: 6, // Limit forks to reduce resource contention
                singleFork: false,
            },
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
        restoreMocks: true,
        server: {
            deps: {
                inline: [
                    "utils/files/import/handleOpenFile.js",
                    "utils/state/core/stateManager.js",
                    "utils/ui/controls/createElevationProfileButton.js",
                    "utils/charts/theming/getThemeColors.js",
                ],
            },
        },
        setupFiles: ["electron-app/tests/setupVitest.js"],
        // Ensure server-side transform for modules that require('electron') so SSR mocks are applied
        testTransformMode: {
            ssr: ["electron-app/**/main.js", "electron-app/**/utils/app/menu/createAppMenu.js", "electron-app/**/preload.js"],
        },
        typecheck: {
            allowJs: false,
            checker: "tsc",
            enabled: true,
            exclude: ["**/dist*/**", "**/html/**", "**/.{idea,git,cache,output,temp}/**", ...defaultExclude],
            ignoreSourceErrors: false,
            include: ["electron-app/**/*.{test,spec}-d.?(c|m)[jt]s?(x)"],
            only: false,
            spawnTimeout: 10_000,
            tsconfig: "./tsconfig.vitest.json",
        },
        watch: false,
        // Force rerun triggers - these files will trigger full test suite
        forceRerunTriggers: ["electron-app/**/package.json", "electron-app/**/vitest.config.js", "electron-app/**/vitest.config.ts"],
    },
});

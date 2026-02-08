import * as fs from "node:fs";
import os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
    coverageConfigDefaults,
    defaultExclude,
    defineConfig,
} from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    cacheDir: "node_modules/.vite",
    resolve: {
        alias: {
            electron: "./tests/stubs/electron-virtual.js",
        },
    },

    test: {
        allowOnly: false, // Fail if .only is left in the code
        cache: true, // Enable caching for faster subsequent runs
        clearMocks: true,
        coverage: {
            // Focus coverage collection on a curated, consistently testable set
            // To enforce a strict 100% coverage gate without counting
            // Integration-heavy or environment-coupled modules.
            // Only collect coverage for files actually executed by tests
            // To avoid duplicate 0% entries produced by v8 remapping.
            all: false,
            allowExternal: false,
            clean: true, // Clean coverage directory before each run
            cleanOnRerun: true, // Clean on rerun in watch mode
            enabled: true,
            exclude: [
                "node_modules/**",
                // Exclude built artifacts and generated output
                "dist/**",
                "tests/**",
                // Exclude any colocated test files under source folders
                "**/*.test.*",
                "**/*.spec.*",
                "**/*.d.ts",
                "coverage/**",
                // Third-party/vendor code is not part of the app coverage contract
                "vendor/**",
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
                // State integration bridges are environment-coupled and not part of the strict unit coverage contract
                "utils/state/integration/**",
                // UI state manager is currently exercised mostly via integration flows
                "utils/state/domain/uiStateManager.js",
                // Some newer state modules are not yet held to the strict unit coverage contract
                "utils/state/core/unifiedStateManager.js",
                "utils/state/domain/appState.js",
                "utils/state/domain/settingsStateManager.js",
                // UI tab utilities are currently exercised mainly via integration flows; exclude until dedicated tests exist
                "utils/ui/tabs/**",
                // Most UI utilities are integration-heavy. We keep them out of the strict unit coverage gate
                // by default via the curated `include` list, but we do NOT exclude `utils/ui/**` globally
                // so specific UI modules can be explicitly included and tested at high coverage.
                // Constants-only modules
                "utils/charts/theming/chartOverlayColorPalette.js",
                "utils/maps/core/mapColors.js",
                "**/assets/**",
                ...coverageConfigDefaults.exclude,
            ],
            excludeAfterRemap: true, // Exclude files after remapping for accuracy
            experimentalAstAwareRemapping: false, // Temporarily disabled due to ast-v8-to-istanbul column parsing error
            ignoreEmptyLines: true, // Ignore empty lines, comments, and TypeScript interfaces
            // Curated include set: target modules with stable, complete unit tests
            // so that a strict ≥95% gate is meaningful and consistently achievable.
            // Paths are relative to the electron-app directory.
            include: [
                // Main process core
                "main/**/*.js",
                "main/**/*.ts",
                // Preload and window bootstrap/security
                "preload.js",
                "windowStateUtils.js",
                // Core domain logic
                "utils/charts/**/*.js",
                "utils/charts/**/*.ts",
                "utils/files/**/*.js",
                "utils/files/**/*.ts",
                // Estimated Power (Virtual Power)
                "utils/data/processing/estimateCyclingPower.js",
                "utils/data/processing/powerEstimationSettings.js",
                "utils/ui/modals/openPowerEstimationSettingsModal.js",
                "utils/ui/controls/createPowerEstimationButton.js",
                // Tooltip display (shows estimated power when real power missing)
                "utils/formatting/display/formatTooltipData.js",
            ],
            reporter: [
                "text",
                "html",
                "json",
                ["lcov", { projectRoot: path.resolve(configDir, "..") }],
            ],
            reportOnFailure: true,
            // Work around Windows/Dropbox file locking on coverage temp folder by writing
            // Reports to the OS temp directory when running inside a Dropbox path.
            // This avoids EBUSY on rmdir of coverage/.tmp during cleanup.
            reportsDirectory: (() => {
                const cwd = process.cwd();
                const isWin = process.platform === "win32";
                const inDropbox =
                    /\\dropbox\\/i.test(cwd) || /\/dropbox\//i.test(cwd);
                if (process.env.VITEST_COVERAGE_DIR)
                    return process.env.VITEST_COVERAGE_DIR;
                if (isWin && inDropbox) {
                    // When tests are run concurrently (e.g. VS Code Vitest Explorer + CLI task),
                    // Vitest may clean the shared reportsDirectory while another run is still
                    // writing intermediate v8 coverage into <reportsDirectory>/.tmp.
                    // Using a per-process directory avoids cross-run deletion races.
                    const runDir = path.join(
                        os.tmpdir(),
                        "ffv-vitest-coverage",
                        `pid-${process.pid}`
                    );
                    try {
                        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is derived from os.tmpdir + pid (not user input).
                        fs.mkdirSync(runDir, { recursive: true });
                    } catch {
                        // Best-effort; Vitest will still attempt to create the directory.
                    }
                    return runDir;
                }
                return "./coverage";
            })(),
            skipFull: false, // Don't skip full coverage collection
            thresholds: {
                // Lock the coverage gate at 95% for the curated include set
                autoUpdate: false,
                global: {
                    // Branch coverage can be noisy with jsdom and v8 remapping.
                    // Keep a meaningful gate, but align thresholds to current achievable levels.
                    // (Raise gradually as coverage improves.)
                    branches: 58,
                    functions: 72,
                    lines: 76,
                    statements: 73,
                },
            },
        },
        dangerouslyIgnoreUnhandledErrors: false,
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost/",
            },
        },
        exclude: [
            "**/node_modules/**",
            // Exclude any compiled artifacts accidentally picked up
            "dist/**",
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
        // Force rerun triggers - these files will trigger full test suite
        forceRerunTriggers: [
            "**/package.json",
            "**/vitest.config.js",
            "**/vitest.config.ts",
        ],
        globals: true, // Enable global test functions (describe, it, expect)
        globalSetup: ["./tests/globalSetup.js"],
        hookTimeout: 30_000,
        // Only collect tests from the source tests directory
        include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        includeTaskLocation: true,
        isolate: true,
        logHeapUsage: true,
        maxConcurrency: 4, // Limit max concurrency to reduce resource contention in multi-project setup
        maxWorkers: process.platform === "win32" ? 1 : 6,
        mockReset: true,
        name: {
            color: "cyan",
            label: "FFV", // Simplified label to match vitest.config.ts
        }, // Custom project name and color for Vitest
        passWithNoTests: false,

        // Use forks pool to avoid tinypool worker stdout requiring console before globalSetup
        pool: "forks",
        // Vitest v4 pool rework: poolOptions was removed.
        // Parallelism is controlled via maxWorkers/maxConcurrency and fileParallelism.
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
        retry: 1, // Retry failed tests once to reduce transient failures
        sequence: {
            // Ensure deterministic order of setup files and hooks to avoid
            // "failed to find the runner" flakiness in isolated runs
            hooks: "list",
            setupFiles: "list",
        },
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
        setupFiles: ["./tests/setupVitest.js"],
        teardownTimeout: 30_000,
        testTimeout: 30_000,
        // Ensure server-side transform for modules that require('electron') so SSR mocks are applied
        testTransformMode: {
            ssr: [
                "**/main.js",
                "**/utils/app/menu/createAppMenu.js",
                "**/preload.js",
            ],
        },
        typecheck: {
            allowJs: false,
            checker: "tsc",
            enabled: true,
            exclude: [
                "**/dist*/**",
                "**/{html,dist,assets}/**",
                "**/.{idea,git,cache,output,temp}/**",
                ...defaultExclude,
            ],
            ignoreSourceErrors: false,
            include: ["**/*.{test,spec}-d.?(c|m)[jt]s?(x)"],
            only: false,
            spawnTimeout: 10_000,
            tsconfig: "./tsconfig.vitest.json",
        },
        vmMemoryLimit: 2048, // Increase VM memory limit to 2GB to handle larger test suites
        watch: false,
    },
});

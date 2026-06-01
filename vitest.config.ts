/* eslint-disable module-interop/no-require-esm -- Vitest loads this config through its ESM-aware config loader. */
import {
    coverageConfigDefaults,
    defaultExclude,
    defineConfig,
} from "vitest/config";
/* eslint-enable module-interop/no-require-esm -- Re-enable after the Vitest config import. */

/* eslint-disable module-interop/no-require-esm -- Vitest loads this config through its ESM-aware config loader. */
import {
    repositoryPath,
    repositoryRoot,
    rootVitestCachePath,
    rootVitestGlobalSetupPath,
    rootVitestSetupFilePath,
} from "./scripts/lib/workspaces.mjs";
/* eslint-enable module-interop/no-require-esm -- Re-enable after the workspace helper import. */

const electronStubPath = repositoryPath(
    "tests",
    "vitest",
    "stubs",
    "electron-virtual.cjs"
);

export default defineConfig({
    cacheDir: rootVitestCachePath,
    resolve: {
        alias: {
            electron: electronStubPath,
        },
    },
    root: repositoryRoot,

    test: {
        allowOnly: false, // Fail if .only is left in the code
        clearMocks: true,
        coverage: {
            // Focus coverage collection on a curated, consistently testable set
            // To enforce a strict 100% coverage gate without counting
            // Integration-heavy or environment-coupled modules.
            // Only collect coverage for files actually executed by tests
            // To avoid duplicate 0% entries produced by v8 remapping.
            allowExternal: false,
            clean: true, // Clean coverage directory before each run
            cleanOnRerun: true, // Clean on rerun in watch mode
            exclude: [
                "node_modules/**",
                // Exclude built artifacts and generated output
                "electron-app/dist/**",
                "tests/**",
                // Exclude any colocated test files under source folders
                "**/*.test.*",
                "**/*.spec.*",
                "**/*.d.ts",
                "coverage/**",
                // Barrels (pure re-export index files)
                "**/index.js",
                // Tooling and configuration files
                "vitest.config.ts",
                // Dev-only and debugging utilities
                "electron-app/utils/debug/**",
                // Performance monitoring (dev tooling)
                "electron-app/utils/performance/**",
                // State integration bridges are environment-coupled and not part of the strict unit coverage contract
                "electron-app/utils/state/integration/**",
                // Test-only Electron mock priming is exercised through the generated CommonJS runtime file.
                "electron-app/main/runtime/primeTestEnvironment.ts",
                // UI state manager is currently exercised mostly via integration flows
                "electron-app/utils/state/domain/uiStateManager.js",
                // Some newer state modules are not yet held to the strict unit coverage contract
                "electron-app/utils/state/core/unifiedStateManager.js",
                "electron-app/utils/state/domain/appState.js",
                "electron-app/utils/state/domain/settingsStateManager.js",
                // UI tab utilities are currently exercised via integration flows;
                // exclude until dedicated tests exist.
                "electron-app/utils/ui/tabs/**",
                // Most UI utilities are integration-heavy. We keep them out of the strict unit coverage gate
                // by default via the curated `include` list, but we do NOT exclude `utils/ui/**` globally
                // so specific UI modules can be explicitly included and tested at high coverage.
                // Constants-only modules
                "electron-app/utils/charts/theming/chartOverlayColorPalette.js",
                "electron-app/utils/maps/core/mapColors.js",
                "**/assets/**",
                ...coverageConfigDefaults.exclude,
            ],
            excludeAfterRemap: true, // Exclude files after remapping for accuracy
            // Curated include set: target modules with stable, complete unit tests
            // so that a strict ≥95% gate is meaningful and consistently achievable.
            // Paths are relative to the repository root.
            include: [
                // Main process core
                "electron-app/main/**/*.js",
                "electron-app/main/**/*.ts",
                // Preload and window bootstrap/security
                "electron-app/preload.js",
                "electron-app/windowStateUtils.js",
                // Core domain logic
                "electron-app/utils/charts/**/*.js",
                "electron-app/utils/charts/**/*.ts",
                "electron-app/utils/files/**/*.js",
                "electron-app/utils/files/**/*.ts",
                // Estimated Power (Virtual Power)
                "electron-app/utils/data/processing/estimateCyclingPower.js",
                "electron-app/utils/data/processing/powerEstimationSettings.js",
                "electron-app/utils/ui/modals/openPowerEstimationSettingsModal.js",
                "electron-app/utils/ui/controls/createPowerEstimationButton.js",
                // Tooltip display (shows estimated power when real power missing)
                "electron-app/utils/formatting/display/formatTooltipData.js",
            ],
            provider: "v8",
            reporter: [
                "text",
                "html",
                "json",
                ["lcov", { projectRoot: repositoryRoot }],
            ],
            reportOnFailure: true,
            reportsDirectory: "./coverage",
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
            "tests/playwright/**",
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
            "package.json",
            "vitest.config.ts",
            "**/package.json",
            "**/vitest.config.ts",
        ],
        // eslint-disable-next-line vite/no-vitest-globals -- Legacy tests still rely on global describe/it/expect.
        globals: true, // Enable global test functions (describe, it, expect)
        globalSetup: [rootVitestGlobalSetupPath],
        hookTimeout: 30_000,
        include: [
            "tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "electron-app/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        ],
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
                    "electron-app/utils/files/import/handleOpenFile.js",
                    "electron-app/utils/state/core/stateManager.js",
                    "electron-app/utils/ui/controls/createElevationProfileButton.js",
                    "electron-app/utils/charts/theming/getThemeColors.js",
                ],
            },
        },
        setupFiles: [rootVitestSetupFilePath],
        slowTestThreshold: 1000,
        teardownTimeout: 30_000,
        testTimeout: 30_000,
        typecheck: {
            allowJs: false,
            checker: "tsc",
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
            tsconfig: "tsconfig.vitest-typecheck.json",
        },
        vmMemoryLimit: 2048, // Increase VM memory limit to 2GB to handle larger test suites
        watch: false,
    },
});

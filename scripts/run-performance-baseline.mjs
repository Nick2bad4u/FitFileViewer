import { _electron as electron } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot, rootArtifactsPath } from "./lib/workspaces.mjs";

const defaultOutputPath = path.join(
    repositoryRoot,
    rootArtifactsPath,
    "performance-baseline.json"
);
const defaultTimeoutMs = 60_000;
const defaultThresholdPercent = 25;
const performanceTrendMetricNames = [
    "parseMs",
    "renderMs",
    "mapRouteRenderMs",
    "chartRenderMs",
    "dataTableRenderMs",
];
const defaultFixtureNames = [
    "_Fenton_Michigan_Afternoon_Ride_5_27_miles.fit",
    "Virtual_Zwift_Climb_Portal_Cauberg_at_100_Elevation_in_Watopia_12_miles.fit",
    "_Fenton_Michigan_Saturday_Afternoon_Ride_25_45_miles.fit",
];

export function parseArgs(argv = []) {
    let compareIfExistsPath = null;
    const fixturePaths = [];
    let comparePath = null;
    let outputPath = defaultOutputPath;
    let thresholdPercent = defaultThresholdPercent;
    let timeoutMs = defaultTimeoutMs;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--compare") {
            const nextComparePath = argv[index + 1];
            if (!nextComparePath || nextComparePath.startsWith("-")) {
                throw new Error("--compare requires a value");
            }
            comparePath = path.resolve(nextComparePath);
            index += 1;
            continue;
        }

        if (arg === "--compare-if-exists") {
            const nextComparePath = argv[index + 1];
            if (!nextComparePath || nextComparePath.startsWith("-")) {
                throw new Error("--compare-if-exists requires a value");
            }
            compareIfExistsPath = path.resolve(nextComparePath);
            index += 1;
            continue;
        }

        if (arg.startsWith("--compare-if-exists=")) {
            const nextComparePath = arg.slice("--compare-if-exists=".length);
            if (!nextComparePath) {
                throw new Error("--compare-if-exists must not be empty");
            }
            compareIfExistsPath = path.resolve(nextComparePath);
            continue;
        }

        if (arg.startsWith("--compare=")) {
            const nextComparePath = arg.slice("--compare=".length);
            if (!nextComparePath) {
                throw new Error("--compare must not be empty");
            }
            comparePath = path.resolve(nextComparePath);
            continue;
        }

        if (arg === "--fixture") {
            const fixturePath = argv[index + 1];
            if (!fixturePath || fixturePath.startsWith("-")) {
                throw new Error("--fixture requires a value");
            }
            fixturePaths.push(path.resolve(fixturePath));
            index += 1;
            continue;
        }

        if (arg.startsWith("--fixture=")) {
            const fixturePath = arg.slice("--fixture=".length);
            if (!fixturePath) {
                throw new Error("--fixture must not be empty");
            }
            fixturePaths.push(path.resolve(fixturePath));
            continue;
        }

        if (arg === "--output") {
            const nextOutputPath = argv[index + 1];
            if (!nextOutputPath || nextOutputPath.startsWith("-")) {
                throw new Error("--output requires a value");
            }
            outputPath = path.resolve(nextOutputPath);
            index += 1;
            continue;
        }

        if (arg.startsWith("--output=")) {
            const nextOutputPath = arg.slice("--output=".length);
            if (!nextOutputPath) {
                throw new Error("--output must not be empty");
            }
            outputPath = path.resolve(nextOutputPath);
            continue;
        }

        if (arg === "--threshold-percent") {
            thresholdPercent = parseThresholdPercent(argv[index + 1]);
            index += 1;
            continue;
        }

        if (arg.startsWith("--threshold-percent=")) {
            thresholdPercent = parseThresholdPercent(
                arg.slice("--threshold-percent=".length)
            );
            continue;
        }

        if (arg === "--timeout-ms") {
            timeoutMs = parseTimeoutMs(argv[index + 1]);
            index += 1;
            continue;
        }

        if (arg.startsWith("--timeout-ms=")) {
            timeoutMs = parseTimeoutMs(arg.slice("--timeout-ms=".length));
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (comparePath && compareIfExistsPath) {
        throw new Error(
            "--compare and --compare-if-exists cannot be used together"
        );
    }

    return {
        compareIfExistsPath,
        comparePath,
        fixturePaths:
            fixturePaths.length > 0 ? fixturePaths : getDefaultFixturePaths(),
        outputPath,
        thresholdPercent,
        timeoutMs,
    };
}

export function getDefaultFixturePaths() {
    return defaultFixtureNames.map((fixtureName) =>
        path.join(repositoryRoot, "fit-test-files", fixtureName)
    );
}

export async function runPerformanceBaseline(
    argv = process.argv.slice(2),
    environment = process.env,
    logger = console.log
) {
    const {
        compareIfExistsPath,
        comparePath,
        fixturePaths,
        outputPath,
        thresholdPercent,
        timeoutMs,
    } = parseArgs(argv);
    const effectiveComparePath = resolveComparisonPath({
        compareIfExistsPath,
        comparePath,
        logger,
    });
    assertFixturesExist(fixturePaths);

    const electronApp = await electron.launch({
        args: [repositoryRoot, "--disable-http-cache"],
        cwd: repositoryRoot,
        env: createElectronLaunchEnv(environment),
        timeout: timeoutMs,
    });

    const page = await electronApp.firstWindow();
    const pageErrors = [];
    const rendererErrors = [];
    function handleConsoleMessage(message) {
        if (message.type() === "error") {
            rendererErrors.push(message.text());
        }
    }
    function handlePageError(error) {
        pageErrors.push(error.message);
    }
    page.on("console", handleConsoleMessage);
    page.on("pageerror", handlePageError);
    await page.waitForLoadState("domcontentloaded");

    try {
        const fixtures = [];
        for (const fixturePath of fixturePaths) {
            logger(`[perf] Measuring ${path.basename(fixturePath)}`);
            fixtures.push(
                await measureFixture(page, {
                    fixturePath,
                    timeoutMs,
                })
            );
        }

        const baseline = {
            app: {
                electron: await electronApp.evaluate(
                    () => process.versions.electron
                ),
                node: await electronApp.evaluate(() => process.versions.node),
                platform: process.platform,
            },
            generatedAt: new Date().toISOString(),
            pageErrors,
            rendererErrors,
            fixtures,
        };
        if (effectiveComparePath) {
            baseline.comparison = comparePerformanceBaselines(
                baseline,
                readBaseline(effectiveComparePath),
                thresholdPercent
            );
        }

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`);
        logger(`[perf] Wrote ${outputPath}`);
        appendPerformanceBaselineSummary(environment.GITHUB_STEP_SUMMARY, {
            baseline,
            outputPath,
        });

        if (pageErrors.length > 0 || rendererErrors.length > 0) {
            throw new Error(
                `Performance baseline completed with renderer errors: ${[
                    ...pageErrors,
                    ...rendererErrors,
                ].join("; ")}`
            );
        }

        assertNoPerformanceRegressions(baseline.comparison);

        return baseline;
    } finally {
        page.off("console", handleConsoleMessage);
        page.off("pageerror", handlePageError);
        await electronApp.close();
    }
}

export function appendPerformanceBaselineSummary(
    summaryPath,
    { baseline, outputPath }
) {
    if (!summaryPath) {
        return false;
    }

    const comparison = baseline.comparison;
    const lines = [
        "## Performance Baseline",
        "",
        `- Output: \`${path.relative(repositoryRoot, outputPath)}\``,
        `- Fixture count: \`${String(getBaselineFixtures(baseline).length)}\``,
        `- Renderer errors: \`${String((baseline.rendererErrors ?? []).length)}\``,
        `- Page errors: \`${String((baseline.pageErrors ?? []).length)}\``,
    ];

    if (comparison) {
        lines.push(
            `- Comparison: \`enabled\``,
            `- Compared fixtures: \`${String(comparison.comparedFixtureCount)}\``,
            `- Threshold: \`${String(comparison.thresholdPercent)}%\``,
            `- Regressions: \`${String(comparison.regressions.length)}\``,
            `- Skipped fixtures: \`${String(comparison.skippedFixtures.length)}\``
        );

        if (comparison.regressions.length > 0) {
            lines.push("", "### Regressions");
            for (const regression of comparison.regressions.slice(0, 10)) {
                lines.push(
                    `- \`${regression.fixture}\` \`${regression.metric}\`: ${regression.previous} -> ${regression.current} (+${regression.changePercent}%, threshold ${regression.thresholdPercent}%)`
                );
            }
        }

        if (comparison.skippedFixtures.length > 0) {
            lines.push("", "### Skipped Fixtures");
            for (const skippedFixture of comparison.skippedFixtures.slice(
                0,
                10
            )) {
                lines.push(
                    `- \`${skippedFixture.fixture}\`: ${skippedFixture.reason}`
                );
            }
        }
    } else {
        lines.push(
            "- Comparison: `not run`",
            "",
            "No previous baseline was available; this run seeded the trend cache."
        );
    }

    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.appendFileSync(summaryPath, `${lines.join("\n")}\n\n`);
    return true;
}

async function measureFixture(page, { fixturePath, timeoutMs }) {
    const bytes = [...fs.readFileSync(fixturePath)];
    const fileStats = fs.statSync(fixturePath);
    const loadMetrics = await page.evaluate(
        async ({ fixtureBytes, filePath }) => {
            const getHeapBytes = () => {
                const memory = performance.memory;
                return typeof memory?.usedJSHeapSize === "number"
                    ? memory.usedJSHeapSize
                    : null;
            };
            const api = globalThis.electronAPI;
            if (!api?.parseFitFile) {
                throw new TypeError(
                    "globalThis.electronAPI.parseFitFile is missing"
                );
            }
            const renderModuleUrl = new URL(
                "utils/rendering/core/renderDecodedFitData.js",
                globalThis.location.href
            ).href;
            const activityStateModuleUrl = new URL(
                "utils/state/domain/fitActivityDataState.js",
                globalThis.location.href
            ).href;
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used by the performance baseline runner.
            const { renderDecodedFitData } = await import(renderModuleUrl);
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used by the performance baseline runner.
            const { getActiveFitActivityData } = await import(
                activityStateModuleUrl
            );

            const memoryBeforeLoad = getHeapBytes();
            const parseStart = performance.now();
            const data = await api.parseFitFile(
                new Uint8Array(fixtureBytes).buffer
            );
            const parseMs = performance.now() - parseStart;

            const renderStart = performance.now();
            await renderDecodedFitData(data, filePath);
            const renderMs = performance.now() - renderStart;
            const activityData = getActiveFitActivityData();

            return {
                activeFileName:
                    document
                        .querySelector("#active_file_name")
                        ?.textContent?.trim() ?? "",
                memoryBeforeLoad,
                memoryAfterLoad: getHeapBytes(),
                parseMs,
                recordCount: Array.isArray(activityData?.recordMesgs)
                    ? activityData.recordMesgs.length
                    : 0,
                renderMs,
                sessionCount: Array.isArray(activityData?.sessionMesgs)
                    ? activityData.sessionMesgs.length
                    : 0,
                title: document.title,
            };
        },
        { filePath: fixturePath, fixtureBytes: bytes }
    );

    const mapMetrics = await measureTabRender(page, {
        activeTabSelector: "#tab_map.active",
        metricName: "mapRouteRenderMs",
        readyExpression: () =>
            document.querySelectorAll(
                ".leaflet-marker-icon, .leaflet-interactive"
            ).length > 0,
        resultExpression: () => ({
            routeElementCount: document.querySelectorAll(
                ".leaflet-marker-icon, .leaflet-interactive"
            ).length,
        }),
        tabSelector: "#tab_map",
        timeoutMs,
    });

    const chartMetrics = await measureTabRender(page, {
        activeTabSelector: "#tab_chartjs.active",
        metricName: "chartRenderMs",
        readyExpression: async () => {
            const chartRegistryModuleUrl = new URL(
                "utils/charts/core/chartInstanceRegistry.js",
                globalThis.location.href
            ).href;
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used by the performance baseline runner.
            const { getRegisteredChartInstanceCount } = await import(
                chartRegistryModuleUrl
            );
            return (
                document.querySelectorAll(
                    "#chartjs_chart_container canvas.chart-canvas"
                ).length > 0 && getRegisteredChartInstanceCount() > 0
            );
        },
        resultExpression: async () => {
            const chartRegistryModuleUrl = new URL(
                "utils/charts/core/chartInstanceRegistry.js",
                globalThis.location.href
            ).href;
            // eslint-disable-next-line no-unsanitized/method -- Fixed same-origin app module path used by the performance baseline runner.
            const { getRegisteredChartInstanceCount } = await import(
                chartRegistryModuleUrl
            );
            return {
                canvasCount: document.querySelectorAll(
                    "#chartjs_chart_container canvas.chart-canvas"
                ).length,
                chartInstanceCount: getRegisteredChartInstanceCount(),
            };
        },
        tabSelector: "#tab_chartjs",
        timeoutMs,
    });

    const dataTableMetrics = await measureDataTableRender(page, { timeoutMs });

    const unloadMetrics = await unloadCurrentFixture(page, timeoutMs);

    return {
        byteLength: fileStats.size,
        fixturePath: path.relative(repositoryRoot, fixturePath),
        fixtureSizeClass: classifyFixtureSize(fileStats.size),
        name: path.basename(fixturePath),
        ...loadMetrics,
        ...mapMetrics,
        ...chartMetrics,
        ...dataTableMetrics,
        ...unloadMetrics,
    };
}

export function classifyFixtureSize(byteLength) {
    if (!Number.isSafeInteger(byteLength) || byteLength < 0) {
        throw new Error("Fixture byte length must be a non-negative integer");
    }

    if (byteLength < 250_000) {
        return "small";
    }

    if (byteLength < 600_000) {
        return "medium";
    }

    return "large";
}

export function comparePerformanceBaselines(
    currentBaseline,
    previousBaseline,
    thresholdPercent = defaultThresholdPercent
) {
    const previousFixtures = new Map(
        getBaselineFixtures(previousBaseline).map((fixture) => [
            getFixtureComparisonKey(fixture),
            fixture,
        ])
    );
    const regressions = [];
    const skippedFixtures = [];
    let comparedFixtureCount = 0;

    for (const currentFixture of getBaselineFixtures(currentBaseline)) {
        const fixtureKey = getFixtureComparisonKey(currentFixture);
        const previousFixture = previousFixtures.get(fixtureKey);
        if (!previousFixture) {
            skippedFixtures.push({
                fixture: fixtureKey,
                reason: "missing previous fixture",
            });
            continue;
        }

        let fixtureHadComparableMetric = false;
        for (const metricName of performanceTrendMetricNames) {
            const currentValue = currentFixture[metricName];
            const previousValue = previousFixture[metricName];
            if (
                !Number.isFinite(currentValue) ||
                !Number.isFinite(previousValue) ||
                previousValue <= 0
            ) {
                continue;
            }

            fixtureHadComparableMetric = true;
            const changePercent =
                ((currentValue - previousValue) / previousValue) * 100;
            if (changePercent > thresholdPercent) {
                regressions.push({
                    changePercent: roundMetricValue(changePercent),
                    current: roundMetricValue(currentValue),
                    fixture: fixtureKey,
                    metric: metricName,
                    previous: roundMetricValue(previousValue),
                    thresholdPercent,
                });
            }
        }

        if (fixtureHadComparableMetric) {
            comparedFixtureCount += 1;
        } else {
            skippedFixtures.push({
                fixture: fixtureKey,
                reason: "no comparable metrics",
            });
        }
    }

    return {
        comparedFixtureCount,
        metricNames: performanceTrendMetricNames,
        regressions,
        skippedFixtures,
        thresholdPercent,
    };
}

export function assertNoPerformanceRegressions(comparison) {
    if (!comparison || comparison.regressions.length === 0) {
        return;
    }

    const regressionSummary = comparison.regressions
        .slice(0, 5)
        .map(
            (regression) =>
                `${regression.fixture} ${regression.metric} +${regression.changePercent}%`
        )
        .join("; ");
    throw new Error(
        `Performance baseline exceeded ${comparison.thresholdPercent}% regression threshold: ${regressionSummary}`
    );
}

export function resolveComparisonPath({
    compareIfExistsPath,
    comparePath,
    fileExists = fs.existsSync,
    logger = console.log,
} = {}) {
    if (comparePath) {
        return comparePath;
    }

    if (!compareIfExistsPath) {
        return null;
    }

    if (fileExists(compareIfExistsPath)) {
        return compareIfExistsPath;
    }

    logger(
        `[perf] No previous baseline found at ${compareIfExistsPath}; recording a new baseline without comparison.`
    );
    return null;
}

async function measureDataTableRender(page, { timeoutMs }) {
    const start = await page.evaluate(() => performance.now());
    await page.locator("#tab_data").click({ timeout: timeoutMs });
    await page.waitForSelector("#tab_data.active", { timeout: timeoutMs });

    const firstHeader = page.locator("#content_data .table-header").first();
    await firstHeader.waitFor({ state: "visible", timeout: timeoutMs });
    await firstHeader.click({ timeout: timeoutMs });

    await page.waitForFunction(
        () => {
            const content = document.querySelector(
                "#content_data .table-content"
            );
            if (!(content instanceof HTMLElement)) {
                return false;
            }
            if (getComputedStyle(content).display === "none") {
                return false;
            }

            const table = content.querySelector("table");
            if (!(table instanceof HTMLTableElement)) {
                return false;
            }

            return (
                table.classList.contains("dataTable") ||
                content.querySelector(".dt-container") !== null ||
                table.querySelector("tbody tr") !== null
            );
        },
        undefined,
        { timeout: timeoutMs }
    );

    const tableResult = await page.evaluate(() => {
        const firstTableHeader = document.querySelector(
            "#content_data .table-header"
        );
        const visibleTables = [
            ...document.querySelectorAll("#content_data .table-content"),
        ].filter(
            (content) =>
                content instanceof HTMLElement &&
                getComputedStyle(content).display !== "none"
        );
        const visibleRowCount = visibleTables.reduce(
            (rowCount, content) =>
                rowCount + content.querySelectorAll("tbody tr").length,
            0
        );

        return {
            dataTableContainerCount: document.querySelectorAll(
                "#content_data .dt-container"
            ).length,
            dataTableExpandedTableCount: visibleTables.length,
            dataTableFirstHeaderText:
                firstTableHeader?.textContent
                    ?.trim()
                    .replaceAll(/\s+/gu, " ") ?? "",
            dataTableHeaderCount: document.querySelectorAll(
                "#content_data .table-header"
            ).length,
            dataTableInitializedCount: document.querySelectorAll(
                "#content_data table.dataTable"
            ).length,
            dataTableVisibleRowCount: visibleRowCount,
        };
    });

    return {
        dataTableRenderMs:
            (await page.evaluate(() => performance.now())) - start,
        ...tableResult,
    };
}

async function measureTabRender(
    page,
    {
        activeTabSelector,
        metricName,
        readyExpression,
        resultExpression,
        tabSelector,
        timeoutMs,
    }
) {
    const start = await page.evaluate(() => performance.now());
    await page.locator(tabSelector).click({ timeout: timeoutMs });
    await page.waitForFunction(readyExpression, undefined, {
        timeout: timeoutMs,
    });
    await page.waitForSelector(activeTabSelector, { timeout: timeoutMs });
    const tabResult = await page.evaluate(resultExpression);

    return {
        [metricName]: (await page.evaluate(() => performance.now())) - start,
        ...tabResult,
    };
}

async function unloadCurrentFixture(page, timeoutMs) {
    const unloadStart = await page.evaluate(() => performance.now());
    const unloadButton = page.locator("#unload_file_btn");
    if (await unloadButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await unloadButton.click({ timeout: timeoutMs });
    } else {
        throw new Error("Unload button was not visible after FIT load");
    }

    await page.waitForFunction(
        () => {
            const activeFileName =
                document
                    .querySelector("#active_file_name")
                    ?.textContent?.trim() ?? "";
            const unloadElement = document.querySelector("#unload_file_btn");
            return (
                activeFileName === "" &&
                (!(unloadElement instanceof HTMLElement) ||
                    unloadElement.hidden ||
                    getComputedStyle(unloadElement).display === "none")
            );
        },
        undefined,
        { timeout: timeoutMs }
    );

    return page.evaluate((startTime) => {
        const memory = performance.memory;
        return {
            activeFileNameAfterUnload:
                document
                    .querySelector("#active_file_name")
                    ?.textContent?.trim() ?? "",
            memoryAfterUnload:
                typeof memory?.usedJSHeapSize === "number"
                    ? memory.usedJSHeapSize
                    : null,
            unloadMs: performance.now() - startTime,
        };
    }, unloadStart);
}

function assertFixturesExist(fixturePaths) {
    for (const fixturePath of fixturePaths) {
        if (!fs.existsSync(fixturePath)) {
            throw new Error(`FIT fixture not found: ${fixturePath}`);
        }
    }
}

function createElectronLaunchEnv(environment) {
    return {
        ...environment,
        ELECTRON_IS_DEV: "0",
        FFV_DISABLE_WEB_SECURITY: "false",
        NODE_ENV: "production",
    };
}

function parseTimeoutMs(value) {
    if (!value) {
        throw new Error("--timeout-ms requires a value");
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1000) {
        throw new Error("--timeout-ms must be an integer >= 1000");
    }

    return parsed;
}

function parseThresholdPercent(value) {
    if (!value) {
        throw new Error("--threshold-percent requires a value");
    }

    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error("--threshold-percent must be a number >= 0");
    }

    return parsed;
}

function readBaseline(baselinePath) {
    if (!fs.existsSync(baselinePath)) {
        throw new Error(
            `Performance comparison baseline not found: ${baselinePath}`
        );
    }

    return JSON.parse(fs.readFileSync(baselinePath, "utf8"));
}

function getBaselineFixtures(baseline) {
    return Array.isArray(baseline?.fixtures) ? baseline.fixtures : [];
}

function getFixtureComparisonKey(fixture) {
    return String(fixture.name ?? fixture.fixturePath ?? "");
}

function roundMetricValue(value) {
    return Math.round(value * 100) / 100;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await runPerformanceBaseline();
}

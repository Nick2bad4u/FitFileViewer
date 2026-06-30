import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appendPerformanceBaselineSummary,
    assertNoPerformanceRegressions,
    classifyFixtureSize,
    comparePerformanceBaselines,
    getDefaultFixturePaths,
    parseArgs,
    resolveComparisonPath,
} from "../../../scripts/run-performance-baseline.mjs";

describe("run-performance-baseline script", () => {
    it("defaults to representative real FIT fixtures and the ignored artifact output", () => {
        expect.assertions(7);

        const parsed = parseArgs([]);

        expect(parsed.fixturePaths).toHaveLength(3);
        expect(
            parsed.fixturePaths.every((fixturePath) =>
                fixturePath.endsWith(".fit")
            )
        ).toBe(true);
        expect(parsed.outputPath).toBe(
            path.join(process.cwd(), "artifacts", "performance-baseline.json")
        );
        expect(parsed.compareIfExistsPath).toBeNull();
        expect(parsed.comparePath).toBeNull();
        expect(parsed.thresholdPercent).toBe(25);
        expect(parsed.timeoutMs).toBe(60_000);
    });

    it("parses custom fixture, output, and timeout arguments", () => {
        expect.assertions(1);

        expect(
            parseArgs([
                "--fixture",
                "fit-test-files/example.fit",
                "--compare",
                "artifacts/previous.json",
                "--output=artifacts/custom.json",
                "--threshold-percent=12.5",
                "--timeout-ms",
                "120000",
            ])
        ).toStrictEqual({
            compareIfExistsPath: null,
            comparePath: path.resolve("artifacts/previous.json"),
            fixturePaths: [path.resolve("fit-test-files/example.fit")],
            outputPath: path.resolve("artifacts/custom.json"),
            thresholdPercent: 12.5,
            timeoutMs: 120_000,
        });
    });

    it("rejects malformed timeout arguments", () => {
        expect.assertions(2);

        expect(() => parseArgs(["--timeout-ms", "999"])).toThrow(
            "--timeout-ms must be an integer >= 1000"
        );
        expect(() => parseArgs(["--fixture"])).toThrow(
            "--fixture requires a value"
        );
    });

    it("rejects malformed comparison arguments", () => {
        expect.assertions(5);

        expect(() => parseArgs(["--compare"])).toThrow(
            "--compare requires a value"
        );
        expect(() => parseArgs(["--compare-if-exists"])).toThrow(
            "--compare-if-exists requires a value"
        );
        expect(() =>
            parseArgs([
                "--compare=artifacts/previous.json",
                "--compare-if-exists=artifacts/optional.json",
            ])
        ).toThrow("--compare and --compare-if-exists cannot be used together");
        expect(() => parseArgs(["--threshold-percent"])).toThrow(
            "--threshold-percent requires a value"
        );
        expect(() => parseArgs(["--threshold-percent", "-1"])).toThrow(
            "--threshold-percent must be a number >= 0"
        );
    });

    it("resolves optional comparison baselines only when present", () => {
        expect.assertions(4);

        const logger = () => undefined;

        expect(
            parseArgs(["--compare-if-exists=artifacts/previous.json"])
                .compareIfExistsPath
        ).toBe(path.resolve("artifacts/previous.json"));
        expect(
            resolveComparisonPath({
                compareIfExistsPath: "artifacts/previous.json",
                fileExists: () => true,
                logger,
            })
        ).toBe("artifacts/previous.json");
        expect(
            resolveComparisonPath({
                compareIfExistsPath: "artifacts/previous.json",
                fileExists: () => false,
                logger,
            })
        ).toBeNull();
        expect(
            resolveComparisonPath({
                comparePath: "artifacts/required.json",
                fileExists: () => false,
                logger,
            })
        ).toBe("artifacts/required.json");
    });

    it("keeps default fixtures under fit-test-files", () => {
        expect.assertions(1);

        expect(
            getDefaultFixturePaths().map((fixturePath) =>
                path.relative(process.cwd(), fixturePath)
            )
        ).toStrictEqual([
            path.join(
                "fit-test-files",
                "_Fenton_Michigan_Afternoon_Ride_5_27_miles.fit"
            ),
            path.join(
                "fit-test-files",
                "Virtual_Zwift_Climb_Portal_Cauberg_at_100_Elevation_in_Watopia_12_miles.fit"
            ),
            path.join(
                "fit-test-files",
                "_Fenton_Michigan_Saturday_Afternoon_Ride_25_45_miles.fit"
            ),
        ]);
    });

    it("classifies representative fixture byte sizes", () => {
        expect.assertions(4);

        expect(
            [
                185_291,
                344_333,
                805_527,
            ].map((byteLength) => classifyFixtureSize(byteLength))
        ).toStrictEqual([
            "small",
            "medium",
            "large",
        ]);
        expect(classifyFixtureSize(0)).toBe("small");
        expect(classifyFixtureSize(600_000)).toBe("large");
        expect(() => classifyFixtureSize(-1)).toThrow(
            "Fixture byte length must be a non-negative integer"
        );
    });

    it("detects fixture performance regressions above the configured threshold", () => {
        expect.assertions(2);

        const comparison = comparePerformanceBaselines(
            {
                fixtures: [
                    {
                        name: "activity.fit",
                        parseMs: 140,
                    },
                ],
            },
            {
                fixtures: [
                    {
                        name: "activity.fit",
                        parseMs: 100,
                    },
                ],
            },
            25
        );

        expect(comparison.regressions).toStrictEqual([
            {
                changePercent: 40,
                current: 140,
                fixture: "activity.fit",
                fixtureChangePercent: 40,
                metric: "parseMs",
                previous: 100,
                thresholdPercent: 25,
            },
        ]);
        expect(() => assertNoPerformanceRegressions(comparison)).toThrow(
            "Performance baseline exceeded 25% regression threshold"
        );
    });

    it("filters isolated metric spikes when the fixture aggregate does not regress", () => {
        expect.assertions(2);

        const comparison = comparePerformanceBaselines(
            {
                fixtures: [
                    {
                        chartRenderMs: 90,
                        dataTableRenderMs: 90,
                        mapRouteRenderMs: 140,
                        name: "activity.fit",
                        parseMs: 140,
                        renderMs: 90,
                    },
                ],
            },
            {
                fixtures: [
                    {
                        chartRenderMs: 100,
                        dataTableRenderMs: 100,
                        mapRouteRenderMs: 100,
                        name: "activity.fit",
                        parseMs: 100,
                        renderMs: 100,
                    },
                ],
            },
            25
        );

        expect(comparison.regressions).toStrictEqual([]);
        expect(comparison.filteredRegressions).toStrictEqual([
            {
                changePercent: 40,
                current: 140,
                fixture: "activity.fit",
                fixtureChangePercent: 10,
                metric: "parseMs",
                previous: 100,
                thresholdPercent: 25,
            },
            {
                changePercent: 40,
                current: 140,
                fixture: "activity.fit",
                fixtureChangePercent: 10,
                metric: "mapRouteRenderMs",
                previous: 100,
                thresholdPercent: 25,
            },
        ]);
    });

    it("ignores missing fixtures and non-comparable metric values during comparison", () => {
        expect.assertions(1);

        expect(
            comparePerformanceBaselines(
                {
                    fixtures: [
                        {
                            name: "new.fit",
                            parseMs: 100,
                        },
                        {
                            name: "not-comparable.fit",
                            parseMs: 100,
                        },
                    ],
                },
                {
                    fixtures: [
                        {
                            name: "not-comparable.fit",
                            parseMs: 0,
                        },
                    ],
                }
            )
        ).toMatchObject({
            comparedFixtureCount: 0,
            regressions: [],
            skippedFixtures: [
                {
                    fixture: "new.fit",
                    reason: "missing previous fixture",
                },
                {
                    fixture: "not-comparable.fit",
                    reason: "no comparable metrics",
                },
            ],
            thresholdPercent: 25,
        });
    });

    it("appends a GitHub job summary for performance trend comparisons", () => {
        expect.assertions(7);

        const temporaryDirectory = fs.mkdtempSync(
            path.join(os.tmpdir(), "ffv-performance-summary-")
        );
        const summaryPath = path.join(temporaryDirectory, "summary.md");

        try {
            expect(
                appendPerformanceBaselineSummary(summaryPath, {
                    baseline: {
                        comparison: {
                            comparedFixtureCount: 1,
                            filteredRegressions: [
                                {
                                    changePercent: 40,
                                    current: 140,
                                    fixture: "activity.fit",
                                    fixtureChangePercent: 10,
                                    metric: "mapRouteRenderMs",
                                    previous: 100,
                                    thresholdPercent: 25,
                                },
                            ],
                            metricNames: ["parseMs"],
                            regressions: [
                                {
                                    changePercent: 40,
                                    current: 140,
                                    fixture: "activity.fit",
                                    fixtureChangePercent: 40,
                                    metric: "parseMs",
                                    previous: 100,
                                    thresholdPercent: 25,
                                },
                            ],
                            skippedFixtures: [
                                {
                                    fixture: "new.fit",
                                    reason: "missing previous fixture",
                                },
                            ],
                            thresholdPercent: 25,
                        },
                        fixtures: [{ name: "activity.fit" }],
                        pageErrors: [],
                        rendererErrors: [],
                    },
                    outputPath: path.join(
                        process.cwd(),
                        "artifacts",
                        "performance-baseline.json"
                    ),
                })
            ).toBe(true);

            const summary = fs.readFileSync(summaryPath, "utf8");
            expect(summary).toContain("## Performance Baseline");
            expect(summary).toContain("- Regressions: `1`");
            expect(summary).toContain("- Filtered metric spikes: `1`");
            expect(summary).toContain("`activity.fit` `parseMs`: 100 -> 140");
            expect(summary).toContain(
                "`activity.fit` `mapRouteRenderMs`: 100 -> 140"
            );
            expect(summary).toContain("`new.fit`: missing previous fixture");
        } finally {
            fs.rmSync(temporaryDirectory, { force: true, recursive: true });
        }
    });

    it("documents and records the release baseline metric contract", () => {
        expect.assertions(38);

        const script = fs.readFileSync(
            path.join(process.cwd(), "scripts", "run-performance-baseline.mjs"),
            "utf8"
        );
        const docs = fs.readFileSync(
            path.join(process.cwd(), "docs", "PERFORMANCE_BASELINES.md"),
            "utf8"
        );
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
        ) as { scripts?: Record<string, string> };

        expect(script).toContain("byteLength");
        expect(script).toContain("fixtureSizeClass");
        expect(script).toContain("parseMs");
        expect(script).toContain("renderMs");
        expect(script).toContain("mapRouteRenderMs");
        expect(script).toContain("chartRenderMs");
        expect(script).toContain("dataTableRenderMs");
        expect(script).toContain("comparePerformanceBaselines");
        expect(script).toContain("appendPerformanceBaselineSummary");
        expect(script).toContain("filteredRegressions");
        expect(script).toContain("GITHUB_STEP_SUMMARY");
        expect(script).toContain("getActiveFitActivityData");
        expect(script).toContain("getRegisteredChartInstanceCount");
        expect(script).not.toContain('getState("globalData")');
        expect(script).not.toContain("_chartjsInstances");
        expect(script).toContain("--threshold-percent");
        expect(script).toContain("--compare-if-exists");
        expect(script).toContain("resolveComparisonPath");
        expect(packageJson.scripts?.["perf:compare"]).toContain("--compare");
        expect(packageJson.scripts?.["perf:trend"]).toContain(
            "--compare-if-exists"
        );
        expect(packageJson.scripts?.["perf:trend"]).toContain(
            "artifacts/performance-baseline-cache/performance-baseline.json"
        );
        expect(docs).toContain("npm run perf:compare");
        expect(docs).toContain("npm run perf:trend");
        expect(script).toContain("dataTableHeaderCount");
        expect(script).toContain("dataTableInitializedCount");
        expect(script).toContain("dataTableVisibleRowCount");
        expect(script).toContain("memoryBeforeLoad");
        expect(script).toContain("memoryAfterLoad");
        expect(script).toContain("memoryAfterUnload");
        expect(script).toContain("unloadMs");
        expect(script).toContain("#tab_data");
        expect(script).toContain("#content_data .table-header");
        expect(docs).toContain("small, medium, and large real FIT files");
        expect(docs).toContain("FIT file byte size, size class, and name");
        expect(docs).toContain("raw Data tab table render time");
        expect(docs).toContain("comparison mode");
        expect(docs).toContain("regression threshold");
        expect(docs).toContain("raw-data table");
    });
});

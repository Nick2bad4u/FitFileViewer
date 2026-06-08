import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    assertNoPerformanceRegressions,
    classifyFixtureSize,
    comparePerformanceBaselines,
    getDefaultFixturePaths,
    parseArgs,
} from "../../../scripts/run-performance-baseline.mjs";

describe("run-performance-baseline script", () => {
    it("defaults to representative real FIT fixtures and the ignored artifact output", () => {
        expect.assertions(6);

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
        expect.assertions(3);

        expect(() => parseArgs(["--compare"])).toThrow(
            "--compare requires a value"
        );
        expect(() => parseArgs(["--threshold-percent"])).toThrow(
            "--threshold-percent requires a value"
        );
        expect(() => parseArgs(["--threshold-percent", "-1"])).toThrow(
            "--threshold-percent must be a number >= 0"
        );
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
                        chartRenderMs: 100,
                        dataTableRenderMs: 100,
                        mapRouteRenderMs: 100,
                        name: "activity.fit",
                        parseMs: 140,
                        renderMs: 100,
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

        expect(comparison.regressions).toStrictEqual([
            {
                changePercent: 40,
                current: 140,
                fixture: "activity.fit",
                metric: "parseMs",
                previous: 100,
                thresholdPercent: 25,
            },
        ]);
        expect(() => assertNoPerformanceRegressions(comparison)).toThrow(
            "Performance baseline exceeded 25% regression threshold"
        );
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

    it("documents and records the release baseline metric contract", () => {
        expect.assertions(24);

        const script = fs.readFileSync(
            path.join(process.cwd(), "scripts", "run-performance-baseline.mjs"),
            "utf8"
        );
        const docs = fs.readFileSync(
            path.join(process.cwd(), "docs", "PERFORMANCE_BASELINES.md"),
            "utf8"
        );

        expect(script).toContain("byteLength");
        expect(script).toContain("fixtureSizeClass");
        expect(script).toContain("parseMs");
        expect(script).toContain("renderMs");
        expect(script).toContain("mapRouteRenderMs");
        expect(script).toContain("chartRenderMs");
        expect(script).toContain("dataTableRenderMs");
        expect(script).toContain("comparePerformanceBaselines");
        expect(script).toContain("--threshold-percent");
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

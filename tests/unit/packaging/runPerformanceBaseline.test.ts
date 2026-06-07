import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    getDefaultFixturePaths,
    parseArgs,
} from "../../../scripts/run-performance-baseline.mjs";

describe("run-performance-baseline script", () => {
    it("defaults to representative real FIT fixtures and the ignored artifact output", () => {
        expect.assertions(4);

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
        expect(parsed.timeoutMs).toBe(60_000);
    });

    it("parses custom fixture, output, and timeout arguments", () => {
        expect.assertions(1);

        expect(
            parseArgs([
                "--fixture",
                "fit-test-files/example.fit",
                "--output=artifacts/custom.json",
                "--timeout-ms",
                "120000",
            ])
        ).toStrictEqual({
            fixturePaths: [path.resolve("fit-test-files/example.fit")],
            outputPath: path.resolve("artifacts/custom.json"),
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
});

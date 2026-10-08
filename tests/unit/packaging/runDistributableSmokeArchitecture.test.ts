import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    parseDistributableSmokeArguments,
    runDistributableSmoke,
} from "../../../scripts/run-distributable-smoke.mjs";

interface UniversalScenario {
    architectures: string[];
    hostArch: string;
    includeRosetta: boolean;
}

interface LaunchCapture {
    commands: string[][];
    environments: Record<string, string>[];
    run: (command: string, args: string[]) => void;
    smoke: (args: string[], environment: Record<string, string>) => number;
    wrappers: string[];
}

const directories: string[] = [];
const invalidArchitectureRequests = [
    [
        "darwin",
        "universal",
        "x64",
        true,
    ],
    [
        "darwin",
        "arm64",
        "arm64",
        true,
    ],
    [
        "darwin",
        "x64",
        "arm64",
        true,
    ],
    [
        "linux",
        "x64",
        "arm64",
        true,
    ],
    [
        "win32",
        "x64",
        "arm64",
        true,
    ],
    [
        "darwin",
        "universal",
        "ia32",
        false,
    ],
    [
        "darwin",
        "arm64",
        "x64",
        false,
    ],
    [
        "darwin",
        "x64",
        "arm64",
        false,
    ],
    [
        "darwin",
        "universal",
        "arm64",
        "true",
    ],
];
const universalScenarios: UniversalScenario[] = [
    { hostArch: "arm64", includeRosetta: false, architectures: ["arm64"] },
    { hostArch: "x64", includeRosetta: false, architectures: ["x64"] },
    {
        hostArch: "arm64",
        includeRosetta: true,
        architectures: ["arm64", "x64"],
    },
];

function makeUniversalRelease(): string {
    const directory = fs.mkdtempSync(
        path.join(tmpdir(), "ffv-universal-test-")
    );
    directories.push(directory);
    fs.writeFileSync(
        path.join(directory, "Fit-File-Viewer-dmg-universal-30.0.3.dmg"),
        "fixture Universal artifact"
    );
    return directory;
}

function makeLaunchCapture(): LaunchCapture {
    const commands: string[][] = [];
    const wrappers: string[] = [];
    const environments: Record<string, string>[] = [];
    const run = (command: string, args: string[]): void => {
        commands.push([command, ...args]);
        if (command !== "ditto") return;
        const executable = path.join(
            args[1] ?? "",
            "Contents",
            "MacOS",
            "Fit File Viewer"
        );
        fs.mkdirSync(path.dirname(executable), { recursive: true });
        fs.writeFileSync(executable, "fixture executable");
    };
    const smoke = (
        args: string[],
        environment: Record<string, string>
    ): number => {
        wrappers.push(fs.readFileSync(args[1] ?? "", "utf8"));
        environments.push(environment);
        return 0;
    };
    return { commands, wrappers, environments, run, smoke };
}

function expectVerifiedLaunches(
    capture: LaunchCapture,
    { architectures, hostArch }: UniversalScenario
): void {
    expect(capture.commands.map((command) => command[0])).toStrictEqual([
        "hdiutil",
        "ditto",
        "hdiutil",
        "codesign",
    ]);
    expect(capture.commands[0]).toContain("-readonly");
    expect(capture.commands[3]).toContain("--all-architectures");
    expect(capture.wrappers.map((wrapper) => wrapper.split("\n")[1])).toEqual([
        ...architectures.map((architecture) =>
            expect.stringContaining(
                `arch -${architecture === "x64" ? "x86_64" : architecture}`
            )
        ),
        expect.stringContaining("open -W -n"),
    ]);
    expect(capture.wrappers.at(-1)).toContain(
        '"FFV_SMOKE_NONCE=$FFV_SMOKE_NONCE"'
    );
    expect(
        capture.environments.map(
            (environment) => environment.FFV_SMOKE_EXPECTED_ARCH
        )
    ).toStrictEqual([...architectures, hostArch]);
    expect(
        capture.environments.map(
            (environment) => environment.FFV_SMOKE_EXPECTED_VERSION
        )
    ).toStrictEqual(architectures.concat(hostArch).map(() => "30.0.3"));
    expect(
        capture.environments.map(
            (environment) => environment.FFV_PACKAGED_SMOKE_TIMEOUT_MS
        )
    ).toStrictEqual(architectures.concat(hostArch).map(() => "60000"));
}

function expectNativeEvidence(
    releaseDirectory: string,
    architectures: string[]
): void {
    const report = JSON.parse(
        fs.readFileSync(
            path.join(
                releaseDirectory,
                "distributable-smoke-darwin-universal.json"
            ),
            "utf8"
        )
    );
    expect(report).toMatchObject({
        artifacts: [
            {
                passed: true,
                signatureVerified: true,
                architectures,
                launchServicesVerified: true,
            },
        ],
    });
}

afterEach(() => {
    for (const directory of directories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe("distributable smoke architecture selection", () => {
    it("accepts only the explicit Rosetta diagnostic CLI flag", () => {
        expect.assertions(5);
        expect(parseDistributableSmokeArguments([])).toStrictEqual({
            includeRosetta: false,
        });
        expect(
            parseDistributableSmokeArguments(["--include-rosetta"])
        ).toStrictEqual({
            includeRosetta: true,
        });
        for (const args of [
            ["--include-rosetta=false"],
            ["--include-rosetta", "--include-rosetta"],
            ["--arch", "x64"],
        ]) {
            expect(() => parseDistributableSmokeArguments(args)).toThrow(
                "Usage:"
            );
        }
    });

    it.each(invalidArchitectureRequests)(
        "rejects invalid architecture requests %s/%s on %s with includeRosetta=%s before launching",
        (platform, arch, hostArch, includeRosetta) => {
            expect.assertions(3);
            const run = vi.fn();
            const smoke = vi.fn();
            expect(() =>
                runDistributableSmoke(
                    {
                        platform,
                        arch,
                        hostArch,
                        includeRosetta,
                        version: "30.0.3",
                        releaseDirectory: "unused",
                    },
                    { run, smoke }
                )
            ).toThrow(/requires|Unsupported|boolean/u);
            expect(run).not.toHaveBeenCalled();
            expect(smoke).not.toHaveBeenCalled();
        }
    );

    it.each(universalScenarios)(
        "verifies all signatures and launches the requested Universal slices and native LaunchServices: $hostArch, Rosetta=$includeRosetta",
        (scenario) => {
            expect.assertions(10);
            const releaseDirectory = makeUniversalRelease();
            const capture = makeLaunchCapture();
            expect(
                runDistributableSmoke(
                    {
                        arch: "universal",
                        platform: "darwin",
                        hostArch: scenario.hostArch,
                        ...(scenario.includeRosetta
                            ? { includeRosetta: true }
                            : {}),
                        environment: { FFV_PACKAGED_SMOKE_TIMEOUT_MS: "60000" },
                        version: "30.0.3",
                        releaseDirectory,
                    },
                    capture
                )
            ).toBe(0);
            expectVerifiedLaunches(capture, scenario);
            expectNativeEvidence(releaseDirectory, scenario.architectures);
        }
    );
});

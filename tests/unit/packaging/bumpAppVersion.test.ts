import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

type BumpAppVersionModule = {
    bumpAppVersion: (options?: {
        commandRunner?: (
            command: string,
            args: string[],
            options: Record<string, unknown>
        ) => void;
        dryRun?: boolean;
        environment?: NodeJS.ProcessEnv;
        platform?: NodeJS.Platform;
        releaseType?: "major" | "minor" | "patch";
        repositoryRoot?: string;
    }) => {
        currentVersion: string;
        newVersion: string;
        packagePath: string;
    };
    calculateNextVersion: (
        version: string,
        releaseType?: "major" | "minor" | "patch"
    ) => string;
    createNpmVersionArgs: (version: string) => string[];
    getNpmInvocation: (
        environment?: NodeJS.ProcessEnv,
        platform?: NodeJS.Platform
    ) => { args: string[]; command: string };
    parseArgs: (args: string[]) => {
        dryRun: boolean;
        githubOutput: boolean;
        help: boolean;
        releaseType: string;
    };
    writeGithubOutput: (newVersion: string, outputPath?: string) => void;
};

type CommandRunner = (
    command: string,
    args: string[],
    options: Record<string, unknown>
) => void;

const temporaryRoots: string[] = [];

async function importBumpAppVersion(): Promise<BumpAppVersionModule> {
    return (await import("../../../scripts/bump-app-version.mjs")) as BumpAppVersionModule;
}

function getRequiredCommandCall(
    calls: Parameters<CommandRunner>[],
    index = 0
): Parameters<CommandRunner> {
    const call = calls[index];

    if (!call) {
        throw new Error(`Expected command call ${index}`);
    }

    return call;
}

function makeTemporaryRoot(version: string): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-bump-app-version-")
    );

    fs.writeFileSync(
        path.join(temporaryRoot, "package.json"),
        `${JSON.stringify({ name: "fitfileviewer", version }, null, 4)}\n`
    );
    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("bump-app-version script", () => {
    it("calculates explicit semantic version increments", async () => {
        expect.assertions(1);

        const { calculateNextVersion } = await importBumpAppVersion();

        expect(
            (
                [
                    "patch",
                    "minor",
                    "major",
                ] as const
            ).map((releaseType) => ({
                nextVersion: calculateNextVersion("30.0.0", releaseType),
                releaseType,
            }))
        ).toStrictEqual([
            { nextVersion: "30.0.1", releaseType: "patch" },
            { nextVersion: "30.1.0", releaseType: "minor" },
            { nextVersion: "31.0.0", releaseType: "major" },
        ]);
    });

    it("rejects unsupported package version strings", async () => {
        expect.assertions(3);

        const { calculateNextVersion } = await importBumpAppVersion();

        expect(() => calculateNextVersion("29.9.0-beta.1")).toThrow(
            "Unsupported package version"
        );
        expect(() =>
            calculateNextVersion(undefined as unknown as string)
        ).toThrow(TypeError);
        expect(() =>
            calculateNextVersion("30.0.0", "invalid" as unknown as "patch")
        ).toThrow("Unsupported release type");
    });

    it("builds the root npm version command used by release automation", async () => {
        expect.assertions(1);

        const { createNpmVersionArgs } = await importBumpAppVersion();

        expect(createNpmVersionArgs("30.0.0")).toStrictEqual([
            "version",
            "--no-git-tag-version",
            "--ignore-scripts",
            "30.0.0",
        ]);
    });

    it("parses GitHub Actions release bump arguments", async () => {
        expect.assertions(4);

        const { parseArgs } = await importBumpAppVersion();

        expect(parseArgs(["--github-output"])).toStrictEqual({
            dryRun: false,
            githubOutput: true,
            help: false,
            releaseType: "patch",
        });
        expect(parseArgs(["--dry-run", "--release-type=minor"])).toStrictEqual({
            dryRun: true,
            githubOutput: false,
            help: false,
            releaseType: "minor",
        });
        expect(() => parseArgs(["--workspace", "docusaurus"])).toThrow(
            "Unknown option: --workspace"
        );
        expect(() => parseArgs(["--workspace=docusaurus"])).toThrow(
            "Unknown option: --workspace=docusaurus"
        );
    });

    it("computes the next version from the root app package", async () => {
        expect.assertions(2);

        const { bumpAppVersion } = await importBumpAppVersion();
        const temporaryRoot = makeTemporaryRoot("30.0.0");
        const commandRunner = vi.fn<CommandRunner>();
        const result = bumpAppVersion({
            commandRunner,
            dryRun: true,
            repositoryRoot: temporaryRoot,
        });

        expect(result).toStrictEqual({
            currentVersion: "30.0.0",
            newVersion: "30.0.1",
            packagePath: path.join(temporaryRoot, "package.json"),
        });
        expect(commandRunner).not.toHaveBeenCalled();
    });

    it("runs npm version without shelling through Windows command parsing", async () => {
        expect.assertions(3);

        const { bumpAppVersion, createNpmVersionArgs } =
            await importBumpAppVersion();
        const temporaryRoot = makeTemporaryRoot("30.0.0");
        const commandRunner = vi.fn<CommandRunner>();

        const result = bumpAppVersion({
            commandRunner,
            environment: {},
            platform: "linux",
            repositoryRoot: temporaryRoot,
        });
        const [
            command,
            versionArgs,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect(commandRunner).toHaveBeenCalledOnce();
        expect({
            command,
            options,
            result,
            versionArgs,
        }).toStrictEqual({
            command: "npm",
            options: {
                cwd: temporaryRoot,
                stdio: "inherit",
            },
            result: {
                currentVersion: "30.0.0",
                newVersion: "30.0.1",
                packagePath: path.join(temporaryRoot, "package.json"),
            },
            versionArgs: createNpmVersionArgs("30.0.1"),
        });
        expect(options).not.toHaveProperty("shell");
    });

    it("avoids spawning Windows command shims directly", async () => {
        expect.assertions(2);

        const { getNpmInvocation } = await importBumpAppVersion();

        expect(
            getNpmInvocation({ npm_execpath: "C:\\npm\\npm-cli.js" }, "win32")
        ).toStrictEqual({
            args: ["C:\\npm\\npm-cli.js"],
            command: process.execPath,
        });
        expect(getNpmInvocation({ ComSpec: "cmd.exe" }, "win32")).toStrictEqual(
            {
                args: [
                    "/d",
                    "/s",
                    "/c",
                    "npm.cmd",
                ],
                command: "cmd.exe",
            }
        );
    });

    it("normalizes relative package roots before running npm version", async () => {
        expect.assertions(1);

        const { bumpAppVersion } = await importBumpAppVersion();
        const commandRunner = vi.fn<CommandRunner>();

        bumpAppVersion({
            commandRunner,
            repositoryRoot: ".",
        });
        const [
            ,
            ,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect(options.cwd).toBe(repositoryRoot);
    });

    it("writes the GitHub Actions output value", async () => {
        expect.assertions(2);

        const { writeGithubOutput } = await importBumpAppVersion();
        const temporaryRoot = makeTemporaryRoot("29.9.0");
        const outputPath = path.join(temporaryRoot, "github-output.txt");

        fs.writeFileSync(outputPath, "existing=value\n");
        writeGithubOutput("30.0.0", outputPath);

        expect(fs.readFileSync(outputPath, "utf8")).toBe(
            "existing=value\nnew_version=30.0.0\n"
        );
        expect(() => writeGithubOutput("30.0.0", "")).toThrow(
            "--github-output requires GITHUB_OUTPUT to be set"
        );
    });
});

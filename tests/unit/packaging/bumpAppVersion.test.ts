import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

type BumpAppVersionModule = {
    bumpAppVersion: (options?: {
        commandRunner?: (
            command: string,
            args: string[],
            options: Record<string, unknown>
        ) => void;
        dryRun?: boolean;
        repositoryRoot?: string;
        workspace?: string;
    }) => {
        currentVersion: string;
        newVersion: string;
        packagePath: string;
        workspace: string | undefined;
    };
    calculateNextVersion: (version: string) => string;
    createNpmVersionArgs: (
        workspace: string | undefined,
        version: string
    ) => string[];
    defaultWorkspace: string | undefined;
    parseArgs: (args: string[]) => {
        dryRun: boolean;
        githubOutput: boolean;
        help: boolean;
        workspace: string | undefined;
    };
    writeGithubOutput: (newVersion: string, outputPath?: string) => void;
};

const temporaryRoots: string[] = [];

async function importBumpAppVersion(): Promise<BumpAppVersionModule> {
    return (await import("../../../scripts/bump-app-version.mjs")) as BumpAppVersionModule;
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
    it("keeps the release workflow version rollover behavior", async () => {
        expect.assertions(3);

        const { calculateNextVersion } = await importBumpAppVersion();

        expect(calculateNextVersion("29.8.12")).toBe("29.9.0");
        expect(calculateNextVersion("29.9.0")).toBe("30.0.0");
        expect(calculateNextVersion("30.0.0")).toBe("30.1.0");
    });

    it("rejects unsupported package version strings", async () => {
        expect.assertions(1);

        const { calculateNextVersion } = await importBumpAppVersion();

        expect(() => calculateNextVersion("29.9.0-beta.1")).toThrow(
            "Unsupported package version"
        );
    });

    it("builds the root npm version command used by release automation", async () => {
        expect.assertions(3);

        const { createNpmVersionArgs, defaultWorkspace } =
            await importBumpAppVersion();

        expect(defaultWorkspace).toBeUndefined();
        expect(createNpmVersionArgs(undefined, "30.0.0")).toStrictEqual([
            "version",
            "--no-git-tag-version",
            "--ignore-scripts",
            "30.0.0",
        ]);
        expect(createNpmVersionArgs("docusaurus", "30.0.0")).toStrictEqual([
            "version",
            "--workspace",
            "docusaurus",
            "--no-git-tag-version",
            "--ignore-scripts",
            "30.0.0",
        ]);
    });

    it("parses GitHub Actions release bump arguments", async () => {
        expect.assertions(1);

        const { parseArgs } = await importBumpAppVersion();

        expect(parseArgs(["--github-output"])).toStrictEqual({
            dryRun: false,
            githubOutput: true,
            help: false,
            workspace: undefined,
        });
    });

    it("computes the next version from the root app package", async () => {
        expect.assertions(1);

        const { bumpAppVersion } = await importBumpAppVersion();
        const temporaryRoot = makeTemporaryRoot("29.9.0");
        const result = bumpAppVersion({
            dryRun: true,
            repositoryRoot: temporaryRoot,
        });

        expect(result).toStrictEqual({
            currentVersion: "29.9.0",
            newVersion: "30.0.0",
            packagePath: path.join(temporaryRoot, "package.json"),
            workspace: undefined,
        });
    });

    it("runs npm version without shelling through Windows command parsing", async () => {
        expect.assertions(3);

        const { bumpAppVersion, createNpmVersionArgs } =
            await importBumpAppVersion();
        const temporaryRoot = makeTemporaryRoot("29.9.0");
        const commandRunner =
            vi.fn<
                (
                    command: string,
                    args: string[],
                    options: Record<string, unknown>
                ) => void
            >();

        const result = bumpAppVersion({
            commandRunner,
            repositoryRoot: temporaryRoot,
        });

        expect(commandRunner).toHaveBeenCalledOnce();
        expect({
            command: commandRunner.mock.calls[0]?.[0],
            options: commandRunner.mock.calls[0]?.[2],
            result,
            versionArgs: commandRunner.mock.calls[0]?.[1],
        }).toStrictEqual({
            command: expect.stringMatching(/^npm(?:\.cmd)?$/u),
            options: {
                cwd: temporaryRoot,
                stdio: "inherit",
            },
            result: {
                currentVersion: "29.9.0",
                newVersion: "30.0.0",
                packagePath: path.join(temporaryRoot, "package.json"),
                workspace: undefined,
            },
            versionArgs: createNpmVersionArgs(undefined, "30.0.0"),
        });
        expect(commandRunner.mock.calls[0]?.[2]).not.toHaveProperty("shell");
    });

    it("writes the GitHub Actions output value", async () => {
        expect.assertions(1);

        const { writeGithubOutput } = await importBumpAppVersion();
        const temporaryRoot = makeTemporaryRoot("29.9.0");
        const outputPath = path.join(temporaryRoot, "github-output.txt");

        writeGithubOutput("30.0.0", outputPath);

        expect(fs.readFileSync(outputPath, "utf8")).toBe(
            "new_version=30.0.0\n"
        );
    });
});

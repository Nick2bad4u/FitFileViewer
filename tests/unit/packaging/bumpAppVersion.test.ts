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
        workspace: string;
    };
    calculateNextVersion: (version: string) => string;
    createNpmVersionArgs: (workspace: string, version: string) => string[];
    defaultWorkspace: string;
    parseArgs: (args: string[]) => {
        dryRun: boolean;
        githubOutput: boolean;
        help: boolean;
        workspace: string;
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
    const workspaceRoot = path.join(temporaryRoot, "electron-app");

    fs.mkdirSync(workspaceRoot, { recursive: true });
    fs.writeFileSync(
        path.join(workspaceRoot, "package.json"),
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

    it("builds the npm workspace version command used by release automation", async () => {
        expect.assertions(1);

        const { createNpmVersionArgs } = await importBumpAppVersion();

        expect(createNpmVersionArgs("electron-app", "30.0.0")).toStrictEqual([
            "version",
            "--workspace",
            "electron-app",
            "--no-git-tag-version",
            "--ignore-scripts",
            "30.0.0",
        ]);
    });

    it("parses GitHub Actions release bump arguments", async () => {
        expect.assertions(1);

        const { parseArgs } = await importBumpAppVersion();

        expect(
            parseArgs(["--github-output", "--workspace=electron-app"])
        ).toStrictEqual({
            dryRun: false,
            githubOutput: true,
            help: false,
            workspace: "electron-app",
        });
    });

    it("computes the next version from the selected workspace package", async () => {
        expect.assertions(4);

        const { bumpAppVersion } = await importBumpAppVersion();
        const temporaryRoot = makeTemporaryRoot("29.9.0");
        const result = bumpAppVersion({
            dryRun: true,
            repositoryRoot: temporaryRoot,
            workspace: "electron-app",
        });

        expect(result.currentVersion).toBe("29.9.0");
        expect(result.newVersion).toBe("30.0.0");
        expect(result.workspace).toBe("electron-app");
        expect(result.packagePath).toBe(
            path.join(temporaryRoot, "electron-app", "package.json")
        );
    });

    it("runs npm version without shelling through Windows command parsing", async () => {
        expect.assertions(4);

        const { bumpAppVersion } = await importBumpAppVersion();
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
            workspace: "electron-app",
        });

        expect(result.newVersion).toBe("30.0.0");
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(commandRunner.mock.calls[0]?.[0]).toMatch(/^npm(?:\.cmd)?$/u);
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

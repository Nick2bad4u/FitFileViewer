import { describe, expect, it } from "vitest";

import { appSourceRepositoryPath } from "../../../scripts/lib/workspaces.mjs";

type CommandResult = {
    status: number;
    stderr: string;
    stdout: string;
};

type PrintAppDiffModule = {
    defaultDiffPath: string;
    defaultTagPattern: string;
    getLastVersionRef: (
        tagPattern: string,
        runCommand?: (command: string, args: string[]) => CommandResult
    ) => string;
    parseArgs: (args: string[]) => {
        diffPath: string;
        help: boolean;
        tagPattern: string;
    };
    printAppDiff: (
        options?: {
            diffPath?: string;
            tagPattern?: string;
        },
        dependencies?: {
            log?: (message: string) => void;
            runCommand?: (command: string, args: string[]) => CommandResult;
        }
    ) => number;
};

async function importPrintAppDiff(): Promise<PrintAppDiffModule> {
    return (await import("../../../scripts/print-app-diff.mjs")) as PrintAppDiffModule;
}

function createResult(overrides: Partial<CommandResult> = {}): CommandResult {
    return {
        status: 0,
        stderr: "",
        stdout: "",
        ...overrides,
    };
}

function commandLine(command: string, args: string[]): string {
    return [command, ...args].join(" ");
}

describe("print-app-diff script", () => {
    it("uses the newest matching version tag when one exists", async () => {
        expect.assertions(2);

        const { getLastVersionRef } = await importPrintAppDiff();
        const calls: string[] = [];

        const lastRef = getLastVersionRef("v*", (command, args) => {
            calls.push(commandLine(command, args));
            return createResult({ stdout: "v30.0.0\n" });
        });

        expect(lastRef).toBe("v30.0.0");
        expect(calls).toStrictEqual([
            "git describe --tags --match v* --abbrev=0",
        ]);
    });

    it("falls back to the root commit when no matching tag exists", async () => {
        expect.assertions(2);

        const { getLastVersionRef } = await importPrintAppDiff();
        const calls: string[] = [];

        const lastRef = getLastVersionRef("v*", (command, args) => {
            calls.push(commandLine(command, args));

            if (
                commandLine(command, args) ===
                "git describe --tags --match v* --abbrev=0"
            ) {
                return createResult({ status: 128 });
            }

            return createResult({ stdout: "abc123\n" });
        });

        expect(lastRef).toBe("abc123");
        expect(calls).toStrictEqual([
            "git describe --tags --match v* --abbrev=0",
            "git rev-list --max-parents=0 HEAD",
        ]);
    });

    it("prints the app source diff between the selected ref and HEAD", async () => {
        expect.assertions(1);

        const { defaultDiffPath, printAppDiff } = await importPrintAppDiff();
        const calls: string[] = [];
        const logs: string[] = [];

        const exitCode = printAppDiff(
            {},
            {
                log(message) {
                    logs.push(message);
                },
                runCommand(command, args) {
                    const fullCommand = commandLine(command, args);
                    calls.push(fullCommand);

                    if (
                        fullCommand ===
                        "git describe --tags --match v* --abbrev=0"
                    ) {
                        return createResult({ stdout: "v30.0.0\n" });
                    }

                    if (
                        fullCommand ===
                        `git diff --name-status v30.0.0 -- ${defaultDiffPath}`
                    ) {
                        return createResult({
                            stdout: "M\telectron-app/main.ts\n",
                        });
                    }

                    return createResult();
                },
            }
        );

        expect({ calls, exitCode, logs }).toStrictEqual({
            calls: [
                "git fetch --tags --force",
                "git describe --tags --match v* --abbrev=0",
                `git diff --name-status v30.0.0 -- ${defaultDiffPath}`,
            ],
            exitCode: 0,
            logs: [
                "--- GIT DIFF OUTPUT (since last tag) ---",
                "M\telectron-app/main.ts",
                "--- END GIT DIFF OUTPUT ---",
            ],
        });
    });

    it("returns the fetch failure status without diffing", async () => {
        expect.assertions(1);

        const { printAppDiff } = await importPrintAppDiff();
        const calls: string[] = [];
        const logs: string[] = [];

        const exitCode = printAppDiff(
            {},
            {
                log(message) {
                    logs.push(message);
                },
                runCommand(command, args) {
                    calls.push(commandLine(command, args));
                    return createResult({
                        status: 2,
                        stderr: "fetch failed\n",
                    });
                },
            }
        );

        expect({ calls, exitCode, logs }).toStrictEqual({
            calls: ["git fetch --tags --force"],
            exitCode: 2,
            logs: ["--- GIT DIFF OUTPUT (since last tag) ---", "fetch failed"],
        });
    });

    it("parses diff path and tag pattern arguments", async () => {
        expect.assertions(2);

        const { defaultDiffPath, defaultTagPattern, parseArgs } =
            await importPrintAppDiff();

        expect(parseArgs([])).toStrictEqual({
            diffPath: defaultDiffPath,
            help: false,
            tagPattern: defaultTagPattern,
        });
        expect(
            parseArgs([
                `--diff-path=${appSourceRepositoryPath("utils")}`,
                "--tag-pattern",
                "v3*",
            ])
        ).toStrictEqual({
            diffPath: appSourceRepositoryPath("utils"),
            help: false,
            tagPattern: "v3*",
        });
    });

    it("rejects missing diff path values", async () => {
        expect.assertions(1);

        const { parseArgs } = await importPrintAppDiff();

        expect(() => parseArgs(["--diff-path"])).toThrow(
            "--diff-path requires a value"
        );
    });
});

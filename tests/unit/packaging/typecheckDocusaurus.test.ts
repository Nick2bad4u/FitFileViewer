import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildDocusaurusTypecheckArgs,
    docusaurusTypecheckProject,
    docusaurusTypeScriptCliPath,
    runDocusaurusTypecheck,
} from "../../../scripts/typecheck-docusaurus.mjs";
import { rootDocusaurusTsconfigPath } from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number | null };

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

describe("typecheck-docusaurus script", () => {
    it("builds Docusaurus TypeScript args from the root-owned project", () => {
        expect.assertions(2);

        expect(
            buildDocusaurusTypecheckArgs(["--pretty", "false"])
        ).toStrictEqual([
            docusaurusTypeScriptCliPath,
            "--project",
            docusaurusTypecheckProject,
            "--pretty",
            "false",
        ]);
        expect({
            docusaurusTypecheckProject,
            typescriptCliPathMatches: /[\\/]typescript[\\/]bin[\\/]tsc$/u.test(
                docusaurusTypeScriptCliPath
            ),
        }).toStrictEqual({
            docusaurusTypecheckProject: rootDocusaurusTsconfigPath,
            typescriptCliPathMatches: true,
        });
    });

    it("runs Docusaurus typecheck from the repository root", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        const exitStatus = runDocusaurusTypecheck(["--noEmit"], commandRunner);

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect({
            args,
            command,
            status: exitStatus,
        }).toStrictEqual({
            args: buildDocusaurusTypecheckArgs(["--noEmit"]),
            command: process.execPath,
            status: 0,
        });
        expect({
            ...options,
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("returns a failing status from TypeScript", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 2 });

        const exitStatus = runDocusaurusTypecheck([], commandRunner);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 1,
            status: 2,
        });
        expect(
            getRequiredCommandCall(commandRunner.mock.calls)[1]
        ).toStrictEqual(buildDocusaurusTypecheckArgs([]));
    });

    it("throws when TypeScript cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: spawnError,
            status: 0,
        });

        expect(() => runDocusaurusTypecheck([], commandRunner)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect({ args, command }).toStrictEqual({
            args: buildDocusaurusTypecheckArgs([]),
            command: process.execPath,
        });
        expect({
            ...options,
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });
});

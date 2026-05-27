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

describe("typecheck-docusaurus script", () => {
    it("builds Docusaurus TypeScript args from the root-owned project", () => {
        expect.assertions(3);

        expect(
            buildDocusaurusTypecheckArgs(["--pretty", "false"])
        ).toStrictEqual([
            docusaurusTypeScriptCliPath,
            "--project",
            docusaurusTypecheckProject,
            "--pretty",
            "false",
        ]);
        expect(docusaurusTypecheckProject).toBe(rootDocusaurusTsconfigPath);
        expect(docusaurusTypeScriptCliPath).toMatch(
            /[\\/]typescript[\\/]bin[\\/]tsc$/u
        );
    });

    it("runs Docusaurus typecheck from the repository root", () => {
        expect.assertions(4);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        expect(runDocusaurusTypecheck(["--noEmit"], commandRunner)).toBe(0);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect(args).toStrictEqual(buildDocusaurusTypecheckArgs(["--noEmit"]));
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("returns a failing status from TypeScript", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 2 });

        expect(runDocusaurusTypecheck([], commandRunner)).toBe(2);
    });

    it("throws when TypeScript cannot be started", () => {
        expect.assertions(1);

        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: new Error("spawn failed"),
            status: 0,
        });

        expect(() => runDocusaurusTypecheck([], commandRunner)).toThrow(
            "spawn failed"
        );
    });
});

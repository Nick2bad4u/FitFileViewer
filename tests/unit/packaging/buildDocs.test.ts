import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildDocsSteps,
    runBuildDocs,
    typedocConfigPath,
} from "../../../scripts/build-docs.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("build-docs script", () => {
    it("builds the full docs pipeline through root-owned scripts", () => {
        expect.assertions(7);

        const steps = buildDocsSteps([]);

        expect(steps.map((step) => step.label)).toStrictEqual([
            "generate API docs",
            "generate API categories",
            "build Docusaurus site",
        ]);
        expect(steps[0]?.args).toEqual(
            expect.arrayContaining(["--options", typedocConfigPath])
        );
        expect(steps[0]?.args[0]).toMatch(/[\\/]typedoc[\\/]bin[\\/]typedoc$/u);
        expect(path.resolve(steps[0]?.cwd ?? "")).toBe(process.cwd());
        expect(steps[1]?.args).toStrictEqual([
            path.join(process.cwd(), "scripts", "generate-api-categories.mjs"),
        ]);
        expect(path.resolve(steps[1]?.cwd ?? "")).toBe(
            path.join(process.cwd(), "docusaurus")
        );
        expect(steps[2]?.args).toStrictEqual([
            path.join(process.cwd(), "scripts", "run-docusaurus.mjs"),
            "build",
        ]);
    });

    it("omits the Docusaurus site build for TypeDoc-only runs", () => {
        expect.assertions(1);

        expect(
            buildDocsSteps(["--typedoc-only"]).map((step) => step.label)
        ).toStrictEqual(["generate API docs", "generate API categories"]);
    });

    it("runs docs build steps in order", () => {
        expect.assertions(4);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(runBuildDocs(["--typedoc-only"], commandRunner, logger)).toBe(0);
        expect(commandRunner).toHaveBeenCalledTimes(2);
        expect(logger).toHaveBeenCalledTimes(2);

        const [
            command,
            ,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            command,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            command: process.execPath,
            cwd: path.resolve(process.cwd()),
        });
    });

    it("stops after the first failing docs build step", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 0 })
            .mockReturnValueOnce({ status: 6 });

        expect(runBuildDocs(["--typedoc-only"], commandRunner)).toBe(6);
        expect(commandRunner).toHaveBeenCalledTimes(2);
    });

    it("throws when a docs build step cannot be started", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });

        expect(() => runBuildDocs([], commandRunner)).toThrow("spawn failed");
    });
});

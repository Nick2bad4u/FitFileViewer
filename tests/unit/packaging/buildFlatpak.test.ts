import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
    assertInsideRepo,
    buildFlatpak,
    flatpakBuildDir,
    flatpakBundlePath,
    flatpakRepoDir,
} from "../../../scripts/build-flatpak.mjs";

type CommandCall = {
    args: string[];
    command: string;
    options: { cwd: string; env: NodeJS.ProcessEnv; stdio: string };
};
type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; env: NodeJS.ProcessEnv; stdio: string }
) => void;

describe("build-flatpak script", () => {
    it("keeps generated Flatpak paths under the repository root", () => {
        expect.assertions(4);

        expect(flatpakRepoDir).toBe(path.join(process.cwd(), "flatpak-repo"));
        expect(flatpakBuildDir).toBe(
            path.join(process.cwd(), "flatpak-build-dir")
        );
        expect(flatpakBundlePath).toBe(
            path.join(process.cwd(), "FitFileViewer.flatpak")
        );
        expect(() => assertInsideRepo(path.join(process.cwd(), ".."))).toThrow(
            "Refusing to operate outside repo root"
        );
    });

    it("cleans generated outputs and runs Flatpak commands from root", () => {
        expect.assertions(5);

        const removedPaths: string[] = [];
        const commands: CommandCall[] = [];
        const fileSystem = {
            rmSync(targetPath: string) {
                removedPaths.push(targetPath);
            },
        };
        const commandRunner = vi.fn<CommandRunner>((command, args, options) => {
            commands.push({ args, command, options });
        });

        buildFlatpak({ commandRunner, fileSystem });

        expect(removedPaths).toStrictEqual([
            flatpakRepoDir,
            flatpakBuildDir,
            flatpakBundlePath,
        ]);
        expect(commandRunner).toHaveBeenCalledTimes(2);
        expect(commands.map(({ command }) => command)).toStrictEqual([
            "flatpak-builder",
            "flatpak",
        ]);
        expect(commands[0]?.args).toStrictEqual([
            "--repo=flatpak-repo",
            "--force-clean",
            "flatpak-build-dir",
            "flatpak-build.yml",
        ]);
        expect(commands.map(({ options }) => options.cwd)).toStrictEqual([
            process.cwd(),
            process.cwd(),
        ]);
    });
});

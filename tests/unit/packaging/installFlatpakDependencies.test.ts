import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

type CommandCall = {
    args: string[];
    command: string;
    options: {
        cwd: string;
        stdio: "inherit";
    };
};
type InstallFlatpakDependenciesModule = {
    getFlatpakDependencyCommands: () => [string, string[]][];
    installFlatpakDependencies: (
        runCommand: (
            command: string,
            args: string[],
            options: CommandCall["options"]
        ) => void,
        options?: {
            repositoryRoot?: string;
        }
    ) => number;
    parseArgs: (args: string[]) => {
        help: boolean;
    };
};

async function importInstallFlatpakDependencies(): Promise<InstallFlatpakDependenciesModule> {
    return (await import("../../../scripts/install-flatpak-dependencies.mjs")) as InstallFlatpakDependenciesModule;
}

describe("install-flatpak-dependencies script", () => {
    it("returns the Flatpak dependency setup commands", async () => {
        expect.assertions(1);

        const { getFlatpakDependencyCommands } =
            await importInstallFlatpakDependencies();
        const commands = getFlatpakDependencyCommands();

        expect(commands).toStrictEqual([
            ["sudo", ["apt-get", "update"]],
            [
                "sudo",
                [
                    "apt-get",
                    "install",
                    "-y",
                    "flatpak",
                    "flatpak-builder",
                    "elfutils",
                ],
            ],
            [
                "flatpak",
                [
                    "remote-add",
                    "--if-not-exists",
                    "--user",
                    "flathub",
                    "https://flathub.org/repo/flathub.flatpakrepo",
                ],
            ],
            [
                "flatpak",
                [
                    "install",
                    "-y",
                    "--user",
                    "flathub",
                    "org.freedesktop.Platform//25.08",
                    // eslint-disable-next-line case-police/string-check -- Flatpak uses this exact runtime identifier spelling.
                    "org.freedesktop.Sdk//25.08",
                ],
            ],
            [
                "flatpak",
                [
                    "update",
                    "-y",
                    "--user",
                ],
            ],
        ]);
    });

    it("runs each command with inherited stdio", async () => {
        expect.assertions(1);

        const { installFlatpakDependencies } =
            await importInstallFlatpakDependencies();
        const calls: CommandCall[] = [];

        const installedCommandCount = installFlatpakDependencies(
            (command, args, options) => {
                calls.push({ args, command, options });
            }
        );

        expect({
            commands: calls.map((call) => call.command),
            cwds: calls.map((call) => call.options.cwd),
            installedCommandCount,
            stdioModes: calls.map((call) => call.options.stdio),
        }).toStrictEqual({
            commands: [
                "sudo",
                "sudo",
                "flatpak",
                "flatpak",
                "flatpak",
            ],
            cwds: [
                repositoryRoot,
                repositoryRoot,
                repositoryRoot,
                repositoryRoot,
                repositoryRoot,
            ],
            installedCommandCount: 5,
            stdioModes: [
                "inherit",
                "inherit",
                "inherit",
                "inherit",
                "inherit",
            ],
        });
    });

    it("normalizes relative Flatpak dependency roots before running commands", async () => {
        expect.assertions(1);

        const { installFlatpakDependencies } =
            await importInstallFlatpakDependencies();
        const calls: CommandCall[] = [];

        installFlatpakDependencies(
            (command, args, options) => {
                calls.push({ args, command, options });
            },
            { repositoryRoot: "." }
        );

        expect(new Set(calls.map((call) => call.options.cwd))).toStrictEqual(
            new Set([repositoryRoot])
        );
    });

    it("parses help and rejects unknown options", async () => {
        expect.assertions(2);

        const { parseArgs } = await importInstallFlatpakDependencies();

        expect(parseArgs(["--help"])).toStrictEqual({ help: true });
        expect(() => parseArgs(["--platform=Linux"])).toThrow(
            "Unknown option: --platform=Linux"
        );
    });
});

import path from "node:path";

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
type InstallBuildDependenciesModule = {
    getBuildDependencyCommands: (platform: string) => [string, string[]][];
    installBuildDependencies: (options: {
        platform: string;
        runCommand: (
            command: string,
            args: string[],
            options: CommandCall["options"]
        ) => void;
        repositoryRoot?: string;
    }) => number;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        help: boolean;
        platform: string;
    };
};

async function importInstallBuildDependencies(): Promise<InstallBuildDependenciesModule> {
    return (await import("../../../scripts/install-build-dependencies.mjs")) as InstallBuildDependenciesModule;
}

describe("install-build-dependencies script", () => {
    it("returns the Linux build dependency commands", async () => {
        expect.assertions(1);

        const { getBuildDependencyCommands } =
            await importInstallBuildDependencies();
        const commands = getBuildDependencyCommands("Linux");

        expect(commands).toStrictEqual([
            ["sudo", ["apt-get", "update"]],
            [
                "sudo",
                [
                    "apt-get",
                    "install",
                    "-y",
                    "rpm",
                    "dpkg",
                    "fakeroot",
                    "xz-utils",
                    "flatpak",
                    "flatpak-builder",
                    "ruby",
                    "ruby-dev",
                    "build-essential",
                    "zlib1g-dev",
                ],
            ],
            [
                "sudo",
                [
                    "gem",
                    "install",
                    "--no-document",
                    "fpm",
                ],
            ],
            [
                "sudo",
                [
                    "apt-get",
                    "install",
                    "-y",
                    "libarchive-tools",
                ],
            ],
            [
                "sudo",
                [
                    "apt-get",
                    "install",
                    "-y",
                    "pkg-config",
                    "pkgconf",
                    "pkg-haskell-tools",
                    "pkg-js-tools",
                    "pkg-kde-tools",
                    "pkg-perl-tools",
                    "pkg-php-tools",
                ],
            ],
            ["which", ["bsdtar"]],
            [
                "sudo",
                [
                    "apt-get",
                    "install",
                    "-y",
                    "pacman",
                ],
            ],
        ]);
    });

    it("returns the macOS and Windows build dependency commands", async () => {
        expect.assertions(2);

        const { getBuildDependencyCommands } =
            await importInstallBuildDependencies();

        expect(getBuildDependencyCommands("macOS")).toStrictEqual([
            [
                "brew",
                [
                    "install",
                    "rpm",
                    "dpkg",
                    "xz",
                    "gnu-tar",
                ],
            ],
        ]);
        expect(getBuildDependencyCommands("Windows")).toStrictEqual([
            [
                "choco",
                [
                    "install",
                    "-y",
                    "7zip.install",
                ],
            ],
            [
                "choco",
                [
                    "install",
                    "-y",
                    "nsis",
                ],
            ],
        ]);
    });

    it("runs each command for the requested platform", async () => {
        expect.assertions(1);

        const { installBuildDependencies } =
            await importInstallBuildDependencies();
        const calls: CommandCall[] = [];

        const installedCommandCount = installBuildDependencies({
            platform: "Windows",
            runCommand(command, args, options) {
                calls.push({ args, command, options });
            },
        });

        expect({
            commands: calls.map((call) => call.command),
            cwdChecks: calls.map((call) => ({
                cwd: call.options.cwd,
                cwdIsNestedElectronApp: path
                    .resolve(call.options.cwd)
                    .includes(`${path.sep}electron-app${path.sep}`),
                cwdRelativeToRepository: path.relative(
                    repositoryRoot,
                    path.resolve(call.options.cwd)
                ),
            })),
            installedCommandCount,
            stdioModes: calls.map((call) => call.options.stdio),
        }).toStrictEqual({
            commands: ["choco", "choco"],
            cwdChecks: [
                {
                    cwd: repositoryRoot,
                    cwdIsNestedElectronApp: false,
                    cwdRelativeToRepository: "",
                },
                {
                    cwd: repositoryRoot,
                    cwdIsNestedElectronApp: false,
                    cwdRelativeToRepository: "",
                },
            ],
            installedCommandCount: 2,
            stdioModes: ["inherit", "inherit"],
        });
    });

    it("normalizes relative build dependency roots before running commands", async () => {
        expect.assertions(1);

        const { installBuildDependencies } =
            await importInstallBuildDependencies();
        const calls: CommandCall[] = [];

        installBuildDependencies({
            platform: "Windows",
            repositoryRoot: ".",
            runCommand(command, args, options) {
                calls.push({ args, command, options });
            },
        });

        expect(new Set(calls.map((call) => call.options.cwd))).toStrictEqual(
            new Set([repositoryRoot])
        );
    });

    it("parses CLI arguments and environment defaults", async () => {
        expect.assertions(3);

        const { parseArgs } = await importInstallBuildDependencies();

        expect(parseArgs([], { RUNNER_OS: "Linux" })).toStrictEqual({
            help: false,
            platform: "Linux",
        });
        expect(parseArgs(["--platform=macOS"], {})).toStrictEqual({
            help: false,
            platform: "macOS",
        });
        expect(() => parseArgs(["--platform=Solaris"], {})).toThrow(
            "Unsupported build dependency platform: Solaris"
        );
    });
});

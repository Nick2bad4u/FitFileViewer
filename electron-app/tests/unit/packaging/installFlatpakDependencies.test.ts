import { describe, expect, it } from "vitest";

type CommandCall = {
    args: string[];
    command: string;
    options: {
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
        ) => void
    ) => number;
    parseArgs: (args: string[]) => {
        help: boolean;
    };
};

async function importInstallFlatpakDependencies(): Promise<InstallFlatpakDependenciesModule> {
    return (await import("../../../../scripts/install-flatpak-dependencies.mjs")) as InstallFlatpakDependenciesModule;
}

describe("install-flatpak-dependencies script", () => {
    it("returns the Flatpak dependency setup commands", async () => {
        expect.assertions(5);

        const { getFlatpakDependencyCommands } =
            await importInstallFlatpakDependencies();
        const commands = getFlatpakDependencyCommands();

        expect(commands[0]).toStrictEqual(["sudo", ["apt-get", "update"]]);
        expect(commands[1]).toStrictEqual([
            "sudo",
            [
                "apt-get",
                "install",
                "-y",
                "flatpak",
                "flatpak-builder",
                "elfutils",
            ],
        ]);
        expect(commands[2]).toContain("flatpak");
        expect(commands[2]?.[1]).toContain(
            "https://flathub.org/repo/flathub.flatpakrepo"
        );
        expect(commands.at(-1)).toStrictEqual([
            "flatpak",
            [
                "update",
                "-y",
                "--user",
            ],
        ]);
    });

    it("runs each command with inherited stdio", async () => {
        expect.assertions(3);

        const { installFlatpakDependencies } =
            await importInstallFlatpakDependencies();
        const calls: CommandCall[] = [];

        expect(
            installFlatpakDependencies((command, args, options) => {
                calls.push({ args, command, options });
            })
        ).toBe(5);
        expect(calls.map((call) => call.command)).toStrictEqual([
            "sudo",
            "sudo",
            "flatpak",
            "flatpak",
            "flatpak",
        ]);
        expect(calls.every((call) => call.options.stdio === "inherit")).toBe(
            true
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

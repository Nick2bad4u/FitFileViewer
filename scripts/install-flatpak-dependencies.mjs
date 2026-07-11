import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "./lib/workspaces.mjs";

const flatpakDependencyCommands = [
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
];

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        printUsage();
    } else {
        installFlatpakDependencies();
    }
}

export function getFlatpakDependencyCommands() {
    return flatpakDependencyCommands;
}

export function installFlatpakDependencies(
    runCommand = execFileSync,
    options = {}
) {
    const root = path.resolve(options.repositoryRoot ?? repositoryRoot);

    for (const [command, args] of flatpakDependencyCommands) {
        runCommand(command, args, { cwd: root, stdio: "inherit" });
    }

    return flatpakDependencyCommands.length;
}

export function parseArgs(args) {
    const options = {
        help: false,
    };

    for (const arg of args) {
        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    return options;
}

function printUsage() {
    console.log(`Usage: node scripts/install-flatpak-dependencies.mjs [options]

Options:
  -h, --help  Show this help text.`);
}

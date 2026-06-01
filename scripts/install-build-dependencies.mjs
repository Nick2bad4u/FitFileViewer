import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    readInlineOptionValue,
    readOptionValue,
    requireOption,
} from "./lib/cli-options.mjs";
import { repositoryRoot } from "./lib/workspaces.mjs";

const linuxCommands = [
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
];
const macosCommands = [
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
];
const windowsCommands = [
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
];

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const options = parseArgs(process.argv.slice(2), process.env);

    if (options.help) {
        printUsage();
    } else {
        installBuildDependencies(options);
    }
}

export function getBuildDependencyCommands(platform) {
    if (platform === "Linux") {
        return linuxCommands;
    }

    if (platform === "macOS") {
        return macosCommands;
    }

    if (platform === "Windows") {
        return windowsCommands;
    }

    throw new Error(`Unsupported build dependency platform: ${platform}`);
}

export function installBuildDependencies(options) {
    const commands = getBuildDependencyCommands(options.platform);
    const runCommand = options.runCommand ?? execFileSync;
    const root = options.repositoryRoot ?? repositoryRoot;

    for (const [command, args] of commands) {
        runCommand(command, args, { cwd: root, stdio: "inherit" });
    }

    return commands.length;
}

export function parseArgs(args, environment = process.env) {
    const options = {
        help: false,
        platform: environment.RUNNER_OS ?? platformFromNode(process.platform),
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }

        if (arg === "--platform") {
            options.platform = readOptionValue(args, index, "--platform");
            index += 1;
            continue;
        }

        if (arg.startsWith("--platform=")) {
            options.platform = readInlineOptionValue(arg, "--platform");
            continue;
        }

        throw new Error(`Unknown option: ${arg}`);
    }

    if (!options.help) {
        requireOption(options.platform, "--platform or RUNNER_OS");
        getBuildDependencyCommands(options.platform);
    }

    return options;
}

function platformFromNode(platform) {
    if (platform === "darwin") {
        return "macOS";
    }

    if (platform === "linux") {
        return "Linux";
    }

    if (platform === "win32") {
        return "Windows";
    }

    return undefined;
}

function printUsage() {
    console.log(`Usage: node scripts/install-build-dependencies.mjs [options]

Options:
  --platform <Linux|macOS|Windows>  Platform to install for. Defaults to RUNNER_OS.
  -h, --help                        Show this help text.`);
}

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const cleanReleasesScript = path.join(
    repositoryRoot,
    ".github",
    "CleanReleases.ps1"
);

const parsedArgs = parseArgs(process.argv.slice(2));

if (parsedArgs.help) {
    console.log(`Usage: node scripts/clean-releases.mjs [options]

Options:
  --keep-last <count>  Number of most recent releases to keep.
  --delete-tags        Also delete git tags for removed releases.
  --help               Show this help text.`);
} else {
    const powershellArgs = [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        cleanReleasesScript,
    ];

    if (parsedArgs.keepLast !== undefined) {
        powershellArgs.push("-keepLast", String(parsedArgs.keepLast));
    }

    if (parsedArgs.deleteTags) {
        powershellArgs.push("-deleteTags");
    }

    const result = spawnSync(resolvePowerShellCommand(), powershellArgs, {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    process.exitCode = result.status ?? 1;
}

function parseArgs(args) {
    const parsed = {
        deleteTags: false,
        help: false,
        keepLast: undefined,
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];

        if (arg === "--help" || arg === "-h") {
            parsed.help = true;
            continue;
        }

        if (arg === "--delete-tags") {
            parsed.deleteTags = true;
            continue;
        }

        if (arg === "--keep-last") {
            const value = args[index + 1];
            parsed.keepLast = parseKeepLast(value);
            index += 1;
            continue;
        }

        if (arg.startsWith("--keep-last=")) {
            parsed.keepLast = parseKeepLast(arg.slice("--keep-last=".length));
            continue;
        }

        throw new TypeError(`Unknown clean-releases argument: ${arg}`);
    }

    return parsed;
}

function parseKeepLast(value) {
    const keepLast = Number(value);

    if (!Number.isInteger(keepLast) || keepLast < 1) {
        throw new TypeError(
            `--keep-last must be a positive integer, received: ${value}`
        );
    }

    return keepLast;
}

function resolvePowerShellCommand() {
    return process.env.POWERSHELL || "powershell.exe";
}

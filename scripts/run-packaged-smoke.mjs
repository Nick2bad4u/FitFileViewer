import { spawnSync } from "node:child_process";
import {
    accessSync,
    closeSync,
    constants,
    existsSync,
    mkdtempSync,
    openSync,
    readFileSync,
    readdirSync,
    rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootReleaseDistAbsolutePath,
} from "./lib/workspaces.mjs";

const defaultStartupTimeoutMs = 10_000;
const failureOutputMarkers = [
    "cannot find module",
    "err_file_not_found",
    "error loading main html file",
    "failed to load url",
    "fatal",
    "uncaught exception",
    "unhandledpromiserejection",
];

export function parseArgs(argv = []) {
    let executablePath;
    let releaseDistPath;
    let startupTimeoutMs;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--executable") {
            executablePath = argv[index + 1];
            if (!executablePath || executablePath.startsWith("-")) {
                throw new Error("--executable requires a value");
            }
            index += 1;
            continue;
        }

        if (arg.startsWith("--executable=")) {
            executablePath = arg.slice("--executable=".length);
            if (!executablePath) {
                throw new Error("--executable must not be empty");
            }
            continue;
        }

        if (arg === "--release-dist") {
            releaseDistPath = argv[index + 1];
            if (!releaseDistPath || releaseDistPath.startsWith("-")) {
                throw new Error("--release-dist requires a value");
            }
            index += 1;
            continue;
        }

        if (arg.startsWith("--release-dist=")) {
            releaseDistPath = arg.slice("--release-dist=".length);
            if (!releaseDistPath) {
                throw new Error("--release-dist must not be empty");
            }
            continue;
        }

        if (arg === "--startup-timeout-ms") {
            startupTimeoutMs = parseStartupTimeoutMs(argv[index + 1]);
            index += 1;
            continue;
        }

        if (arg.startsWith("--startup-timeout-ms=")) {
            startupTimeoutMs = parseStartupTimeoutMs(
                arg.slice("--startup-timeout-ms=".length)
            );
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return { executablePath, releaseDistPath, startupTimeoutMs };
}

export function getPackagedExecutableCandidates({
    platform = process.platform,
    releaseDistPath = rootReleaseDistAbsolutePath,
} = {}) {
    if (platform === "win32") {
        return [
            path.join(releaseDistPath, "win-unpacked", "Fit File Viewer.exe"),
        ];
    }

    if (platform === "darwin") {
        return [
            path.join(
                releaseDistPath,
                "mac",
                "Fit File Viewer.app",
                "Contents",
                "MacOS",
                "Fit File Viewer"
            ),
            path.join(
                releaseDistPath,
                "mac-arm64",
                "Fit File Viewer.app",
                "Contents",
                "MacOS",
                "Fit File Viewer"
            ),
        ];
    }

    return [
        path.join(releaseDistPath, "linux-unpacked", "fitfileviewer"),
        path.join(releaseDistPath, "linux-unpacked", "Fit File Viewer"),
        path.join(releaseDistPath, "linux-unpacked", "fit-file-viewer"),
    ];
}

export function findPackagedElectronExecutable({
    executablePath,
    platform = process.platform,
    releaseDistPath = rootReleaseDistAbsolutePath,
} = {}) {
    if (executablePath) {
        const resolvedExecutablePath = path.resolve(executablePath);
        if (!existsSync(resolvedExecutablePath)) {
            throw new Error(
                `Packaged Electron executable not found: ${resolvedExecutablePath}`
            );
        }
        return resolvedExecutablePath;
    }

    const candidates = getPackagedExecutableCandidates({
        platform,
        releaseDistPath,
    });
    const directMatch = candidates.find((candidate) => existsSync(candidate));
    if (directMatch) {
        return directMatch;
    }

    const recursiveMatch = findPackagedExecutableInReleaseDist(
        releaseDistPath,
        platform
    );
    if (recursiveMatch) {
        return recursiveMatch;
    }

    throw new Error(
        [
            "Packaged Electron executable not found.",
            "Run `npm run package` first or pass --executable <path>.",
            "Checked:",
            ...candidates.map((candidate) => `- ${candidate}`),
        ].join("\n")
    );
}

export function runPackagedSmoke(
    argv = process.argv.slice(2),
    environment = process.env,
    commandRunner = spawnSync,
    logger = console.log
) {
    const { executablePath, releaseDistPath, startupTimeoutMs } =
        parseArgs(argv);
    const resolvedExecutablePath = findPackagedElectronExecutable({
        executablePath: executablePath ?? environment.FFV_PACKAGED_APP,
        releaseDistPath:
            releaseDistPath === undefined
                ? rootReleaseDistAbsolutePath
                : path.resolve(releaseDistPath),
    });
    const timeoutMs =
        startupTimeoutMs ??
        parseStartupTimeoutMs(
            environment.FFV_PACKAGED_SMOKE_TIMEOUT_MS ??
                String(defaultStartupTimeoutMs)
        );

    logger(
        `[packaged-smoke] Launching ${resolvedExecutablePath} for ${timeoutMs}ms`
    );

    const { outputFiles, result } = runWithCapturedOutput(
        commandRunner,
        resolvedExecutablePath,
        timeoutMs,
        environment
    );
    const output = [
        outputFiles.stdout,
        outputFiles.stderr,
        stringifyProcessOutput(result.stdout),
        stringifyProcessOutput(result.stderr),
    ]
        .filter(Boolean)
        .join("\n");

    assertNoStartupFailureOutput(output);

    if (result.error && result.error.code !== "ETIMEDOUT") {
        throw result.error;
    }

    if (result.status !== null && result.status !== undefined) {
        throw new Error(
            [
                `Packaged app exited before the ${timeoutMs}ms startup smoke window.`,
                `Exit status: ${result.status}`,
                output.trim() ? `Output:\n${output.trim()}` : "",
            ]
                .filter(Boolean)
                .join("\n")
        );
    }

    logger("[packaged-smoke] Packaged app stayed alive without fatal output");
    return 0;
}

function runWithCapturedOutput(
    commandRunner,
    resolvedExecutablePath,
    timeoutMs,
    environment
) {
    const captureDirectory = mkdtempSync(
        path.join(tmpdir(), "ffv-packaged-smoke-")
    );
    const stderrPath = path.join(captureDirectory, "stderr.log"),
        stdoutPath = path.join(captureDirectory, "stdout.log");
    const stderrDescriptor = openSync(stderrPath, "w"),
        stdoutDescriptor = openSync(stdoutPath, "w");

    try {
        const result = commandRunner(
            resolvedExecutablePath,
            ["--disable-http-cache"],
            {
                cwd: repositoryRoot,
                env: {
                    ...environment,
                    ELECTRON_IS_DEV: "0",
                    FFV_DISABLE_WEB_SECURITY: "false",
                    NODE_ENV: "production",
                },
                encoding: "utf8",
                killSignal: "SIGTERM",
                stdio: [
                    "ignore",
                    stdoutDescriptor,
                    stderrDescriptor,
                ],
                timeout: timeoutMs,
            }
        );

        return {
            outputFiles: {
                stderr: readFileSync(stderrPath, "utf8"),
                stdout: readFileSync(stdoutPath, "utf8"),
            },
            result,
        };
    } finally {
        closeFileDescriptor(stdoutDescriptor);
        closeFileDescriptor(stderrDescriptor);
        rmSync(captureDirectory, { force: true, recursive: true });
    }
}

function closeFileDescriptor(descriptor) {
    try {
        closeSync(descriptor);
    } catch (error) {
        if (
            !(error instanceof Error) ||
            !("code" in error) ||
            error.code !== "EBADF"
        ) {
            throw error;
        }
    }
}

function assertNoStartupFailureOutput(output) {
    const normalizedOutput = output.toLowerCase();
    for (const marker of failureOutputMarkers) {
        if (!normalizedOutput.includes(marker)) {
            continue;
        }

        throw new Error(
            [
                `Packaged app startup output matched failure marker "${marker}".`,
                output.trim() ? `Output:\n${output.trim()}` : "",
            ]
                .filter(Boolean)
                .join("\n")
        );
    }
}

function findPackagedExecutableInReleaseDist(releaseDistPath, platform) {
    if (!existsSync(releaseDistPath)) {
        return null;
    }

    const matches = [];

    function visit(directoryPath) {
        for (const entry of readdirSync(directoryPath, {
            withFileTypes: true,
        })) {
            const entryPath = path.join(directoryPath, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath);
                continue;
            }

            if (isLikelyPackagedExecutable(entryPath, platform)) {
                matches.push(entryPath);
            }
        }
    }

    visit(releaseDistPath);
    return matches.sort()[0] ?? null;
}

function isLikelyPackagedExecutable(filePath, platform) {
    const fileName = path.basename(filePath).toLowerCase();

    if (platform === "win32") {
        return fileName === "fit file viewer.exe";
    }

    if (platform === "darwin") {
        return (
            filePath.includes(
                `${path.sep}Contents${path.sep}MacOS${path.sep}`
            ) && fileName === "fit file viewer"
        );
    }

    if (
        ![
            "fit file viewer",
            "fit-file-viewer",
            "fitfileviewer",
        ].includes(fileName)
    ) {
        return false;
    }

    try {
        accessSync(filePath, constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

function parseStartupTimeoutMs(value) {
    if (!value) {
        throw new Error("--startup-timeout-ms requires a value");
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsed) || parsed < 1000) {
        throw new Error("--startup-timeout-ms must be an integer >= 1000");
    }

    return parsed;
}

function stringifyProcessOutput(value) {
    if (!value) {
        return "";
    }

    if (Buffer.isBuffer(value)) {
        return value.toString("utf8");
    }

    return String(value);
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runPackagedSmoke();
}

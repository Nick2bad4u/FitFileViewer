import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
    accessSync,
    closeSync,
    constants,
    existsSync,
    mkdirSync,
    mkdtempSync,
    openSync,
    readFileSync,
    readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootReleaseDistAbsolutePath,
} from "./lib/workspaces.mjs";

const defaultStartupTimeoutMs = 60_000;
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
    let fixturePath;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--fixture") {
            fixturePath = argv[index + 1];
            if (!fixturePath || fixturePath.startsWith("-")) {
                throw new Error("--fixture requires a value");
            }
            index += 1;
            continue;
        }
        if (arg.startsWith("--fixture=")) {
            fixturePath = arg.slice("--fixture=".length);
            if (!fixturePath) {
                throw new Error("--fixture must not be empty");
            }
            continue;
        }

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

    return { executablePath, releaseDistPath, startupTimeoutMs, fixturePath };
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
    const { executablePath, releaseDistPath, startupTimeoutMs, fixturePath } =
        parseArgs(argv);
    const configuredExecutablePath =
        executablePath ?? environment.FFV_PACKAGED_APP;
    const resolvedReleaseDistPath =
        releaseDistPath === undefined
            ? rootReleaseDistAbsolutePath
            : path.resolve(releaseDistPath);
    const resolvedExecutablePath = findPackagedElectronExecutable({
        executablePath: configuredExecutablePath,
        releaseDistPath: resolvedReleaseDistPath,
    });
    const packagingInspectionPath = configuredExecutablePath
        ? path.dirname(resolvedExecutablePath)
        : resolvedReleaseDistPath;

    assertNoForbiddenWindowsPackagingArtifacts(packagingInspectionPath);
    const timeoutMs =
        startupTimeoutMs ??
        parseStartupTimeoutMs(
            environment.FFV_PACKAGED_SMOKE_TIMEOUT_MS ??
                String(defaultStartupTimeoutMs)
        );

    logger(
        `[packaged-smoke] Launching ${resolvedExecutablePath} for ${timeoutMs}ms`
    );

    const resolvedFixturePath = path.resolve(
        fixturePath ??
            path.join(
                repositoryRoot,
                "fit-test-files",
                "_Fenton_Michigan_Afternoon_Ride_5_27_miles.fit"
            )
    );
    if (!existsSync(resolvedFixturePath)) {
        throw new Error(`Smoke FIT fixture not found: ${resolvedFixturePath}`);
    }
    const { outputFiles, result, captureDirectory, nonce } =
        runWithCapturedOutput(
            commandRunner,
            resolvedExecutablePath,
            timeoutMs,
            environment,
            resolvedFixturePath,
            logger
        );
    const output = [
        outputFiles.stdout,
        outputFiles.stderr,
        stringifyProcessOutput(result.stdout),
        stringifyProcessOutput(result.stderr),
    ]
        .filter(Boolean)
        .join("\n");

    const timedOut = result.error?.code === "ETIMEDOUT";
    assertNoStartupFailureOutput(output);

    if (result.error && !timedOut) {
        throw result.error;
    }

    if (timedOut || result.signal || result.status !== 0) {
        throw new Error(
            [
                `Packaged app did not complete its startup smoke within ${timeoutMs}ms.`,
                `Exit status: ${result.status}; signal: ${result.signal ?? "none"}; timed out: ${timedOut}`,
                `Diagnostics: ${captureDirectory}`,
                output.trim() ? `Output:\n${output.trim()}` : "",
            ]
                .filter(Boolean)
                .join("\n")
        );
    }

    const reportPath = path.join(captureDirectory, "report.json");
    if (!existsSync(reportPath)) {
        throw new Error(
            `Packaged app exited without a readiness report. Diagnostics: ${captureDirectory}`
        );
    }
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    if (
        report === null ||
        typeof report !== "object" ||
        report.nonce !== nonce ||
        report.status !== "passed" ||
        report.visible !== true ||
        report.activity === null ||
        typeof report.activity !== "object" ||
        !Number.isSafeInteger(report.activity.recordCount) ||
        report.activity.recordCount < 1 ||
        report.activity.appInitialized !== true ||
        report.activity.mapReady !== true ||
        !Number.isSafeInteger(report.activity.routeCount) ||
        report.activity.routeCount < 1 ||
        !Number.isSafeInteger(report.activity.sessionCount) ||
        report.activity.sessionCount < 1
    ) {
        throw new Error(
            `Packaged app returned an invalid readiness report. Diagnostics: ${captureDirectory}`
        );
    }
    if (
        environment.FFV_SMOKE_EXPECTED_ARCH &&
        report.arch !== environment.FFV_SMOKE_EXPECTED_ARCH
    ) {
        throw new Error(
            `Packaged app architecture ${report.arch} does not match ${environment.FFV_SMOKE_EXPECTED_ARCH}. Diagnostics: ${captureDirectory}`
        );
    }
    if (
        environment.FFV_SMOKE_EXPECTED_VERSION &&
        report.version !== environment.FFV_SMOKE_EXPECTED_VERSION
    ) {
        throw new Error(
            `Packaged app version ${report.version} does not match ${environment.FFV_SMOKE_EXPECTED_VERSION}. Diagnostics: ${captureDirectory}`
        );
    }
    logger(
        `[packaged-smoke] Verified visible renderer, preload IPC, FIT activity and rendered map: ${JSON.stringify(report)}`
    );
    logger(`[packaged-smoke] Diagnostics: ${captureDirectory}`);
    return 0;
}

export function findForbiddenWindowsPackagingArtifacts(directoryPath) {
    if (!existsSync(directoryPath)) {
        return [];
    }

    const matches = [];

    function visit(currentDirectoryPath) {
        for (const entry of readdirSync(currentDirectoryPath, {
            withFileTypes: true,
        })) {
            const entryPath = path.join(currentDirectoryPath, entry.name);
            const normalizedName = entry.name.toLowerCase();
            if (
                normalizedName === "squirrel.exe" ||
                normalizedName.includes("squirrel-windows") ||
                normalizedName.startsWith("fit-file-viewer-squirrel-") ||
                normalizedName.endsWith(".nupkg") ||
                normalizedName.endsWith("_executionstub.exe")
            ) {
                matches.push(entryPath);
                continue;
            }

            if (entry.isDirectory()) {
                visit(entryPath);
                continue;
            }
        }
    }

    visit(directoryPath);
    return matches.sort();
}

function assertNoForbiddenWindowsPackagingArtifacts(directoryPath) {
    const forbiddenArtifacts =
        findForbiddenWindowsPackagingArtifacts(directoryPath);
    if (forbiddenArtifacts.length === 0) {
        return;
    }

    throw new Error(
        [
            "Packaged app contains forbidden Squirrel.Windows packaging artifacts:",
            ...forbiddenArtifacts.map((filePath) => `- ${filePath}`),
        ].join("\n")
    );
}

export function getPackagedLaunchArgs(
    environment = process.env,
    platform = process.platform
) {
    const args = ["--disable-http-cache"];

    if (platform === "linux" && environment.CI === "true") {
        args.push("--no-sandbox");
    }

    return args;
}

function runWithCapturedOutput(
    commandRunner,
    resolvedExecutablePath,
    timeoutMs,
    environment,
    fixturePath,
    logger
) {
    const diagnosticsRoot = environment.FFV_SMOKE_DIAGNOSTICS_DIRECTORY
        ? path.resolve(environment.FFV_SMOKE_DIAGNOSTICS_DIRECTORY)
        : tmpdir();
    mkdirSync(diagnosticsRoot, { recursive: true });
    const captureDirectory = mkdtempSync(
        path.join(diagnosticsRoot, "ffv-packaged-smoke-")
    );
    const nonce = randomUUID();
    logger(`[packaged-smoke] Diagnostics: ${captureDirectory}`);
    const stderrPath = path.join(captureDirectory, "stderr.log"),
        stdoutPath = path.join(captureDirectory, "stdout.log");
    const stderrDescriptor = openSync(stderrPath, "w"),
        stdoutDescriptor = openSync(stdoutPath, "w");

    try {
        const result = commandRunner(
            resolvedExecutablePath,
            [
                ...getPackagedLaunchArgs(environment),
                "--ffv-smoke-test",
                `--user-data-dir=${path.join(captureDirectory, "user-data")}`,
            ],
            {
                cwd: repositoryRoot,
                env: {
                    ...environment,
                    ELECTRON_IS_DEV: "0",
                    FFV_DISABLE_WEB_SECURITY: "false",
                    FFV_SMOKE_DIRECTORY: captureDirectory,
                    FFV_SMOKE_NONCE: nonce,
                    FFV_SMOKE_FIXTURE: fixturePath,
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
            captureDirectory,
            nonce,
            outputFiles: {
                stderr: readFileSync(stderrPath, "utf8"),
                stdout: readFileSync(stdoutPath, "utf8"),
            },
            result,
        };
    } finally {
        closeFileDescriptor(stdoutDescriptor);
        closeFileDescriptor(stderrDescriptor);
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

    const parsed = Number(value);
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

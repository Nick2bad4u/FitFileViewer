import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootReleaseDistAbsolutePath,
} from "./lib/workspaces.mjs";

const smokeExecutable = "Fit File Viewer.app/Contents/MacOS/Fit File Viewer";
const rosettaLogPredicate =
    'process == "oahd" OR process == "oahd-helper" OR (process == "kernel" AND (eventMessage CONTAINS[c] "rosetta" OR eventMessage CONTAINS[c] "code sign"))';

async function execFileAsync(command, args, options) {
    return new Promise((resolve, reject) => {
        execFile(command, args, options, (error, stdout, stderr) => {
            if (error) {
                const failure = new Error(error.message, { cause: error });
                Object.assign(failure, { stdout, stderr });
                reject(failure);
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}

export function findSmokeProcesses(output, harnessPid) {
    const processes = output.split("\n").flatMap((line) => {
        const match = /^\s*(\d+)\s+(\d+)\s+(.+)$/u.exec(line);
        return match
            ? [
                  {
                      pid: Number(match[1]),
                      parentPid: Number(match[2]),
                      command: match[3],
                  },
              ]
            : [];
    });
    const descendants = new Set([harnessPid]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const candidate of processes) {
            if (
                descendants.has(candidate.parentPid) &&
                !descendants.has(candidate.pid)
            ) {
                descendants.add(candidate.pid);
                changed = true;
            }
        }
    }
    return processes.filter(
        ({ pid, command }) =>
            descendants.has(pid) &&
            command.includes(smokeExecutable) &&
            command.includes("--ffv-smoke-test")
    );
}

export function selectProcessesToSample(processes, observations, now) {
    const selected = [];
    for (const candidate of processes) {
        const observation = observations.get(candidate.pid);
        if (!observation) {
            observations.set(candidate.pid, { firstSeen: now, sampled: false });
        } else if (
            !observation.sampled &&
            now - observation.firstSeen >= 20_000
        ) {
            observation.sampled = true;
            selected.push(candidate);
        }
    }
    return selected;
}

export async function captureDiagnosticCommand(
    command,
    args,
    runner = execFileAsync
) {
    try {
        return {
            status: 0,
            ...(await runner(command, args, {
                encoding: "utf8",
                timeout: 15_000,
                maxBuffer: 4 * 1024 * 1024,
            })),
        };
    } catch (error) {
        return {
            status: 1,
            stdout: error.stdout ?? "",
            stderr: error.stderr || error.message,
        };
    }
}

function writeDiagnostic(directory, name, result) {
    fs.writeFileSync(
        path.join(directory, name),
        `status=${result.status}\n${result.stdout}\n${result.stderr}\n`
    );
}

export async function verifyRosetta(
    directory,
    capture = captureDiagnosticCommand
) {
    fs.mkdirSync(directory, { recursive: true });
    console.log("[macos-smoke] Probing /usr/bin/arch -x86_64 /usr/bin/true");
    const result = await capture("/usr/bin/arch", ["-x86_64", "/usr/bin/true"]);
    writeDiagnostic(directory, "rosetta-probe.log", result);
    if (result.status !== 0)
        throw new Error(`Rosetta execution probe failed: ${result.stderr}`);
}

export async function sampleHungSmokeProcesses(
    harnessPid,
    directory,
    observations,
    dependencies = {}
) {
    const capture = dependencies.capture ?? captureDiagnosticCommand;
    const now = dependencies.now ?? Date.now;
    const processList = await capture("/bin/ps", [
        "-axo",
        "pid=,ppid=,command=",
    ]);
    if (processList.status !== 0) {
        // Never persist a full process listing: other CI processes may carry secrets.
        writeDiagnostic(directory, "process-inspection-error.txt", {
            ...processList,
            stdout: "",
        });
        return;
    }
    const candidates = findSmokeProcesses(processList.stdout, harnessPid);
    for (const candidate of selectProcessesToSample(
        candidates,
        observations,
        now()
    )) {
        fs.writeFileSync(
            path.join(directory, `process-${candidate.pid}.json`),
            `${JSON.stringify(candidate, null, 2)}\n`
        );
        const samplePath = path.join(directory, `sample-${candidate.pid}.txt`);
        const result = await capture("/usr/bin/sample", [
            String(candidate.pid),
            "5",
            "1",
            "-file",
            samplePath,
        ]);
        writeDiagnostic(
            directory,
            `sample-${candidate.pid}-command.txt`,
            result
        );
    }
}

function resolveDiagnosticOptions(options) {
    const platform = options.platform ?? process.platform;
    if (platform !== "darwin")
        throw new Error("macOS smoke diagnostics require macOS");
    const directory =
        options.directory ??
        path.join(
            rootReleaseDistAbsolutePath,
            "smoke-diagnostics",
            "native-processes"
        );
    return { directory, environment: options.environment ?? process.env };
}

function resolveDiagnosticDependencies(dependencies) {
    return {
        spawnHarness: dependencies.spawn ?? spawn,
        capture: dependencies.capture ?? captureDiagnosticCommand,
        inspect: dependencies.inspect ?? sampleHungSmokeProcesses,
    };
}

export async function runMacosSmokeDiagnostics(
    options = {},
    dependencies = {}
) {
    const { directory, environment } = resolveDiagnosticOptions(options);
    const { spawnHarness, capture, inspect } =
        resolveDiagnosticDependencies(dependencies);
    fs.mkdirSync(directory, { recursive: true });
    const child = spawnHarness(
        process.execPath,
        [path.join(repositoryRoot, "scripts/run-distributable-smoke.mjs")],
        {
            cwd: repositoryRoot,
            env: environment,
            stdio: "inherit",
            timeout: 15 * 60 * 1000,
        }
    );
    const stopMonitor = startSmokeProcessMonitor(child, directory, {
        capture,
        inspect,
    });
    try {
        const [status, signal] = await once(child, "close");
        return signal ? 1 : (status ?? 1);
    } finally {
        await stopMonitor();
        const logs = await capture("/usr/bin/log", [
            "show",
            "--last",
            "5m",
            "--style",
            "compact",
            "--predicate",
            rosettaLogPredicate,
        ]);
        writeDiagnostic(directory, "rosetta-system.log", logs);
    }
}

function startSmokeProcessMonitor(child, directory, { capture, inspect }) {
    const observations = new Map();
    let pending;
    const timer = setInterval(() => {
        if (pending || !child.pid) return;
        pending = inspect(child.pid, directory, observations, { capture })
            .catch((error) => {
                writeDiagnostic(directory, "monitor-error.txt", {
                    status: 1,
                    stdout: "",
                    stderr: String(error),
                });
            })
            .finally(() => {
                pending = undefined;
            });
    }, 5000);
    return async () => {
        clearInterval(timer);
        await pending;
    };
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    if (process.argv.includes("--probe-rosetta")) {
        await verifyRosetta(
            path.join(
                rootReleaseDistAbsolutePath,
                "smoke-diagnostics",
                "native-processes"
            )
        );
    } else {
        process.exitCode = await runMacosSmokeDiagnostics();
    }
}

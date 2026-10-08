import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { evaluateCapturedAudit } from "./lib/audit-evaluation.mjs";
import { repositoryRoot } from "./lib/workspaces.mjs";

export function readAuditJson(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getAuditEnvironment(environment) {
    const sanitized = { ...environment };
    delete sanitized.npm_config_allow_scripts;
    delete sanitized.NPM_CONFIG_ALLOW_SCRIPTS;
    return sanitized;
}

export function resolveNpmAuditCommand(
    args,
    environment,
    platform = process.platform
) {
    const adjacentCli = path.join(
        path.dirname(process.execPath),
        "node_modules",
        "npm",
        "bin",
        "npm-cli.js"
    );
    const npmCli =
        environment.npm_execpath ??
        (fs.existsSync(adjacentCli) ? adjacentCli : undefined);
    if (npmCli) return { command: process.execPath, args: [npmCli, ...args] };
    if (platform === "win32") {
        throw new Error(
            "Run npm run audit so the native Node npm CLI path is available"
        );
    }
    return { command: "npm", args };
}

function printAuditSummary(result, policy, log) {
    log(
        `[audit:${result.scope}] npm status ${result.rawStatus}; threshold ${result.minimumSeverity}; accepted ${result.accepted.length}, blocked ${result.blocked.length}, below threshold ${result.belowThreshold.length}.`
    );
    if (result.accepted.length > 0) {
        const advisories = policy.advisories
            .filter((advisory) =>
                result.acceptedAdvisories.includes(advisory.url)
            )
            .map(
                (advisory) =>
                    `${advisory.name} (${advisory.url.split("/").at(-1)})`
            );
        log(
            `[audit:${result.scope}] Applied exact assessed lock-node exceptions: ${advisories.join(", ")}.`
        );
    }
    if (result.blocked.length > 0) {
        log(
            `[audit:${result.scope}] Blocking dependency findings: ${result.blocked.join(", ")}`
        );
    }
}

function runAuditScope(scope, dependencies) {
    const { readJson, environment, runner, log, root } = dependencies;
    const policy = readJson(
        path.join(root, "scripts", "audit-policy", `${scope}.json`)
    );
    const directory = scope === "root" ? root : path.join(root, "docusaurus");
    const lock = readJson(path.join(directory, "package-lock.json"));
    const args = [
        "audit",
        `--audit-level=${policy.minimumSeverity}`,
        "--json",
    ];
    const invocation = resolveNpmAuditCommand(args, environment);
    const captured = runner(invocation.command, invocation.args, {
        cwd: directory,
        encoding: "utf8",
        env: environment,
        stdio: [
            "ignore",
            "pipe",
            "pipe",
        ],
        timeout: 300_000,
        maxBuffer: 16 * 1024 * 1024,
    });
    if (captured.stderr) log(`[audit:${scope}] ${captured.stderr.trimEnd()}`);
    const result = evaluateCapturedAudit(captured, lock, policy);
    printAuditSummary(result, policy, log);
    return result.blocked.length === 0;
}

function resolveAuditDependencies({
    readJson = readAuditJson,
    environment = process.env,
    runner = spawnSync,
    log = console.log,
    root = repositoryRoot,
    logError = console.error,
} = {}) {
    return {
        readJson,
        environment: getAuditEnvironment(environment),
        runner,
        log,
        root,
        logError,
    };
}

export function runAudits(options = {}) {
    const dependencies = resolveAuditDependencies(options);
    let failed = false;
    for (const scope of ["root", "docs"]) {
        try {
            if (!runAuditScope(scope, dependencies)) failed = true;
        } catch (error) {
            failed = true;
            dependencies.logError(
                `[audit:${scope}] ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
    return failed ? 1 : 0;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runAudits();
}

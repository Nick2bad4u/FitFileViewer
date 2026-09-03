import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const environment = { ...process.env };
delete environment.npm_config_allow_scripts;
delete environment.NPM_CONFIG_ALLOW_SCRIPTS;

const npmCliPath = process.env.npm_execpath;

export const allowedDocusaurusAuditAdvisories = new Set([
    "GHSA-5p2g-fcmc-qvqq",
    "GHSA-w3rx-r6r6-pgpr",
]);

export function getBlockingAuditVulnerabilities(
    auditReport,
    allowedAdvisories,
    minimumSeverity = "high"
) {
    if (
        !auditReport ||
        typeof auditReport !== "object" ||
        Array.isArray(auditReport)
    ) {
        throw new TypeError("npm audit returned an invalid report");
    }

    if ("error" in auditReport) {
        throw new Error("npm audit reported an error instead of results");
    }

    const vulnerabilities = auditReport.vulnerabilities;
    if (
        !vulnerabilities ||
        typeof vulnerabilities !== "object" ||
        Array.isArray(vulnerabilities)
    ) {
        throw new Error("npm audit report is missing vulnerability results");
    }

    const severityRank = {
        critical: 4,
        high: 3,
        info: 0,
        low: 1,
        moderate: 2,
    };
    const minimumRank = severityRank[minimumSeverity] ?? severityRank.high;

    return Object.entries(vulnerabilities)
        .filter(([, vulnerability]) => {
            const rank = severityRank[vulnerability.severity] ?? 0;
            return (
                rank >= minimumRank &&
                !isAllowedVulnerability(
                    vulnerability,
                    vulnerabilities,
                    allowedAdvisories,
                    new Set()
                )
            );
        })
        .map(([name]) => name)
        .sort();
}

function runNpmAudit(arguments_, options = {}) {
    const command = npmCliPath
        ? process.execPath
        : process.platform === "win32"
          ? "npm.cmd"
          : "npm";
    const commandArguments = npmCliPath
        ? [npmCliPath, ...arguments_]
        : arguments_;
    const result = spawnSync(command, commandArguments, {
        cwd: process.cwd(),
        encoding: options.captureJson ? "utf8" : undefined,
        env: environment,
        stdio: options.captureJson
            ? [
                  "ignore",
                  "pipe",
                  "pipe",
              ]
            : "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status === 0) {
        return;
    }

    if (options.captureJson) {
        const auditReport = parseAuditReport(result.stdout);
        const blockingVulnerabilities = getBlockingAuditVulnerabilities(
            auditReport,
            options.allowedAdvisories,
            options.minimumSeverity
        );
        if (blockingVulnerabilities.length === 0) {
            console.warn(
                "Docusaurus audit contains only explicitly accepted, unpatched image-size advisories (GHSA-5p2g-fcmc-qvqq and GHSA-w3rx-r6r6-pgpr)."
            );
            return;
        }

        process.stderr.write(result.stderr ?? "");
        process.stdout.write(result.stdout ?? "");
        throw new Error(
            `npm audit found blocking vulnerabilities: ${blockingVulnerabilities.join(", ")}`
        );
    }

    throw new Error(`npm audit failed with exit code ${result.status ?? 1}`);
}

function isAllowedVulnerability(
    vulnerability,
    vulnerabilities,
    allowedAdvisories,
    visited
) {
    if (!Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
        return false;
    }

    return vulnerability.via.every((via) => {
        if (typeof via === "string") {
            if (visited.has(via) || !vulnerabilities[via]) {
                return false;
            }

            const nextVisited = new Set(visited);
            nextVisited.add(via);
            return isAllowedVulnerability(
                vulnerabilities[via],
                vulnerabilities,
                allowedAdvisories,
                nextVisited
            );
        }

        if (!via || typeof via.url !== "string") {
            return false;
        }

        const advisoryId = via.url.split("/").at(-1);
        return allowedAdvisories.has(advisoryId);
    });
}

function parseAuditReport(output) {
    try {
        return JSON.parse(output);
    } catch (error) {
        throw new Error("npm audit did not return valid JSON", {
            cause: error,
        });
    }
}

export function runAudits() {
    runNpmAudit(["audit", "--audit-level=moderate"]);
    runNpmAudit(
        [
            "--prefix",
            "docusaurus",
            "audit",
            "--audit-level=high",
            "--json",
        ],
        {
            allowedAdvisories: allowedDocusaurusAuditAdvisories,
            captureJson: true,
            minimumSeverity: "high",
        }
    );
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    runAudits();
}

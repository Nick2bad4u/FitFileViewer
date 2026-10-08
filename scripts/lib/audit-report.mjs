export const severityRank = Object.freeze({
    info: 0,
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
});

export const isRecord = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

export const isSeverity = (value) =>
    typeof value === "string" && Object.hasOwn(severityRank, value);

export const npmScriptPrecedenceWarning =
    "npm warn install-scripts .npmrc allow-scripts setting is being ignored because package.json declares its own allowScripts field";

export function requireAuditCondition(condition, message) {
    if (!condition) throw new Error(message);
}

export function packageNameForNode(node) {
    requireAuditCondition(typeof node === "string", "Invalid lock node path");
    const segments = node.split("/");
    requireAuditCondition(
        node.startsWith("node_modules/") &&
            !node.includes("\\") &&
            !segments.some((segment) =>
                [
                    "",
                    ".",
                    "..",
                ].includes(segment)
            ),
        `Unsafe lock node ${node}`
    );
    return node.slice(
        node.lastIndexOf("node_modules/") + "node_modules/".length
    );
}

function validateAdvisory(via, name) {
    requireAuditCondition(isRecord(via), `Malformed advisory for ${name}`);
    requireAuditCondition(
        via.name === name && via.dependency === name,
        `Advisory package identity disagrees for ${name}`
    );
    requireAuditCondition(
        isSeverity(via.severity) && typeof via.range === "string",
        `Malformed advisory severity or range for ${name}`
    );
    requireAuditCondition(
        typeof via.url === "string" &&
            /^https:\/\/github\.com\/advisories\/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/u.test(
                via.url
            ),
        `Unknown advisory URL for ${name}`
    );
}

function validateCauses(item, vulnerabilities) {
    requireAuditCondition(
        Array.isArray(item.via) && item.via.length > 0,
        `Missing advisory causes for ${item.name}`
    );
    for (const via of item.via) {
        if (typeof via === "string") {
            requireAuditCondition(
                Object.hasOwn(vulnerabilities, via),
                `Missing advisory reference ${via}`
            );
        } else validateAdvisory(via, item.name);
    }
}

function validateNodes(item, lock) {
    requireAuditCondition(
        Array.isArray(item.nodes) && item.nodes.length > 0,
        `Missing lock nodes for ${item.name}`
    );
    requireAuditCondition(
        new Set(item.nodes).size === item.nodes.length,
        `Duplicate lock nodes for ${item.name}`
    );
    for (const node of item.nodes) {
        requireAuditCondition(
            packageNameForNode(node) === item.name,
            `Audit package and lock node disagree: ${item.name}/${node}`
        );
        requireAuditCondition(
            Object.hasOwn(lock.packages, node) &&
                isRecord(lock.packages[node]) &&
                typeof lock.packages[node].version === "string",
            `Missing lock node ${node}`
        );
    }
}

function validateSummary(report) {
    const counts = report.metadata?.vulnerabilities;
    if (!isRecord(counts)) {
        throw new Error("Missing audit summary metadata");
    }
    const items = Object.values(report.vulnerabilities);
    requireAuditCondition(
        counts.total === items.length,
        "Audit summary disagrees with vulnerability nodes"
    );
    for (const severity of Object.keys(severityRank)) {
        requireAuditCondition(
            counts[severity] ===
                items.filter((item) => item.severity === severity).length,
            `Audit severity summary disagrees for ${severity}`
        );
    }
}

export function validateAuditReport(report, lock) {
    requireAuditCondition(isRecord(report), "Malformed npm audit report");
    requireAuditCondition(
        !Object.hasOwn(report, "error"),
        "npm audit reported an infrastructure error"
    );
    requireAuditCondition(
        report.auditReportVersion === 2 && isRecord(report.vulnerabilities),
        "Unsupported npm audit schema"
    );
    requireAuditCondition(
        isRecord(lock) && lock.lockfileVersion === 3 && isRecord(lock.packages),
        "Unsupported or missing lockfile packages"
    );
    for (const [name, item] of Object.entries(report.vulnerabilities)) {
        requireAuditCondition(
            isRecord(item),
            `Malformed vulnerability ${name}`
        );
        requireAuditCondition(
            item.name === name,
            `Vulnerability identity disagrees: ${name}`
        );
        requireAuditCondition(
            isSeverity(item.severity),
            `Unknown severity for ${name}`
        );
        validateCauses(item, report.vulnerabilities);
        validateNodes(item, lock);
    }
    validateSummary(report);
}

export function parseCapturedAudit(result) {
    requireAuditCondition(isRecord(result), "Missing npm audit process result");
    requireAuditCondition(
        !result.error && !result.signal,
        "Audit process failed or was terminated"
    );
    requireAuditCondition(
        result.status === 0 || result.status === 1,
        "Unexpected npm audit process status"
    );
    requireAuditCondition(
        result.stderr === undefined || typeof result.stderr === "string",
        "Invalid npm audit stderr"
    );
    const unexpectedLines = (result.stderr ?? "")
        .split(/\r?\n/u)
        .filter((line) => line !== "" && line !== npmScriptPrecedenceWarning);
    requireAuditCondition(
        unexpectedLines.length === 0,
        `Unexpected npm audit stderr: ${result.stderr}`
    );
    requireAuditCondition(
        typeof result.stdout === "string",
        "Missing npm audit JSON output"
    );
    try {
        return JSON.parse(result.stdout);
    } catch (error) {
        throw new Error("npm audit did not return valid JSON", {
            cause: error,
        });
    }
}

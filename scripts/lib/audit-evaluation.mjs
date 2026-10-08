import {
    parseCapturedAudit,
    requireAuditCondition,
    severityRank,
    validateAuditReport,
} from "./audit-report.mjs";
import {
    advisoryScopeMatches,
    lockScopeMatches,
    validateAuditPolicy,
} from "./audit-policy.mjs";

function rememberAdvisory(leaves, via) {
    const key = `${via.name}|${via.url}`;
    requireAuditCondition(
        !leaves.has(key) ||
            JSON.stringify(leaves.get(key)) === JSON.stringify(via),
        `Conflicting advisory metadata: ${key}`
    );
    leaves.set(key, via);
}

export function collectReachableCauses(vulnerabilities, start) {
    const visited = new Set();
    const leaves = new Map();
    const pending = [start];
    while (pending.length > 0) {
        const name = pending.pop();
        if (visited.has(name)) continue;
        visited.add(name);
        for (const via of vulnerabilities[name].via) {
            if (typeof via === "string") pending.push(via);
            else rememberAdvisory(leaves, via);
        }
    }
    return { packages: [...visited], leaves: [...leaves.values()] };
}

function getGroundedReachability(vulnerabilities) {
    const reachability = new Map();
    for (const [name, item] of Object.entries(vulnerabilities)) {
        const causes = collectReachableCauses(vulnerabilities, name);
        requireAuditCondition(
            causes.leaves.length > 0,
            `Ungrounded advisory component: ${name}`
        );
        const leafRank = Math.max(
            ...causes.leaves.map((leaf) => severityRank[leaf.severity])
        );
        requireAuditCondition(
            severityRank[item.severity] === leafRank,
            `Audit severity contradicts reachable advisory causes: ${name}`
        );
        reachability.set(name, causes);
    }
    return reachability;
}

function classifyVulnerability(name, context) {
    const { report, lock, policy, threshold, reachability } = context;
    const causes = reachability.get(name);
    const relevantLeaves = causes.leaves.filter(
        (leaf) => severityRank[leaf.severity] >= threshold
    );
    const unacceptedLeaf = relevantLeaves.some(
        (leaf) => !advisoryScopeMatches(leaf, report, lock, policy)
    );
    const relevantPackages = causes.packages.filter((dependency) =>
        reachability
            .get(dependency)
            .leaves.some((leaf) => severityRank[leaf.severity] >= threshold)
    );
    const outOfScope = relevantPackages.some(
        (dependency) =>
            !lockScopeMatches(
                dependency,
                report.vulnerabilities[dependency],
                lock,
                policy
            )
    );
    return unacceptedLeaf || outOfScope ? "blocked" : "accepted";
}

function classifyReport(report, lock, policy, reachability) {
    const threshold = severityRank[policy.minimumSeverity];
    const result = { accepted: [], blocked: [], belowThreshold: [] };
    for (const [name, item] of Object.entries(report.vulnerabilities)) {
        const classification =
            severityRank[item.severity] < threshold
                ? "belowThreshold"
                : classifyVulnerability(name, {
                      report,
                      lock,
                      policy,
                      threshold,
                      reachability,
                  });
        result[classification].push(name);
    }
    for (const names of Object.values(result)) names.sort();
    return result;
}

function getAcceptedAdvisories(accepted, reachability, threshold) {
    const urls = new Set();
    for (const name of accepted) {
        for (const leaf of reachability.get(name).leaves) {
            if (severityRank[leaf.severity] >= threshold) urls.add(leaf.url);
        }
    }
    return [...urls].sort();
}

export function evaluateCapturedAudit(result, lock, policy) {
    const report = parseCapturedAudit(result);
    validateAuditReport(report, lock);
    validateAuditPolicy(policy, lock);
    const threshold = severityRank[policy.minimumSeverity];
    const rawWouldBlock = Object.values(report.vulnerabilities).some(
        (item) => severityRank[item.severity] >= threshold
    );
    requireAuditCondition(
        result.status === (rawWouldBlock ? 1 : 0),
        "Audit exit code contradicts report threshold"
    );
    const reachability = getGroundedReachability(report.vulnerabilities);
    const classified = classifyReport(report, lock, policy, reachability);
    return {
        scope: policy.scope,
        minimumSeverity: policy.minimumSeverity,
        rawStatus: result.status,
        acceptedAdvisories: getAcceptedAdvisories(
            classified.accepted,
            reachability,
            threshold
        ),
        ...classified,
    };
}

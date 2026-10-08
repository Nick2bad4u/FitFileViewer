import {
    isRecord,
    isSeverity,
    packageNameForNode,
    requireAuditCondition,
} from "./audit-report.mjs";

const scopes = Object.freeze({
    root: { minimumSeverity: "moderate", lockName: "fitfileviewer" },
    docs: { minimumSeverity: "high", lockName: "fitfileviewer-docs" },
});

function validatePolicyAdvisories(advisories) {
    requireAuditCondition(
        Array.isArray(advisories),
        "Missing policy advisories"
    );
    const urls = new Set();
    for (const advisory of advisories) {
        requireAuditCondition(isRecord(advisory), "Malformed policy advisory");
        requireAuditCondition(
            typeof advisory.name === "string" &&
                typeof advisory.range === "string",
            "Malformed policy advisory identity"
        );
        requireAuditCondition(
            isSeverity(advisory.severity),
            "Malformed policy advisory severity"
        );
        requireAuditCondition(
            typeof advisory.url === "string" && !urls.has(advisory.url),
            "Missing or duplicate policy advisory URL"
        );
        urls.add(advisory.url);
    }
}

function validatePolicyNodes(nodes) {
    requireAuditCondition(
        isRecord(nodes),
        "Missing assessed policy lock nodes"
    );
    for (const [node, identity] of Object.entries(nodes)) {
        packageNameForNode(node);
        requireAuditCondition(
            isRecord(identity),
            `Malformed policy node ${node}`
        );
        requireAuditCondition(
            typeof identity.version === "string" && identity.version.length > 0,
            `Missing assessed version for ${node}`
        );
        requireAuditCondition(
            typeof identity.integrity === "string" &&
                identity.integrity.length > 0,
            `Missing assessed integrity for ${node}`
        );
    }
}

export function validateAuditPolicy(policy, lock) {
    requireAuditCondition(isRecord(policy), "Missing audit policy");
    requireAuditCondition(
        policy.scope === "root" || policy.scope === "docs",
        "Unknown audit policy scope"
    );
    const expected = scopes[policy.scope];
    requireAuditCondition(
        policy.minimumSeverity === expected.minimumSeverity,
        "Policy changes an existing audit threshold"
    );
    requireAuditCondition(
        policy.lockName === expected.lockName &&
            lock.name === expected.lockName,
        "Wrong workspace lockfile"
    );
    requireAuditCondition(
        policy.requireDevOnly === (policy.scope === "root"),
        "Root policy must remain dev-only; docs must retain its separate build scope"
    );
    validatePolicyAdvisories(policy.advisories);
    validatePolicyNodes(policy.nodes);
}

export function lockScopeMatches(name, item, lock, policy) {
    const expectedNodes = Object.keys(policy.nodes).filter(
        (node) => packageNameForNode(node) === name
    );
    if (expectedNodes.length !== item.nodes.length) return false;
    return item.nodes.every((node) => {
        if (!Object.hasOwn(policy.nodes, node)) return false;
        const assessed = policy.nodes[node];
        const locked = lock.packages[node];
        return (
            locked.version === assessed.version &&
            locked.integrity === assessed.integrity &&
            (!policy.requireDevOnly || locked.dev === true)
        );
    });
}

export function advisoryScopeMatches(leaf, report, lock, policy) {
    const approved = policy.advisories.find((entry) => entry.url === leaf.url);
    if (!approved) return false;
    return (
        approved.name === leaf.name &&
        approved.severity === leaf.severity &&
        approved.range === leaf.range &&
        lockScopeMatches(
            leaf.name,
            report.vulnerabilities[leaf.name],
            lock,
            policy
        )
    );
}

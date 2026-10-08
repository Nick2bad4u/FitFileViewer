import fs from "node:fs";
import path from "node:path";

import { evaluateCapturedAudit } from "../../../scripts/lib/audit-evaluation.mjs";
import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

export interface Advisory {
    dependency: string;
    name: string;
    range: string;
    severity: string;
    url: string;
}

export interface Vulnerability {
    name: string;
    nodes: string[];
    severity: string;
    via: (Advisory | string)[];
}

export interface AuditFixture {
    lock: {
        lockfileVersion: number;
        name: string;
        packages: Record<
            string,
            { dev?: boolean; integrity: string; version: string }
        >;
        version: string;
    };
    policy: {
        advisories: Omit<Advisory, "dependency">[];
        lockName: string;
        minimumSeverity: string;
        nodes: Record<string, { integrity: string; version: string }>;
        requireDevOnly: boolean;
        scope: string;
    };
    report: {
        auditReportVersion: number;
        metadata: { vulnerabilities: Record<string, number> };
        vulnerabilities: Record<string, Vulnerability>;
    };
}

function readJson(file: string): unknown {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function auditFixture(scope = "root"): AuditFixture {
    const fixtureDirectory = path.join(
        repositoryRoot,
        "tests",
        "fixtures",
        "audit-policy"
    );
    return {
        report: readJson(path.join(fixtureDirectory, `${scope}.audit.json`)),
        lock: readJson(path.join(fixtureDirectory, `${scope}.lock.json`)),
        policy: readJson(
            path.join(
                repositoryRoot,
                "scripts",
                "audit-policy",
                `${scope}.json`
            )
        ),
    } as AuditFixture;
}

export function finding(fixture: AuditFixture, name: string): Vulnerability {
    const item = fixture.report.vulnerabilities[name];
    if (!item) throw new Error(`Missing test finding ${name}`);
    return item;
}

export function leaf(fixture: AuditFixture, name = "braces"): Advisory {
    const advisory = finding(fixture, name).via.find(
        (via) => typeof via !== "string"
    );
    if (!advisory) throw new Error(`Missing test advisory ${name}`);
    return advisory;
}

export function recount(fixture: AuditFixture): void {
    const counts: Record<string, number> = {
        info: 0,
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
        total: 0,
    };
    for (const item of Object.values(fixture.report.vulnerabilities)) {
        counts[item.severity] = (counts[item.severity] ?? 0) + 1;
        counts.total = (counts.total ?? 0) + 1;
    }
    fixture.report.metadata.vulnerabilities = counts;
}

export function captured(fixture: AuditFixture, overrides = {}): object {
    return {
        stdout: JSON.stringify(fixture.report),
        stderr: "",
        status: 1,
        signal: null,
        ...overrides,
    };
}

export function evaluateFixture(
    fixture: AuditFixture,
    overrides = {}
): ReturnType<typeof evaluateCapturedAudit> {
    return evaluateCapturedAudit(
        captured(fixture, overrides),
        fixture.lock,
        fixture.policy
    );
}

export function addFinding(
    fixture: AuditFixture,
    name: string,
    severity: string
): void {
    const node = `node_modules/${name}`;
    fixture.lock.packages[node] = {
        version: "1.0.0",
        integrity: "sha512-fixture",
        dev: true,
    };
    fixture.report.vulnerabilities[name] = {
        name,
        severity,
        nodes: [node],
        via: [
            {
                name,
                dependency: name,
                severity,
                range: "*",
                url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
            },
        ],
    };
    recount(fixture);
}

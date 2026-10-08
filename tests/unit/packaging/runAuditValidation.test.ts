import { describe, expect, it } from "vitest";

import { npmScriptPrecedenceWarning } from "../../../scripts/lib/audit-report.mjs";
import {
    addFinding,
    auditFixture,
    evaluateFixture,
    finding,
    leaf,
    recount,
} from "../../fixtures/audit-policy/auditFixture";

const processFailures = [
    { status: null, signal: "SIGSEGV" },
    { status: 0, signal: "SIGTERM" },
    { status: 2 },
    { error: { code: "ETIMEDOUT" } },
    { stderr: "npm error registry unavailable" },
    { status: 0 },
    { stdout: "not-json", status: 0 },
    {
        stdout: JSON.stringify({ error: { code: "EAUDITENDPOINT" } }),
        status: 0,
    },
];

describe("audit report and policy validation", () => {
    it.each(processFailures)(
        "fails closed on process or infrastructure failure %j",
        (result) => {
            expect.assertions(1);
            expect(() => evaluateFixture(auditFixture(), result)).toThrow(
                /Audit|audit/u
            );
        }
    );

    it("recognizes only the exact benign npm12 script-precedence warning", () => {
        expect.assertions(1);
        expect(
            evaluateFixture(auditFixture(), {
                stderr: `${npmScriptPrecedenceWarning}\r\n`,
            }).blocked
        ).toStrictEqual([]);
    });

    it.each([
        `${npmScriptPrecedenceWarning}\nnpm error registry unavailable`,
        `${npmScriptPrecedenceWarning}\nnpm warn unknown warning`,
        `${npmScriptPrecedenceWarning}!`,
        ` ${npmScriptPrecedenceWarning}`,
    ])("rejects additional or near-match stderr %s", (stderr) => {
        expect.assertions(1);
        expect(() => evaluateFixture(auditFixture(), { stderr })).toThrow(
            "Unexpected npm audit stderr"
        );
    });

    it("rejects an ungrounded cycle even beside an accepted sibling cause", () => {
        expect.assertions(1);
        const fixture = auditFixture();
        addFinding(fixture, "cycle-a", "high");
        addFinding(fixture, "cycle-b", "high");
        finding(fixture, "cycle-a").via = ["cycle-b"];
        finding(fixture, "cycle-b").via = ["cycle-a"];
        finding(fixture, "stylelint").via.push("cycle-a");
        expect(() => evaluateFixture(fixture)).toThrow(
            "Ungrounded advisory component"
        );
    });

    it("rejects missing advisory references", () => {
        expect.assertions(1);
        const fixture = auditFixture();
        finding(fixture, "braces").via = ["missing"];
        expect(() => evaluateFixture(fixture)).toThrow(
            "Missing advisory reference"
        );
    });

    it("rejects missing lock nodes", () => {
        expect.assertions(1);
        const fixture = auditFixture();
        delete fixture.lock.packages["node_modules/braces"];
        expect(() => evaluateFixture(fixture)).toThrow("Missing lock node");
    });

    it("rejects summary mismatches and understated propagated severities", () => {
        expect.assertions(2);
        const fixture = auditFixture();
        fixture.report.metadata.vulnerabilities.total = 0;
        expect(() => evaluateFixture(fixture)).toThrow(
            "Audit summary disagrees"
        );
        finding(fixture, "stylelint").severity = "low";
        recount(fixture);
        expect(() => evaluateFixture(fixture)).toThrow(
            "Audit severity contradicts"
        );
    });

    it("rejects threshold changes and root dev-only bypass", () => {
        expect.assertions(3);
        const fixture = auditFixture();
        fixture.policy.minimumSeverity = "high";
        expect(() => evaluateFixture(fixture)).toThrow("threshold");
        fixture.policy.minimumSeverity = "moderate";
        fixture.policy.requireDevOnly = false;
        expect(() => evaluateFixture(fixture)).toThrow("dev-only");
        Object.assign(fixture.policy, { scope: ["root"] });
        expect(() => evaluateFixture(fixture)).toThrow(
            "Unknown audit policy scope"
        );
    });

    it("rejects coerced severity arrays in nodes, advisory leaves and policy entries", () => {
        expect.assertions(3);
        const nodeFixture = auditFixture();
        Object.assign(finding(nodeFixture, "braces"), { severity: ["high"] });
        expect(() => evaluateFixture(nodeFixture)).toThrow("Unknown severity");
        const leafFixture = auditFixture();
        Object.assign(leaf(leafFixture), { severity: ["high"] });
        expect(() => evaluateFixture(leafFixture)).toThrow(
            "Malformed advisory severity"
        );
        const policyFixture = auditFixture();
        Object.assign(policyFixture.policy.advisories[0] ?? {}, {
            severity: ["high"],
        });
        expect(() => evaluateFixture(policyFixture)).toThrow(
            "Malformed policy advisory severity"
        );
    });

    it("rejects duplicate paths, unsafe paths, wrong workspace and contradictory status one", () => {
        expect.assertions(4);
        const fixture = auditFixture();
        finding(fixture, "braces").nodes.push("node_modules/braces");
        expect(() => evaluateFixture(fixture)).toThrow("Duplicate lock nodes");
        finding(fixture, "braces").nodes = ["node_modules/../braces"];
        expect(() => evaluateFixture(fixture)).toThrow("Unsafe lock node");
        const wrongLock = auditFixture();
        wrongLock.lock.name = "wrong-workspace";
        expect(() => evaluateFixture(wrongLock)).toThrow("Wrong workspace");
        const empty = auditFixture();
        empty.report.vulnerabilities = {};
        recount(empty);
        expect(() => evaluateFixture(empty)).toThrow(
            "Audit exit code contradicts"
        );
    });
});

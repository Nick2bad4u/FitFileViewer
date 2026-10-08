import { describe, expect, it } from "vitest";

import {
    addFinding,
    auditFixture,
    evaluateFixture,
    finding,
    leaf,
    recount,
} from "../../fixtures/audit-policy/auditFixture";

describe("approved audit exception scope", () => {
    it.each(["root", "docs"])(
        "accepts the assessed %s graph projection and preserves the severity threshold",
        (scope) => {
            expect.assertions(4);
            const result = evaluateFixture(auditFixture(scope));
            expect(result.blocked).toStrictEqual([]);
            expect(result.accepted).toContain("braces");
            expect(result.belowThreshold).toContain("katex");
            expect(result.minimumSeverity).toBe(
                scope === "root" ? "moderate" : "high"
            );
        }
    );

    it("accepts the real npm builder cycle when it remains grounded in sprintf-js", () => {
        expect.assertions(3);
        const fixture = auditFixture();
        expect(finding(fixture, "app-builder-lib").via).toContain(
            "dmg-builder"
        );
        expect(finding(fixture, "dmg-builder").via).toContain(
            "app-builder-lib"
        );
        expect(evaluateFixture(fixture).accepted).toContain("app-builder-lib");
    });

    it("allows a root app version-only bump without widening dependency scope", () => {
        expect.assertions(1);
        const fixture = auditFixture();
        fixture.lock.version = "30.0.3";
        expect(evaluateFixture(fixture).blocked).toStrictEqual([]);
    });

    it.each([
        "version",
        "integrity",
        "dev",
    ])(
        "blocks changed root lock %s on the leaf and its affected parents",
        (field) => {
            expect.assertions(2);
            const fixture = auditFixture();
            Object.assign(fixture.lock.packages["node_modules/braces"] ?? {}, {
                [field]: field === "dev" ? false : "changed",
            });
            const result = evaluateFixture(fixture);
            expect(result.blocked).toContain("braces");
            expect(result.blocked).toContain("stylelint");
        }
    );

    it("blocks promotion of an intermediary to production even if the leaf remains dev-only", () => {
        expect.assertions(2);
        const fixture = auditFixture();
        Object.assign(fixture.lock.packages["node_modules/micromatch"] ?? {}, {
            dev: false,
            devOptional: true,
        });
        const result = evaluateFixture(fixture);
        expect(result.blocked).toContain("micromatch");
        expect(result.blocked).toContain("stylelint");
    });

    it("blocks a newly affected docs lock node and all propagated parents", () => {
        expect.assertions(2);
        const fixture = auditFixture("docs");
        const node = "node_modules/new-consumer/node_modules/braces";
        finding(fixture, "braces").nodes.push(node);
        fixture.lock.packages[node] = {
            version: "3.0.3",
            integrity: "sha512-new",
        };
        const result = evaluateFixture(fixture);
        expect(result.blocked).toContain("braces");
        expect(result.blocked).toContain("@docusaurus/utils");
    });

    it("blocks an unassessed intermediary even when it leads to an accepted advisory", () => {
        expect.assertions(1);
        const fixture = auditFixture();
        addFinding(fixture, "new-parent", "high");
        finding(fixture, "new-parent").via = ["braces"];
        expect(evaluateFixture(fixture).blocked).toContain("new-parent");
    });

    it("blocks every mixed cascade containing a new above-threshold cause", () => {
        expect.assertions(2);
        const fixture = auditFixture();
        finding(fixture, "braces").via.push({
            ...leaf(fixture),
            url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
        });
        const result = evaluateFixture(fixture);
        expect(result.blocked).toContain("braces");
        expect(result.blocked).toContain("stylelint");
    });

    it.each(["GHSA-5p2g-fcmc-qvqq", "GHSA-w3rx-r6r6-pgpr"])(
        "does not retain obsolete image-size exception %s",
        (advisory) => {
            expect.assertions(1);
            const fixture = auditFixture("docs");
            leaf(fixture).url = `https://github.com/advisories/${advisory}`;
            expect(evaluateFixture(fixture).blocked).toContain("braces");
        }
    );

    it("preserves below-threshold causes and new below-threshold-only paths without exceptions", () => {
        expect.assertions(3);
        const fixture = auditFixture("docs");
        addFinding(fixture, "new-moderate-tool", "moderate");
        finding(fixture, "@docusaurus/utils").via.push("new-moderate-tool");
        const result = evaluateFixture(fixture);
        expect(result.blocked).toStrictEqual([]);
        expect(result.belowThreshold).toContain("new-moderate-tool");
        expect(result.belowThreshold).toContain("sprintf-js");
    });

    it("accepts status zero with only below-threshold findings while granting no exceptions", () => {
        expect.assertions(3);
        const fixture = auditFixture("docs");
        fixture.report.vulnerabilities = {
            "sprintf-js": finding(fixture, "sprintf-js"),
        };
        recount(fixture);
        const result = evaluateFixture(fixture, { status: 0 });
        expect(result.accepted).toStrictEqual([]);
        expect(result.blocked).toStrictEqual([]);
        expect(result.belowThreshold).toStrictEqual(["sprintf-js"]);
    });
});

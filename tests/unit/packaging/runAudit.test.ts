import { describe, expect, it } from "vitest";

import {
    allowedDocusaurusAuditAdvisories,
    getBlockingAuditVulnerabilities,
} from "../../../scripts/run-audit.mjs";

describe("run-audit script", () => {
    it("accepts only the known image-size advisory cascade", () => {
        expect.assertions(1);

        const auditReport = {
            vulnerabilities: {
                "@docusaurus/core": {
                    severity: "high",
                    via: ["@docusaurus/mdx-loader"],
                },
                "@docusaurus/mdx-loader": {
                    severity: "high",
                    via: ["image-size"],
                },
                "image-size": {
                    severity: "high",
                    via: [
                        {
                            url: "https://github.com/advisories/GHSA-5p2g-fcmc-qvqq",
                        },
                        {
                            url: "https://github.com/advisories/GHSA-w3rx-r6r6-pgpr",
                        },
                    ],
                },
            },
        };

        expect(
            getBlockingAuditVulnerabilities(
                auditReport,
                allowedDocusaurusAuditAdvisories
            )
        ).toStrictEqual([]);
    });

    it("still blocks unrelated high-severity advisories", () => {
        expect.assertions(1);

        const auditReport = {
            vulnerabilities: {
                "image-size": {
                    severity: "high",
                    via: [
                        {
                            url: "https://github.com/advisories/GHSA-5p2g-fcmc-qvqq",
                        },
                    ],
                },
                unsafe: {
                    severity: "critical",
                    via: [
                        {
                            url: "https://github.com/advisories/GHSA-xxxx-yyyy-zzzz",
                        },
                    ],
                },
            },
        };

        expect(
            getBlockingAuditVulnerabilities(
                auditReport,
                allowedDocusaurusAuditAdvisories
            )
        ).toStrictEqual(["unsafe"]);
    });

    it("does not let cyclic dependency metadata bypass the gate", () => {
        expect.assertions(1);

        const auditReport = {
            vulnerabilities: {
                first: { severity: "high", via: ["second"] },
                second: { severity: "high", via: ["first"] },
            },
        };

        expect(
            getBlockingAuditVulnerabilities(
                auditReport,
                allowedDocusaurusAuditAdvisories
            )
        ).toStrictEqual(["first", "second"]);
    });

    it("fails closed when npm returns an error document", () => {
        expect.assertions(1);

        expect(() =>
            getBlockingAuditVulnerabilities(
                {
                    error: {
                        code: "EAUDITENDPOINT",
                        summary:
                            "The configured registry does not support audit requests",
                    },
                },
                allowedDocusaurusAuditAdvisories
            )
        ).toThrow("npm audit reported an error instead of results");
    });
});

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { rootAppIndexHtmlPath } from "../../../scripts/lib/workspaces.mjs";

function readRootAppHtml(): string {
    return readFileSync(path.join(process.cwd(), rootAppIndexHtmlPath), "utf8");
}

function getContentSecurityPolicy(html: string): string {
    const match = html.match(
        /<meta\s+content="([^"]+)"\s+http-equiv="Content-Security-Policy"\s*\/?>/u
    );

    if (!match?.[1]) {
        throw new Error("Content-Security-Policy meta tag not found");
    }

    return match[1];
}

describe("root app HTML security policy", () => {
    it("keeps the main renderer CSP restrictive for scripts and frames", () => {
        expect.assertions(6);

        const policy = getContentSecurityPolicy(readRootAppHtml());

        expect(policy).toContain("script-src 'self' file:");
        expect(policy).toContain("script-src-attr 'none'");
        expect(policy).toContain("frame-src 'self' file:");
        expect(policy).toContain("object-src 'none'");
        expect(policy).toContain("base-uri 'none'");
        expect(policy).not.toContain("script-src 'self' file: 'unsafe-inline'");
    });

    it("keeps remote ZwiftMap content outside the Electron renderer", () => {
        expect.assertions(3);

        const html = readRootAppHtml();

        expect(html).not.toContain('src="https://zwiftmap.com/');
        expect(html).not.toContain('id="zwift_iframe"');
        expect(html).toContain('href="https://zwiftmap.com/"');
    });

    it("keeps main tabs wired to their panels with accessible button semantics", () => {
        expect.assertions(2);

        const html = readRootAppHtml();
        const tabIds = [
            "map",
            "browser",
            "altfit",
            "data",
            "chartjs",
            "summary",
            "zwift",
        ];

        expect(
            tabIds.map((tabId) => {
                const buttonPattern = new RegExp(
                    `<button[\\s\\S]*id="tab_${tabId}"[\\s\\S]*type="button"[\\s\\S]*aria-controls="content_${tabId}"[\\s\\S]*role="tab"[\\s\\S]*>[\\s\\S]*?<\\/button>`,
                    "u"
                );
                const panelPattern = new RegExp(
                    `<div[\\s\\S]*id="content_${tabId}"[\\s\\S]*aria-labelledby="tab_${tabId}"[\\s\\S]*role="tabpanel"[\\s\\S]*tabindex="0"`,
                    "u"
                );

                return {
                    buttonWired: buttonPattern.test(html),
                    panelWired: panelPattern.test(html),
                    tabId,
                };
            })
        ).toStrictEqual(
            tabIds.map((tabId) => ({
                buttonWired: true,
                panelWired: true,
                tabId,
            }))
        );
        expect(html).not.toContain(
            'class="tab-button"\n                aria-selected="false"\n                role="tab"\n                tabindex="0"'
        );
    });
});

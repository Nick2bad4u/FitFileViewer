import { readFileSync } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

import {
    rootAlternativeFitViewIndexPath,
    rootAlternativeFitViewPath,
    rootAppIndexHtmlPath,
} from "../../../scripts/lib/workspaces.mjs";

function getContentSecurityPolicy(html: string): string {
    const match =
        /<meta\s+content="(?<policy>[^"]+)"\s+http-equiv="Content-Security-Policy"\s*\/?>/v.exec(
            html
        );

    if (!match?.groups?.policy) {
        throw new Error("Content-Security-Policy meta tag not found");
    }

    return match.groups.policy;
}

function getContentSecurityPolicyDirective(
    policy: string,
    directiveName: string
): string[] {
    const directive = policy
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${directiveName} `));

    if (!directive) {
        throw new Error(
            `Content-Security-Policy directive not found: ${directiveName}`
        );
    }

    return directive.split(/\s+/v).slice(1);
}

function readAltFitBridge(): string {
    return readFileSync(
        path.join(
            process.cwd(),
            rootAlternativeFitViewPath,
            "electron-altfit-bridge.js"
        ),
        "utf8"
    );
}

function readAltFitHtml(): string {
    return readFileSync(
        path.join(process.cwd(), rootAlternativeFitViewIndexPath),
        "utf8"
    );
}

function readRootAppHtml(): string {
    return readFileSync(path.join(process.cwd(), rootAppIndexHtmlPath), "utf8");
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

    it("keeps renderer network egress restricted to explicit hosts", () => {
        expect.assertions(4);

        const policy = getContentSecurityPolicy(readRootAppHtml());
        const connectSources = getContentSecurityPolicyDirective(
            policy,
            "connect-src"
        );
        const imageSources = getContentSecurityPolicyDirective(
            policy,
            "img-src"
        );

        expect(connectSources).toStrictEqual([
            "'self'",
            "file:",
            "https://api.imgur.com",
            "https://gyazo.com",
            "https://tiles.openfreemap.org",
            "https://upload.gyazo.com",
        ]);
        expect(imageSources).toStrictEqual([
            "'self'",
            "file:",
            "data:",
            "blob:",
            "https://*.basemaps.cartocdn.com",
            "https://*.tile-cyclosm.openstreetmap.fr",
            "https://*.tile.openstreetmap.de",
            "https://*.tile.openstreetmap.fr",
            "https://*.tile.openstreetmap.org",
            "https://*.tile.opentopomap.org",
            "https://*.tile.thunderforest.com",
            "https://*.tiles.openrailwaymap.org",
            "https://server.arcgisonline.com",
            "https://tile.waymarkedtrails.org",
            "https://tiles.openfreemap.org",
            "https://tiles.openseamap.org",
        ]);
        expect(connectSources).not.toEqual(
            expect.arrayContaining([
                "https:",
                "wss:",
            ])
        );
        expect(imageSources).not.toContain("https:");
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
                    String.raw`<button[\s\S]*id="tab_${tabId}"[\s\S]*type="button"[\s\S]*aria-controls="content_${tabId}"[\s\S]*role="tab"[\s\S]*>[\s\S]*?<\/button>`,
                    "v"
                );
                const panelPattern = new RegExp(
                    String.raw`<div[\s\S]*id="content_${tabId}"[\s\S]*aria-labelledby="tab_${tabId}"[\s\S]*role="tabpanel"[\s\S]*tabindex="0"`,
                    "v"
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

    it("keeps the embedded AltFit bridge on external scripts with a restrictive CSP", () => {
        expect.assertions(8);

        const html = readAltFitHtml();
        const policy = getContentSecurityPolicy(html);

        expect(policy).toContain("default-src 'self' file:");
        expect(policy).toContain("script-src 'self' file:");
        expect(policy).toContain("connect-src 'self' file:");
        expect(policy).toContain("object-src 'none'");
        expect(policy).not.toContain("script-src 'self' file: 'unsafe-inline'");
        expect(html).toContain('src="./electron-analytics-blocker.js"');
        expect(html).toContain('src="./electron-altfit-bridge.js"');
        expect(html).not.toMatch(/<script(?:\s[^>]*)?>\s*[^\s<]/v);
    });

    it("accepts AltFit file data only from the parent frame", () => {
        expect.assertions(3);

        const bridge = readAltFitBridge();

        expect(bridge).toContain("event.source !== window.parent");
        expect(bridge).toContain("event.origin === window.location.origin");
        expect(bridge).not.toContain("innerHTML");
    });
});

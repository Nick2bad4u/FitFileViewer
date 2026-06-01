import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createStaticAssetPlan,
    screenshotNames,
    syncDocusaurusStaticAssets,
} from "../../../scripts/sync-docusaurus-static-assets.mjs";

const temporaryRoots: string[] = [];

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-sync-docusaurus-assets-")
    );
    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writePlaceholder(root: string, relativePath: string): void {
    const targetPath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, relativePath);
}

function getPathStates(
    root: string,
    relativePaths: string[]
): Record<string, "missing" | "present"> {
    return Object.fromEntries(
        relativePaths.map((relativePath) => [
            relativePath,
            fs.existsSync(path.join(root, relativePath))
                ? "present"
                : "missing",
        ])
    );
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("sync-docusaurus-static-assets script", () => {
    it("builds the static asset plan from centralized workspace names", () => {
        expect.assertions(4);

        const temporaryRoot = makeTemporaryRoot();
        const plan = createStaticAssetPlan(temporaryRoot);

        expect(plan.staticAssets).toStrictEqual([
            {
                source: path.join(
                    temporaryRoot,
                    "static",
                    "icons",
                    "favicon.ico"
                ),
                target: path.join(
                    temporaryRoot,
                    "docusaurus",
                    "static",
                    "favicon.ico"
                ),
            },
        ]);
        expect(plan.screenshotSourceDir).toBe(
            path.join(temporaryRoot, "docs", "screenshots")
        );
        expect(plan.screenshotTargetDir).toBe(
            path.join(
                temporaryRoot,
                "docusaurus",
                "static",
                "img",
                "screenshots"
            )
        );
        expect(plan.screenshotNames).toStrictEqual(screenshotNames);
    });

    it("copies the canonical favicon and screenshots into Docusaurus static output", () => {
        expect.assertions(1);

        const temporaryRoot = makeTemporaryRoot();
        const logger = vi.fn<(message: string) => void>();
        const screenshotTargets = screenshotNames.map((screenshotName) =>
            path.join(
                "docusaurus",
                "static",
                "img",
                "screenshots",
                screenshotName
            )
        );
        const syncedTargets = [
            path.join("docusaurus", "static", "favicon.ico"),
            ...screenshotTargets,
        ];
        const expectedPathStates = Object.fromEntries(
            syncedTargets.map((target) => [target, "present"])
        );

        writePlaceholder(
            temporaryRoot,
            path.join("static", "icons", "favicon.ico")
        );

        for (const screenshotName of screenshotNames) {
            writePlaceholder(
                temporaryRoot,
                path.join("docs", "screenshots", screenshotName)
            );
        }

        const syncedCount = syncDocusaurusStaticAssets(temporaryRoot, logger);

        expect({
            faviconContent: fs.readFileSync(
                path.join(temporaryRoot, "docusaurus", "static", "favicon.ico"),
                "utf8"
            ),
            logMessages: logger.mock.calls.map(([message]) => message),
            pathStates: getPathStates(temporaryRoot, syncedTargets),
            syncedCount,
        }).toStrictEqual({
            faviconContent: path.join("static", "icons", "favicon.ico"),
            logMessages: [
                "[sync-docusaurus-static-assets] Synced 4 static assets.",
            ],
            pathStates: expectedPathStates,
            syncedCount: 4,
        });
    });

    it("throws when a canonical screenshot is missing", () => {
        expect.assertions(3);

        const temporaryRoot = makeTemporaryRoot();
        const logger = vi.fn<(message: string) => void>();

        writePlaceholder(
            temporaryRoot,
            path.join("static", "icons", "favicon.ico")
        );

        expect(() => syncDocusaurusStaticAssets(temporaryRoot, logger)).toThrow(
            `Missing canonical screenshot: ${path.join(temporaryRoot, "docs", "screenshots", screenshotNames[0] ?? "")}`
        );
        expect(
            getPathStates(temporaryRoot, [
                path.join(
                    "docusaurus",
                    "static",
                    "img",
                    "screenshots",
                    screenshotNames[0] ?? ""
                ),
            ])
        ).toStrictEqual({
            [path.join(
                "docusaurus",
                "static",
                "img",
                "screenshots",
                screenshotNames[0] ?? ""
            )]: "missing",
        });
        expect(logger).not.toHaveBeenCalled();
    });

    it("throws before logging when the canonical favicon is missing", () => {
        expect.assertions(3);

        const temporaryRoot = makeTemporaryRoot();
        const logger = vi.fn<(message: string) => void>();

        expect(() => syncDocusaurusStaticAssets(temporaryRoot, logger)).toThrow(
            `Missing canonical static asset: ${path.join(temporaryRoot, "static", "icons", "favicon.ico")}`
        );
        expect(
            getPathStates(temporaryRoot, [
                path.join("docusaurus", "static", "favicon.ico"),
            ])
        ).toStrictEqual({
            [path.join("docusaurus", "static", "favicon.ico")]: "missing",
        });
        expect(logger).not.toHaveBeenCalled();
    });
});

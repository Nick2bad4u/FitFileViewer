import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusStaticFaviconPath,
    docusaurusStaticScreenshotsPath,
    repositoryRoot,
    rootAppFaviconPath,
    rootDocsScreenshotsPath,
} from "./lib/workspaces.mjs";

export const screenshotNames = [
    "MapsV2.png",
    "DataV2.png",
    "ChartsV3.png",
];

export function createStaticAssetPlan(root = repositoryRoot) {
    const screenshotSourceDir = path.join(root, rootDocsScreenshotsPath);
    const screenshotTargetDir = path.join(
        root,
        docusaurusStaticScreenshotsPath
    );

    return {
        screenshotNames,
        screenshotSourceDir,
        screenshotTargetDir,
        staticAssets: [
            {
                source: path.join(root, rootAppFaviconPath),
                target: path.join(root, docusaurusStaticFaviconPath),
            },
        ],
    };
}

export function syncDocusaurusStaticAssets(
    root = repositoryRoot,
    logger = console.log
) {
    const plan = createStaticAssetPlan(root);

    fs.mkdirSync(plan.screenshotTargetDir, { recursive: true });

    for (const { source, target } of plan.staticAssets) {
        if (!fs.existsSync(source)) {
            throw new Error(`Missing canonical static asset: ${source}`);
        }

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
    }

    for (const screenshotName of plan.screenshotNames) {
        const sourcePath = path.join(plan.screenshotSourceDir, screenshotName);
        const targetPath = path.join(plan.screenshotTargetDir, screenshotName);

        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Missing canonical screenshot: ${sourcePath}`);
        }

        fs.copyFileSync(sourcePath, targetPath);
    }

    const syncedCount = plan.staticAssets.length + plan.screenshotNames.length;

    logger(
        `[sync-docusaurus-static-assets] Synced ${syncedCount} static assets.`
    );

    return syncedCount;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    syncDocusaurusStaticAssets();
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const staticAssets = [
    {
        source: path.join(
            repositoryRoot,
            "electron-app",
            "icons",
            "favicon.ico"
        ),
        target: path.join(
            repositoryRoot,
            "docusaurus",
            "static",
            "favicon.ico"
        ),
    },
];
const screenshotNames = [
    "MapsV2.png",
    "DataV2.png",
    "ChartsV3.png",
];
const sourceDir = path.join(repositoryRoot, "docs", "screenshots");
const targetDir = path.join(
    repositoryRoot,
    "docusaurus",
    "static",
    "img",
    "screenshots"
);

fs.mkdirSync(targetDir, { recursive: true });

for (const { source, target } of staticAssets) {
    if (!fs.existsSync(source)) {
        throw new Error(`Missing canonical static asset: ${source}`);
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
}

for (const screenshotName of screenshotNames) {
    const sourcePath = path.join(sourceDir, screenshotName);
    const targetPath = path.join(targetDir, screenshotName);

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Missing canonical screenshot: ${sourcePath}`);
    }

    fs.copyFileSync(sourcePath, targetPath);
}

console.log(
    `[sync-docusaurus-static-assets] Synced ${
        staticAssets.length + screenshotNames.length
    } static assets.`
);

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    docusaurusApiDocsPath,
    docusaurusBuildPath,
    docusaurusCachePath,
    docusaurusStaticFaviconPath,
    docusaurusStaticImageCoverageJsonPath,
    docusaurusStaticImageCoverageSvgPath,
    docusaurusStaticImageFaviconPath,
    docusaurusStaticScreenshotsPath,
    repositoryRoot,
    rootArtifactsPath,
    rootCoveragePath,
    rootFlatpakBuildPath,
    rootFlatpakBundlePath,
    rootFlatpakRepoPath,
    rootFlatpakZipPath,
    rootDocsScreenshotNames,
    rootReleaseDistPath,
    rootRuntimeDistPath,
    rootTypesPath,
} from "./lib/workspaces.mjs";

export const cleanupTargets = [
    ".cache",
    ".eslintcache",
    ".prettier-cache",
    ".stylelintcache",
    docusaurusCachePath,
    docusaurusBuildPath,
    docusaurusApiDocsPath,
    docusaurusStaticFaviconPath,
    docusaurusStaticImageFaviconPath,
    docusaurusStaticImageCoverageJsonPath,
    docusaurusStaticImageCoverageSvgPath,
    ...rootDocsScreenshotNames.map((screenshotName) =>
        path.join(docusaurusStaticScreenshotsPath, screenshotName)
    ),
    rootFlatpakBundlePath,
    rootFlatpakZipPath,
    rootArtifactsPath,
    rootFlatpakBuildPath,
    rootFlatpakRepoPath,
    rootCoveragePath,
    rootRuntimeDistPath,
    "html",
    "logs",
    "out",
    "playwright-report",
    rootReleaseDistPath,
    "temp",
    "test-results",
    rootTypesPath,
];

export function cleanWorkspace(
    root = repositoryRoot,
    targets = cleanupTargets
) {
    const removedTargets = [];
    const targetPaths = targets.map((relativeTarget) => {
        const targetPath = path.join(root, relativeTarget);
        assertInsideRepository(root, targetPath);

        return {
            relativeTarget,
            targetPath,
        };
    });

    for (const { relativeTarget, targetPath } of targetPaths) {
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { force: true, recursive: true });
            removedTargets.push(relativeTarget);
        }
    }

    return removedTargets;
}

function assertInsideRepository(root, targetPath) {
    const relativePath = path.relative(root, path.resolve(targetPath));

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to remove outside repository: ${targetPath}`);
    }
}

function printCleanupResult(removedTargets) {
    if (removedTargets.length > 0) {
        console.log(
            `[clean-workspace] Removed generated paths: ${removedTargets.join(", ")}`
        );
    } else {
        console.log("[clean-workspace] No generated paths to remove.");
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    printCleanupResult(cleanWorkspace());
}

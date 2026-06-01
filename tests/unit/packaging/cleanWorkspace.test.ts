import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
    appCoveragePath,
    appDistPath,
    appTypesPath,
    appSourceRelativePath,
    docusaurusApiDocsPath,
    docusaurusBuildPath,
    docusaurusCachePath,
    docusaurusStaticFaviconPath,
    docusaurusStaticImageFaviconPath,
    docusaurusStaticScreenshotsPath,
    rootArtifactsPath,
    rootCoveragePath,
    rootFlatpakBuildPath,
    rootFlatpakBundlePath,
    rootFlatpakRepoPath,
    rootFlatpakZipPath,
    rootReleaseDistPath,
} from "../../../scripts/lib/workspaces.mjs";

type CleanWorkspaceModule = {
    cleanWorkspace: (root?: string, targets?: string[]) => string[];
    cleanupTargets: string[];
};

const temporaryRoots: string[] = [];

async function importCleanWorkspace(): Promise<CleanWorkspaceModule> {
    return (await import("../../../scripts/clean-workspace.mjs")) as CleanWorkspaceModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-clean-workspace-")
    );
    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writePlaceholder(root: string, relativePath: string): void {
    const targetPath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, "generated");
}

function getTargetExistence(
    root: string,
    targets: string[]
): Record<string, boolean> {
    return Object.fromEntries(
        targets.map((target) => [
            target,
            fs.existsSync(path.join(root, target)),
        ])
    );
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("clean-workspace script", () => {
    it("keeps high-value generated outputs in the cleanup target list", async () => {
        expect.assertions(1);

        const { cleanupTargets } = await importCleanWorkspace();

        expect(cleanupTargets).toStrictEqual([
            ".cache",
            ".eslintcache",
            ".prettier-cache",
            ".stylelintcache",
            docusaurusCachePath,
            docusaurusBuildPath,
            docusaurusApiDocsPath,
            docusaurusStaticFaviconPath,
            docusaurusStaticImageFaviconPath,
            path.join(docusaurusStaticScreenshotsPath, "ChartsV3.png"),
            path.join(docusaurusStaticScreenshotsPath, "DataV2.png"),
            path.join(docusaurusStaticScreenshotsPath, "MapsV2.png"),
            rootFlatpakBundlePath,
            rootFlatpakZipPath,
            rootArtifactsPath,
            rootFlatpakBuildPath,
            rootFlatpakRepoPath,
            rootCoveragePath,
            "dist",
            "html",
            "logs",
            "out",
            "playwright-report",
            rootReleaseDistPath,
            "temp",
            "test-results",
            appCoveragePath,
            appDistPath,
            appTypesPath,
        ]);
    });

    it("does not keep stale nested Electron app generated directories", async () => {
        expect.assertions(1);

        const { cleanupTargets } = await importCleanWorkspace();

        expect(
            cleanupTargets.filter((target) =>
                [
                    appSourceRelativePath("html"),
                    appSourceRelativePath("logs"),
                    appSourceRelativePath("release"),
                    appSourceRelativePath("temp-win7"),
                ].includes(target)
            )
        ).toStrictEqual([]);
    });

    it("keeps stale nested Electron app generated directories out of gitignore", () => {
        expect.assertions(1);

        const gitignore = fs.readFileSync(
            path.join(process.cwd(), ".gitignore"),
            "utf8"
        );

        expect(gitignore).not.toMatch(
            /electron-app\/(?:html|logs|release|temp-win7)\/?/u
        );
    });

    it("does not treat dependency installs or local editor state as generated cleanup targets", async () => {
        expect.assertions(1);

        const { cleanupTargets } = await importCleanWorkspace();

        expect(
            cleanupTargets.filter((target) =>
                [
                    ".vscode/mcp.json",
                    "docusaurus/node_modules",
                    "node_modules",
                    "package-lock.json",
                ].includes(target)
            )
        ).toStrictEqual([]);
    });

    it("removes generated files and directories under the selected workspace root", async () => {
        expect.assertions(4);

        const { cleanWorkspace } = await importCleanWorkspace();
        const temporaryRoot = makeTemporaryRoot();
        const targets = [
            ".cache",
            ".eslintcache",
            ".prettier-cache",
            ".stylelintcache",
            rootFlatpakBundlePath,
            rootArtifactsPath,
            rootFlatpakRepoPath,
            rootReleaseDistPath,
            "dist",
            "logs",
            "out",
            "temp",
            appDistPath,
            docusaurusBuildPath,
        ];
        const unrelatedFile = "README.md";

        for (const target of targets) {
            writePlaceholder(temporaryRoot, target);
        }
        writePlaceholder(temporaryRoot, unrelatedFile);

        expect(getTargetExistence(temporaryRoot, targets)).toStrictEqual(
            Object.fromEntries(targets.map((target) => [target, true]))
        );

        const removedTargets = cleanWorkspace(temporaryRoot, targets);

        expect(removedTargets).toStrictEqual(targets);
        expect(getTargetExistence(temporaryRoot, targets)).toStrictEqual(
            Object.fromEntries(targets.map((target) => [target, false]))
        );
        expect(
            fs.readFileSync(path.join(temporaryRoot, unrelatedFile), "utf8")
        ).toBe("generated");
    });

    it("refuses cleanup targets that resolve outside the selected root", async () => {
        expect.assertions(4);

        const { cleanWorkspace } = await importCleanWorkspace();
        const temporaryRoot = makeTemporaryRoot();
        const neighboringRoot = makeTemporaryRoot();
        const neighboringFile = "neighbor.txt";
        writePlaceholder(temporaryRoot, "inside.txt");
        writePlaceholder(neighboringRoot, neighboringFile);

        expect(() => cleanWorkspace(temporaryRoot, [".."])).toThrow(
            `Refusing to remove outside repository: ${path.join(temporaryRoot, "..")}`
        );
        expect(() => cleanWorkspace(temporaryRoot, ["."])).toThrow(
            `Refusing to remove outside repository: ${path.join(temporaryRoot, ".")}`
        );
        expect(
            fs.readFileSync(path.join(temporaryRoot, "inside.txt"), "utf8")
        ).toBe("generated");
        expect(
            fs.readFileSync(path.join(neighboringRoot, neighboringFile), "utf8")
        ).toBe("generated");
    });

    it("validates all cleanup targets before removing any generated path", async () => {
        expect.assertions(3);

        const { cleanWorkspace } = await importCleanWorkspace();
        const temporaryRoot = makeTemporaryRoot();
        const generatedFile = ".cache/cache-entry.txt";
        writePlaceholder(temporaryRoot, generatedFile);

        expect(() => cleanWorkspace(temporaryRoot, [".cache", ".."])).toThrow(
            `Refusing to remove outside repository: ${path.join(temporaryRoot, "..")}`
        );
        expect(
            fs.readFileSync(path.join(temporaryRoot, generatedFile), "utf8")
        ).toBe("generated");
        expect(fs.existsSync(path.join(temporaryRoot, ".cache"))).toBe(true);
    });
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

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

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("clean-workspace script", () => {
    it("keeps high-value generated outputs in the cleanup target list", async () => {
        expect.assertions(1);

        const { cleanupTargets } = await importCleanWorkspace();

        expect(cleanupTargets).toEqual(
            expect.arrayContaining([
                "FitFileViewer.flatpak",
                "FitFileViewer.flatpak.zip",
                "flatpak-build-dir",
                "flatpak-repo",
                "html",
                path.join("electron-app", "dist"),
                path.join("electron-app", "types"),
                "playwright-report",
                "test-results",
            ])
        );
    });

    it("removes generated files and directories under the selected workspace root", async () => {
        expect.assertions(6);

        const { cleanWorkspace } = await importCleanWorkspace();
        const temporaryRoot = makeTemporaryRoot();
        const targets = [
            "FitFileViewer.flatpak",
            "flatpak-repo",
            path.join("electron-app", "dist"),
        ];
        const unrelatedFile = "README.md";

        for (const target of targets) {
            writePlaceholder(temporaryRoot, target);
        }
        writePlaceholder(temporaryRoot, unrelatedFile);

        expect(
            targets.every((target) =>
                fs.existsSync(path.join(temporaryRoot, target))
            )
        ).toBe(true);

        const removedTargets = cleanWorkspace(temporaryRoot, targets);

        expect(removedTargets).toStrictEqual(targets);
        for (const target of targets) {
            expect(fs.existsSync(path.join(temporaryRoot, target))).toBe(false);
        }
        expect(fs.existsSync(path.join(temporaryRoot, unrelatedFile))).toBe(
            true
        );
    });

    it("refuses cleanup targets that resolve outside the selected root", async () => {
        expect.assertions(1);

        const { cleanWorkspace } = await importCleanWorkspace();
        const temporaryRoot = makeTemporaryRoot();

        expect(() => cleanWorkspace(temporaryRoot, [".."])).toThrow(
            "Refusing to remove outside repository"
        );
    });
});

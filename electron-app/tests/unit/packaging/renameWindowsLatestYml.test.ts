import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type RenameWindowsLatestYmlModule = {
    defaultArtifactsDirectory: string;
    parseArgs: (args: string[]) => {
        artifactsDirectory: string;
        help: boolean;
    };
    renameRules: { from: string; to: string }[];
    renameWindowsLatestYml: (
        artifactsDirectory?: string
    ) => { from: string; to: string }[];
};

const temporaryRoots: string[] = [];

async function importRenameWindowsLatestYml(): Promise<RenameWindowsLatestYmlModule> {
    return (await import("../../../../scripts/rename-windows-latest-yml.mjs")) as RenameWindowsLatestYmlModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-rename-windows-latest-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writeArtifact(root: string, relativePath: string): void {
    const filePath = path.join(root, relativePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "latest");
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("rename-windows-latest-yml script", () => {
    it("keeps Windows updater rename rules centralized", async () => {
        expect.assertions(1);

        const { renameRules } = await importRenameWindowsLatestYml();

        expect(renameRules).toStrictEqual([
            {
                from: path.join("dist-windows-latest-ia32", "latest.yml"),
                to: path.join("dist-windows-latest-ia32", "latest-win32.yml"),
            },
            {
                from: path.join(
                    "dist-windows-latest-ia32",
                    "nsis-web",
                    "latest.yml"
                ),
                to: path.join(
                    "dist-windows-latest-ia32",
                    "nsis-web",
                    "latest-nsis-web-win32.yml"
                ),
            },
            {
                from: path.join(
                    "dist-windows-latest-x64",
                    "nsis-web",
                    "latest.yml"
                ),
                to: path.join(
                    "dist-windows-latest-x64",
                    "nsis-web",
                    "latest-nsis-web.yml"
                ),
            },
        ]);
    });

    it("renames only Windows latest.yml files that exist", async () => {
        expect.assertions(7);

        const { renameWindowsLatestYml } = await importRenameWindowsLatestYml();
        const artifactsRoot = makeTemporaryRoot();

        writeArtifact(
            artifactsRoot,
            path.join("dist-windows-latest-ia32", "latest.yml")
        );
        writeArtifact(
            artifactsRoot,
            path.join("dist-windows-latest-x64", "nsis-web", "latest.yml")
        );

        const renamedFiles = renameWindowsLatestYml(artifactsRoot);

        expect(renamedFiles).toHaveLength(2);
        expect(
            fs.existsSync(
                path.join(
                    artifactsRoot,
                    "dist-windows-latest-ia32",
                    "latest.yml"
                )
            )
        ).toBe(false);
        expect(
            fs.existsSync(
                path.join(
                    artifactsRoot,
                    "dist-windows-latest-ia32",
                    "latest-win32.yml"
                )
            )
        ).toBe(true);
        expect(
            fs.existsSync(
                path.join(
                    artifactsRoot,
                    "dist-windows-latest-x64",
                    "nsis-web",
                    "latest.yml"
                )
            )
        ).toBe(false);
        expect(
            fs.existsSync(
                path.join(
                    artifactsRoot,
                    "dist-windows-latest-x64",
                    "nsis-web",
                    "latest-nsis-web.yml"
                )
            )
        ).toBe(true);
        expect(renamedFiles[0]?.to).toContain("latest-win32.yml");
        expect(renamedFiles[1]?.to).toContain("latest-nsis-web.yml");
    });

    it("returns an empty result when no matching files exist", async () => {
        expect.assertions(1);

        const { renameWindowsLatestYml } = await importRenameWindowsLatestYml();

        expect(renameWindowsLatestYml(makeTemporaryRoot())).toStrictEqual([]);
    });

    it("parses the artifacts directory argument", async () => {
        expect.assertions(2);

        const { defaultArtifactsDirectory, parseArgs } =
            await importRenameWindowsLatestYml();

        expect(parseArgs([])).toStrictEqual({
            artifactsDirectory: defaultArtifactsDirectory,
            help: false,
        });
        expect(
            parseArgs(["--artifacts-directory=tmp/artifacts"])
        ).toStrictEqual({
            artifactsDirectory: "tmp/artifacts",
            help: false,
        });
    });

    it("rejects missing artifacts directory values", async () => {
        expect.assertions(1);

        const { parseArgs } = await importRenameWindowsLatestYml();

        expect(() => parseArgs(["--artifacts-directory"])).toThrow(
            "--artifacts-directory requires a value"
        );
    });
});

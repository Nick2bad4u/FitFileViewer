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
    return (await import("../../../scripts/rename-windows-latest-yml.mjs")) as RenameWindowsLatestYmlModule;
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
        expect.assertions(1);

        const { renameWindowsLatestYml } = await importRenameWindowsLatestYml();
        const artifactsRoot = makeTemporaryRoot();
        const sourceIa32 = path.join("dist-windows-latest-ia32", "latest.yml");
        const destinationIa32 = path.join(
            "dist-windows-latest-ia32",
            "latest-win32.yml"
        );
        const sourceX64Nsis = path.join(
            "dist-windows-latest-x64",
            "nsis-web",
            "latest.yml"
        );
        const destinationX64Nsis = path.join(
            "dist-windows-latest-x64",
            "nsis-web",
            "latest-nsis-web.yml"
        );

        writeArtifact(artifactsRoot, sourceIa32);
        writeArtifact(artifactsRoot, sourceX64Nsis);

        const renamedFiles = renameWindowsLatestYml(artifactsRoot);

        expect({
            pathStates: getPathStates(artifactsRoot, [
                sourceIa32,
                destinationIa32,
                sourceX64Nsis,
                destinationX64Nsis,
            ]),
            renamedFiles: renamedFiles.map(({ from, to }) => ({
                from: path.basename(from),
                to: path.basename(to),
            })),
        }).toStrictEqual({
            pathStates: {
                [destinationIa32]: "present",
                [destinationX64Nsis]: "present",
                [sourceIa32]: "missing",
                [sourceX64Nsis]: "missing",
            },
            renamedFiles: [
                { from: "latest.yml", to: "latest-win32.yml" },
                { from: "latest.yml", to: "latest-nsis-web.yml" },
            ],
        });
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

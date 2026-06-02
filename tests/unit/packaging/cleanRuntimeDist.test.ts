import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
    repositoryRoot,
    rootRuntimeDistAbsolutePath,
    rootRuntimeDistPath,
} from "../../../scripts/lib/workspaces.mjs";

type CleanRuntimeDistModule = {
    assertInsideRepository: (targetPath: string, root?: string) => void;
    cleanRuntimeDist: (options?: {
        distPath?: string;
        fileSystem?: {
            rmSync: (
                targetPath: string,
                options: { force: boolean; recursive: boolean }
            ) => void;
        };
        root?: string;
    }) => string;
    defaultRuntimeDistPath: string;
};

async function importCleanRuntimeDist(): Promise<CleanRuntimeDistModule> {
    return (await import("../../../scripts/clean-runtime-dist.mjs")) as CleanRuntimeDistModule;
}

describe("clean-runtime-dist script", () => {
    it("defaults to the root runtime dist path", async () => {
        expect.assertions(1);

        const { defaultRuntimeDistPath } = await importCleanRuntimeDist();

        expect({
            absolutePath: defaultRuntimeDistPath,
            isNestedElectronAppDist: defaultRuntimeDistPath.includes(
                `${path.sep}electron-app${path.sep}`
            ),
            repositoryPath: path.relative(
                repositoryRoot,
                defaultRuntimeDistPath
            ),
        }).toStrictEqual({
            absolutePath: rootRuntimeDistAbsolutePath,
            isNestedElectronAppDist: false,
            repositoryPath: rootRuntimeDistPath,
        });
    });

    it("removes only the configured runtime dist directory", async () => {
        expect.assertions(2);

        const { cleanRuntimeDist } = await importCleanRuntimeDist();
        const distPath = path.join(repositoryRoot, "dist");
        const fileSystem = {
            rmSync: vi.fn<
                (
                    targetPath: string,
                    options: { force: boolean; recursive: boolean }
                ) => void
            >(),
        };

        const removedPath = cleanRuntimeDist({
            distPath,
            fileSystem,
        });

        expect(removedPath).toBe(distPath);
        expect(fileSystem.rmSync).toHaveBeenCalledExactlyOnceWith(distPath, {
            force: true,
            recursive: true,
        });
    });

    it("refuses to remove the repository root or paths outside it", async () => {
        expect.assertions(3);

        const { cleanRuntimeDist } = await importCleanRuntimeDist();
        const fileSystem = {
            rmSync: vi.fn<
                (
                    targetPath: string,
                    options: { force: boolean; recursive: boolean }
                ) => void
            >(),
        };
        const outsidePath = path.join(repositoryRoot, "..", "outside-dist");

        expect(() =>
            cleanRuntimeDist({ distPath: repositoryRoot, fileSystem })
        ).toThrow(`Refusing to remove outside repository: ${repositoryRoot}`);
        expect(() =>
            cleanRuntimeDist({ distPath: outsidePath, fileSystem })
        ).toThrow(`Refusing to remove outside repository: ${outsidePath}`);
        expect(fileSystem.rmSync).not.toHaveBeenCalled();
    });
});

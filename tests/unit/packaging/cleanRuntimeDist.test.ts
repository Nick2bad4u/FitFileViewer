import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
    appDistAbsolutePath,
    appSourceDirectoryName,
    repositoryRoot,
} from "../../../scripts/lib/workspaces.mjs";

type CleanRuntimeDistModule = {
    assertInsideAppSource: (targetPath: string, appRoot?: string) => void;
    cleanRuntimeDist: (options?: {
        appRoot?: string;
        distPath?: string;
        fileSystem?: {
            rmSync: (
                targetPath: string,
                options: { force: boolean; recursive: boolean }
            ) => void;
        };
    }) => string;
    defaultRuntimeDistPath: string;
};

async function importCleanRuntimeDist(): Promise<CleanRuntimeDistModule> {
    return (await import("../../../scripts/clean-runtime-dist.mjs")) as CleanRuntimeDistModule;
}

describe("clean-runtime-dist script", () => {
    it("defaults to the root-owned Electron app dist path", async () => {
        expect.assertions(1);

        const { defaultRuntimeDistPath } = await importCleanRuntimeDist();

        expect(defaultRuntimeDistPath).toBe(appDistAbsolutePath);
    });

    it("removes only the configured runtime dist directory", async () => {
        expect.assertions(2);

        const { cleanRuntimeDist } = await importCleanRuntimeDist();
        const appRoot = path.join(repositoryRoot, appSourceDirectoryName);
        const distPath = path.join(appRoot, "dist");
        const fileSystem = {
            rmSync: vi.fn<
                (
                    targetPath: string,
                    options: { force: boolean; recursive: boolean }
                ) => void
            >(),
        };

        const removedPath = cleanRuntimeDist({
            appRoot,
            distPath,
            fileSystem,
        });

        expect(removedPath).toBe(distPath);
        expect(fileSystem.rmSync).toHaveBeenCalledExactlyOnceWith(distPath, {
            force: true,
            recursive: true,
        });
    });

    it("refuses to remove the app root or paths outside it", async () => {
        expect.assertions(3);

        const { cleanRuntimeDist } = await importCleanRuntimeDist();
        const appRoot = path.join(repositoryRoot, appSourceDirectoryName);
        const fileSystem = {
            rmSync: vi.fn<
                (
                    targetPath: string,
                    options: { force: boolean; recursive: boolean }
                ) => void
            >(),
        };
        const outsidePath = path.join(repositoryRoot, "dist");

        expect(() =>
            cleanRuntimeDist({ appRoot, distPath: appRoot, fileSystem })
        ).toThrow(
            `Refusing to remove outside ${appSourceDirectoryName}: ${appRoot}`
        );
        expect(() =>
            cleanRuntimeDist({ appRoot, distPath: outsidePath, fileSystem })
        ).toThrow(
            `Refusing to remove outside ${appSourceDirectoryName}: ${outsidePath}`
        );
        expect(fileSystem.rmSync).not.toHaveBeenCalled();
    });
});

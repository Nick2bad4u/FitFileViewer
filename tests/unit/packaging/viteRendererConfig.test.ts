import { describe, expect, it } from "vitest";

import {
    appRendererVendorChartDataEntryPath,
    appRendererVendorCoreEntryPath,
    appRendererVendorMapEntryPath,
    rendererVendorChartDataBundleName,
    rendererVendorCoreBundleName,
    rendererVendorMapBundleName,
    repositoryRoot,
    rootRuntimeRendererRepositoryPath,
} from "../../../scripts/lib/workspaces.mjs";

type ViteRendererConfigModule = {
    default: {
        build?: {
            emptyOutDir?: boolean;
            lib?: {
                entry?: string;
                fileName?: () => string;
                formats?: string[];
            };
            outDir?: string;
        };
        publicDir?: boolean;
        resolve?: {
            alias?: unknown;
        };
        root?: string;
    };
};

async function importViteRendererConfig(): Promise<ViteRendererConfigModule> {
    return (await import("../../../vite.renderer.config.mjs")) as ViteRendererConfigModule;
}

describe("renderer Vite config", () => {
    it("roots renderer bundling in the repository while outputting into root dist", async () => {
        expect.assertions(2);

        const { default: config } = await importViteRendererConfig();

        expect(config.root).not.toBe("electron-app");
        expect({
            emptyOutDir: config.build?.emptyOutDir,
            entry: config.build?.lib?.entry,
            fileName:
                typeof config.build?.lib?.fileName === "function"
                    ? config.build.lib.fileName("es", "example-entry")
                    : undefined,
            outDir: config.build?.outDir,
            publicDir: config.publicDir,
            resolveAlias: config.resolve?.alias,
            root: config.root,
        }).toStrictEqual({
            emptyOutDir: false,
            entry: {
                [rendererVendorChartDataBundleName]:
                    appRendererVendorChartDataEntryPath,
                [rendererVendorCoreBundleName]:
                    appRendererVendorCoreEntryPath,
                [rendererVendorMapBundleName]:
                    appRendererVendorMapEntryPath,
            },
            fileName: "example-entry.js",
            outDir: rootRuntimeRendererRepositoryPath,
            publicDir: false,
            resolveAlias: undefined,
            root: repositoryRoot,
        });
    });
});

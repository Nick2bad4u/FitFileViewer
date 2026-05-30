import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

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
    it("roots renderer bundling in the repository while outputting into the app dist", async () => {
        expect.assertions(2);

        const { default: config } = await importViteRendererConfig();

        expect(config.root).not.toBe("electron-app");
        expect({
            emptyOutDir: config.build?.emptyOutDir,
            entry: config.build?.lib?.entry,
            fileName: config.build?.lib?.fileName?.(),
            outDir: config.build?.outDir,
            publicDir: config.publicDir,
            resolveAlias: config.resolve?.alias,
            root: config.root,
        }).toStrictEqual({
            emptyOutDir: false,
            entry: "electron-app/renderer/vendorGlobals.ts",
            fileName: "vendor-globals.js",
            outDir: "electron-app/dist/renderer",
            publicDir: false,
            resolveAlias: undefined,
            root: repositoryRoot,
        });
    });
});

import path from "node:path";

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
            alias?: Record<string, string>;
        };
        root?: string;
    };
};

async function importViteRendererConfig(): Promise<ViteRendererConfigModule> {
    return (await import("../../../vite.renderer.config.mjs")) as ViteRendererConfigModule;
}

describe("renderer Vite config", () => {
    it("roots renderer bundling in the repository while outputting into the app dist", async () => {
        expect.assertions(8);

        const { default: config } = await importViteRendererConfig();

        expect(config.root).toBe(repositoryRoot);
        expect(config.root).not.toBe("electron-app");
        expect(config.publicDir).toBe(false);
        expect(config.build?.emptyOutDir).toBe(false);
        expect(config.build?.outDir).toBe("electron-app/dist/renderer");
        expect(config.build?.lib?.entry).toBe(
            "electron-app/renderer/vendorGlobals.ts"
        );
        expect(config.build?.lib?.fileName?.()).toBe("vendor-globals.js");
        expect(config.resolve?.alias?.["@ffv-vendor"]).toBe(
            path.join(repositoryRoot, "vendor")
        );
    });
});

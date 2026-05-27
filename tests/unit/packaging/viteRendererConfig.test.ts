import { describe, expect, it } from "vitest";

import {
    appWorkspacePath,
    repositoryRoot,
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
        root?: string;
    };
};

async function importViteRendererConfig(): Promise<ViteRendererConfigModule> {
    return (await import("../../../vite.renderer.config.mjs")) as ViteRendererConfigModule;
}

describe("renderer Vite config", () => {
    it("roots renderer bundling in the centralized app workspace path", async () => {
        expect.assertions(7);

        const { default: config } = await importViteRendererConfig();

        expect(config.root).toBe(appWorkspacePath);
        expect(config.root).not.toBe(repositoryRoot);
        expect(config.publicDir).toBe(false);
        expect(config.build?.emptyOutDir).toBe(false);
        expect(config.build?.outDir).toBe("dist/renderer");
        expect(config.build?.lib?.entry).toBe("renderer/vendorGlobals.ts");
        expect(config.build?.lib?.fileName?.()).toBe("vendor-globals.js");
    });
});

import { describe, expect, it } from "vitest";

type ChildProcessHelpersModule = {
    resolveCommandForPlatform: (command: string, platform?: string) => string;
};

async function importChildProcessHelpers(): Promise<ChildProcessHelpersModule> {
    return (await import("../../../scripts/lib/child-process.mjs")) as ChildProcessHelpersModule;
}

describe("child process helpers", () => {
    it("resolves Windows package manager command shims without invoking a shell", async () => {
        expect.assertions(5);

        const { resolveCommandForPlatform } = await importChildProcessHelpers();

        expect(resolveCommandForPlatform("npm", "win32")).toBe("npm.cmd");
        expect(resolveCommandForPlatform("npx", "win32")).toBe("npx.cmd");
        expect(resolveCommandForPlatform("pnpm", "win32")).toBe("pnpm.cmd");
        expect(resolveCommandForPlatform("git", "win32")).toBe("git");
        expect(resolveCommandForPlatform("npm", "linux")).toBe("npm");
    });
});

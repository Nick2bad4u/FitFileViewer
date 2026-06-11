import { createRequire } from "node:module";

import { describe, expect, it, vi } from "vitest";

interface PreloadRuntimeEnvironmentModule {
    getDefaultPreloadRuntimeEnvironment: () => {
        consoleRef: Console;
        globalScope: object;
        processRef: NodeJS.Process;
    };
}

const requireFromTest = createRequire(import.meta.url);
const { getDefaultPreloadRuntimeEnvironment } = requireFromTest(
    "../../electron-app/preload/preloadRuntimeEnvironment.js"
) as PreloadRuntimeEnvironmentModule;

describe("preload runtime environment", () => {
    it("centralizes the runtime globals used by the preload entrypoint", () => {
        expect.assertions(1);

        const runtimeConsole = {
            ...console,
            log: vi.fn<typeof console.log>(),
        } as Console;
        const originalConsole = globalThis.console;
        globalThis.console = runtimeConsole;

        try {
            expect(getDefaultPreloadRuntimeEnvironment()).toStrictEqual({
                consoleRef: runtimeConsole,
                globalScope: globalThis,
                processRef: process,
            });
        } finally {
            globalThis.console = originalConsole;
        }
    });
});

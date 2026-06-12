import { describe, expect, it, vi } from "vitest";
import { getDefaultPreloadRuntimeEnvironment } from "../../electron-app/preload/preloadRuntimeEnvironment.js";

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

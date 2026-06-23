import { describe, expect, it, vi } from "vitest";
import { getDefaultPreloadRuntimeEnvironment } from "../../electron-app/preload/preloadRuntimeEnvironment.js";

describe("preload runtime environment", () => {
    it("centralizes the runtime globals used by the preload entrypoint", () => {
        expect.assertions(1);

        const runtimeConsole = {
            ...console,
            log: vi.fn<typeof console.log>(),
        } as Console;
        const originalConsoleDescriptor = Object.getOwnPropertyDescriptor(
            globalThis,
            "console"
        );
        Object.defineProperty(globalThis, "console", {
            configurable: true,
            value: runtimeConsole,
            writable: true,
        });

        try {
            expect(getDefaultPreloadRuntimeEnvironment()).toStrictEqual({
                consoleRef: runtimeConsole,
                processRef: process,
            });
        } finally {
            if (originalConsoleDescriptor) {
                Object.defineProperty(
                    globalThis,
                    "console",
                    originalConsoleDescriptor
                );
            }
        }
    });
});

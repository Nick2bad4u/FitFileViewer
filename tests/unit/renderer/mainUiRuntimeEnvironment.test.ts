import { describe, expect, it, vi } from "vitest";

import { getMainUiRuntimeEnvironment } from "../../../electron-app/renderer/mainUiRuntimeEnvironment.js";

describe("main UI runtime environment", () => {
    it("centralizes runtime globals used by main-ui orchestration", () => {
        expect.assertions(3);

        const runtimeConsole = {
            ...console,
            info: vi.fn<typeof console.info>(),
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
            const dateNow = vi.spyOn(Date, "now").mockReturnValue(1234);
            const runtimeEnvironment = getMainUiRuntimeEnvironment();

            expect(runtimeEnvironment.consoleRef).toBe(runtimeConsole);
            expect(runtimeEnvironment.dateNow()).toBe(1234);
            expect(dateNow).toHaveBeenCalledOnce();
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

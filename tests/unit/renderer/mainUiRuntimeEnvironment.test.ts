import { describe, expect, it, vi } from "vitest";

import { getMainUiRuntimeEnvironment } from "../../../electron-app/renderer/mainUiRuntimeEnvironment.js";

describe("main UI runtime environment", () => {
    it("centralizes the console handle used by main-ui logging", () => {
        expect.assertions(1);

        const runtimeConsole = {
            ...console,
            info: vi.fn<typeof console.info>(),
        } as Console;
        const originalConsole = globalThis.console;
        globalThis.console = runtimeConsole;

        try {
            expect(getMainUiRuntimeEnvironment()).toStrictEqual({
                consoleRef: runtimeConsole,
            });
        } finally {
            globalThis.console = originalConsole;
        }
    });
});

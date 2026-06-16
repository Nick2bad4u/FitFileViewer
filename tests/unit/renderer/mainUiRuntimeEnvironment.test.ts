import { describe, expect, it, vi } from "vitest";

import { getMainUiRuntimeEnvironment } from "../../../electron-app/renderer/mainUiRuntimeEnvironment.js";

describe("main UI runtime environment", () => {
    it("uses injected runtime primitives for main-ui orchestration", () => {
        expect.assertions(3);

        const runtimeConsole = {
            ...console,
            info: vi.fn<typeof console.info>(),
        } as Console;
        const dateNow = vi.fn<() => number>(() => 1234);
        const runtimeEnvironment = getMainUiRuntimeEnvironment({
            dateNow,
            getConsole: () => runtimeConsole,
        });

        expect(runtimeEnvironment.consoleRef).toBe(runtimeConsole);
        expect(runtimeEnvironment.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when an explicit runtime scope omits required primitives", () => {
        expect.assertions(2);

        expect(() => getMainUiRuntimeEnvironment({ dateNow: () => 1 })).toThrow(
            "main UI runtime environment requires a console reference"
        );
        expect(() =>
            getMainUiRuntimeEnvironment({ getConsole: () => console })
        ).toThrow("main UI runtime environment requires a clock");
    });
});

// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
    getMainWindowRuntime,
    type MainWindowRuntimeScope,
} from "../../../../electron-app/main/window/mainWindowRuntime.js";

describe("mainWindowRuntime", () => {
    it("reads window dependencies through the provided scope", () => {
        expect.assertions(6);

        const appRef = vi.fn(() => ({ whenReady: vi.fn() }));
        const browserWindowRef = vi.fn(() => ({
            getAllWindows: () => [],
            getFocusedWindow: () => undefined,
        }));
        const isTestEnvironment = vi.fn(() => true);
        const runtime = getMainWindowRuntime({
            appRef,
            browserWindowRef,
            isTestEnvironment,
        });

        expect(runtime.appRef()).toStrictEqual({
            whenReady: expect.any(Function),
        });
        expect(runtime.browserWindowRef()?.getAllWindows?.()).toStrictEqual([]);
        expect(runtime.isTestEnvironment()).toBe(true);
        expect(appRef).toHaveBeenCalledOnce();
        expect(browserWindowRef).toHaveBeenCalledOnce();
        expect(isTestEnvironment).toHaveBeenCalledOnce();
    });

    it("uses the default runtime test-environment provider", () => {
        expect.assertions(1);

        expect(getMainWindowRuntime().isTestEnvironment()).toBe(true);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(3);

        const runtime = getMainWindowRuntime(
            {} as unknown as MainWindowRuntimeScope
        );

        expect(() => runtime.appRef()).toThrow(
            "mainWindowRuntime requires appRef provider"
        );
        expect(() => runtime.browserWindowRef()).toThrow(
            "mainWindowRuntime requires browserWindowRef provider"
        );
        expect(() => runtime.isTestEnvironment()).toThrow(
            "mainWindowRuntime requires testEnvironment provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(4);

        const isTestEnvironment = vi.fn(() => false);
        const runtime = getMainWindowRuntime({
            appRef: () => undefined,
            browserWindowRef: () => undefined,
            isTestEnvironment,
            process: { env: { NODE_ENV: "test" } },
        } as unknown as MainWindowRuntimeScope);

        expect(runtime.isTestEnvironment()).toBe(false);
        expect(runtime.appRef()).toBeUndefined();
        expect(isTestEnvironment).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

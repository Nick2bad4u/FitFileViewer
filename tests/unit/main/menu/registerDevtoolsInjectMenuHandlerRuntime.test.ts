import { describe, expect, it, vi } from "vitest";

import {
    getRegisterDevtoolsInjectMenuHandlerRuntime,
    type RegisterDevtoolsInjectMenuHandlerRuntimeScope,
} from "../../../../electron-app/main/menu/registerDevtoolsInjectMenuHandlerRuntime.js";

describe("registerDevtoolsInjectMenuHandlerRuntime", () => {
    it("reads environment mode checks through the provided scope", () => {
        expect.assertions(4);

        const isDevelopmentEnvironment = vi.fn<() => boolean>(() => true);
        const isTestEnvironment = vi.fn<() => boolean>(() => false);
        const runtime = getRegisterDevtoolsInjectMenuHandlerRuntime({
            isDevelopmentEnvironment,
            isTestEnvironment,
        });

        expect(runtime.isDevelopmentEnvironment()).toBe(true);
        expect(runtime.isTestEnvironment()).toBe(false);
        expect(isDevelopmentEnvironment).toHaveBeenCalledOnce();
        expect(isTestEnvironment).toHaveBeenCalledOnce();
    });

    it("uses the default runtime scope", () => {
        expect.assertions(2);

        const runtime = getRegisterDevtoolsInjectMenuHandlerRuntime();

        expect(runtime.isDevelopmentEnvironment()).toBe(false);
        expect(runtime.isTestEnvironment()).toBe(true);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(2);

        const runtime = getRegisterDevtoolsInjectMenuHandlerRuntime(
            {} as unknown as RegisterDevtoolsInjectMenuHandlerRuntimeScope
        );

        expect(() => runtime.isDevelopmentEnvironment()).toThrow(
            "registerDevtoolsInjectMenuHandlerRuntime requires developmentEnvironment provider"
        );
        expect(() => runtime.isTestEnvironment()).toThrow(
            "registerDevtoolsInjectMenuHandlerRuntime requires testEnvironment provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(5);

        const isDevelopmentEnvironment = vi.fn<() => boolean>(() => false);
        const isTestEnvironment = vi.fn<() => boolean>(() => false);
        const runtime = getRegisterDevtoolsInjectMenuHandlerRuntime({
            isDevelopmentEnvironment,
            isTestEnvironment,
            process: { env: { NODE_ENV: "development" } },
        } as unknown as RegisterDevtoolsInjectMenuHandlerRuntimeScope);

        expect(runtime.isDevelopmentEnvironment()).toBe(false);
        expect(runtime.isTestEnvironment()).toBe(false);
        expect(isDevelopmentEnvironment).toHaveBeenCalledOnce();
        expect(isTestEnvironment).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

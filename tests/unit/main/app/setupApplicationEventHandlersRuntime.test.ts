import { describe, expect, it, vi } from "vitest";

import {
    getSetupApplicationEventHandlersRuntime,
    type SetupApplicationEventHandlersProcessStringName,
    type SetupApplicationEventHandlersRuntimeScope,
} from "../../../../electron-app/main/app/setupApplicationEventHandlersRuntime.js";

function createRuntimeScope(
    overrides: Partial<SetupApplicationEventHandlersRuntimeScope> = {}
): SetupApplicationEventHandlersRuntimeScope {
    return {
        getProcessArgumentValues: () => [],
        getProcessEnvironmentValue: () => undefined,
        getProcessStringValue: () => undefined,
        isDevelopmentEnvironment: () => false,
        isTestEnvironment: () => false,
        ...overrides,
    };
}

describe("setupApplicationEventHandlersRuntime", () => {
    it("reads process values through the provided scope", () => {
        expect.assertions(6);

        const getProcessArgumentValues = vi.fn<() => readonly string[]>(() => [
            "--dev",
        ]);
        const getProcessEnvironmentValue = vi.fn<
            (name: string) => string | undefined
        >((name) => (name === "FFV_DEVTOOLS" ? "true" : undefined));
        const getProcessStringValue = vi.fn<
            (
                name: SetupApplicationEventHandlersProcessStringName
            ) => string | undefined
        >((name) => (name === "platform" ? "win32" : undefined));
        const isDevelopmentEnvironment = vi.fn<() => boolean>(() => true);
        const isTestEnvironment = vi.fn<() => boolean>(() => false);
        const runtime = getSetupApplicationEventHandlersRuntime(
            createRuntimeScope({
                getProcessArgumentValues,
                getProcessEnvironmentValue,
                getProcessStringValue,
                isDevelopmentEnvironment,
                isTestEnvironment,
            })
        );

        expect(runtime.getProcessArgumentValues()).toStrictEqual(["--dev"]);
        expect(runtime.getProcessEnvironmentValue("FFV_DEVTOOLS")).toBe("true");
        expect(runtime.getProcessStringValue("platform")).toBe("win32");
        expect(runtime.isDevelopmentEnvironment()).toBe(true);
        expect(runtime.isTestEnvironment()).toBe(false);
        expect(getProcessEnvironmentValue).toHaveBeenCalledWith("FFV_DEVTOOLS");
    });

    it("uses the default production scope", () => {
        expect.assertions(2);

        const runtime = getSetupApplicationEventHandlersRuntime();

        expect(runtime.getProcessEnvironmentValue("__MISSING__")).toBe(
            undefined
        );
        expect(runtime.getProcessStringValue("resourcesPath")).toBe(undefined);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(5);

        const runtime = getSetupApplicationEventHandlersRuntime(
            {} as unknown as SetupApplicationEventHandlersRuntimeScope
        );

        expect(() => runtime.getProcessArgumentValues()).toThrow(
            "setupApplicationEventHandlersRuntime requires processArgumentValues provider"
        );
        expect(() => runtime.getProcessEnvironmentValue("NODE_ENV")).toThrow(
            "setupApplicationEventHandlersRuntime requires processEnvironmentValue provider"
        );
        expect(() => runtime.getProcessStringValue("platform")).toThrow(
            "setupApplicationEventHandlersRuntime requires processStringValue provider"
        );
        expect(() => runtime.isDevelopmentEnvironment()).toThrow(
            "setupApplicationEventHandlersRuntime requires developmentEnvironment provider"
        );
        expect(() => runtime.isTestEnvironment()).toThrow(
            "setupApplicationEventHandlersRuntime requires testEnvironment provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(6);

        const getProcessArgumentValues = vi.fn<() => readonly string[]>(() => [
            "--runtime",
        ]);
        const getProcessEnvironmentValue = vi.fn<
            (name: string) => string | undefined
        >(() => undefined);
        const runtime = getSetupApplicationEventHandlersRuntime({
            getProcessArgumentValues,
            getProcessEnvironmentValue,
            getProcessStringValue: () => undefined,
            isDevelopmentEnvironment: () => false,
            isTestEnvironment: () => false,
            process: {
                argv: ["--legacy"],
                env: { FFV_DEVTOOLS: "true" },
                platform: "darwin",
            },
        } as unknown as SetupApplicationEventHandlersRuntimeScope);

        expect(runtime.getProcessArgumentValues()).toStrictEqual(["--runtime"]);
        expect(runtime.getProcessEnvironmentValue("FFV_DEVTOOLS")).toBe(
            undefined
        );
        expect(runtime.getProcessStringValue("platform")).toBe(undefined);
        expect(getProcessArgumentValues).toHaveBeenCalledOnce();
        expect(getProcessEnvironmentValue).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

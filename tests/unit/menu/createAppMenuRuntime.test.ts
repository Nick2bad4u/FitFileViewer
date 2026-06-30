import { describe, expect, it, vi } from "vitest";

import {
    getCreateAppMenuRuntime,
    type CreateAppMenuRuntimeScope,
} from "../../../electron-app/utils/app/menu/createAppMenuRuntime.js";

describe("createAppMenuRuntime", () => {
    it("reads process environment and string values through the provided scope", () => {
        expect.assertions(4);

        const getProcessEnvironmentValue = vi.fn<
            (name: string) => string | undefined
        >((name) => (name === "FFV_DEBUG_MENU" ? "1" : undefined));
        const getProcessStringValue = vi.fn<
            (name: string) => string | undefined
        >((name) => (name === "platform" ? "darwin" : undefined));
        const runtime = getCreateAppMenuRuntime({
            getProcessEnvironmentValue,
            getProcessStringValue,
        });

        expect(runtime.getProcessEnvironmentValue("FFV_DEBUG_MENU")).toBe("1");
        expect(runtime.getProcessStringValue("platform")).toBe("darwin");
        expect(getProcessEnvironmentValue).toHaveBeenCalledWith(
            "FFV_DEBUG_MENU"
        );
        expect(getProcessStringValue).toHaveBeenCalledWith("platform");
    });

    it("uses the default production scope", () => {
        expect.assertions(2);

        const runtime = getCreateAppMenuRuntime();

        expect(runtime.getProcessEnvironmentValue("__MISSING__")).toBe(
            undefined
        );
        expect(typeof runtime.getProcessStringValue("platform")).toBe("string");
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(2);

        const runtime = getCreateAppMenuRuntime(
            {} as unknown as CreateAppMenuRuntimeScope
        );

        expect(() =>
            runtime.getProcessEnvironmentValue("FFV_DEBUG_MENU")
        ).toThrow("createAppMenu requires processEnvironmentValue provider");
        expect(() => runtime.getProcessStringValue("platform")).toThrow(
            "createAppMenu requires processStringValue provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(4);

        const getProcessEnvironmentValue = vi.fn(() => undefined);
        const getProcessStringValue = vi.fn(() => undefined);
        const runtime = getCreateAppMenuRuntime({
            getProcessEnvironmentValue,
            getProcessStringValue,
            process: {
                env: { FFV_DEBUG_MENU: "1" },
                platform: "darwin",
            },
        } as unknown as CreateAppMenuRuntimeScope);

        expect(runtime.getProcessEnvironmentValue("FFV_DEBUG_MENU")).toBe(
            undefined
        );
        expect(runtime.getProcessStringValue("platform")).toBe(undefined);
        expect(getProcessEnvironmentValue).toHaveBeenCalledOnce();
        expect(getProcessStringValue).toHaveBeenCalledOnce();
    });
});

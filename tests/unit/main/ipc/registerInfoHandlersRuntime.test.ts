// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
    getRegisterInfoHandlersRuntime,
    type RegisterInfoHandlersRuntimeScope,
} from "../../../../electron-app/main/ipc/registerInfoHandlersRuntime.js";

describe("registerInfoHandlersRuntime", () => {
    it("reads process values through the provided scope", () => {
        expect.assertions(7);

        const getProcessCurrentWorkingDirectory = vi.fn(() => "/repo");
        const getProcessStringValue = vi.fn((name: string) =>
            name === "platform" ? "win32" : undefined
        );
        const getProcessVersionValue = vi.fn((name: string) =>
            name === "electron" ? "39.0.0" : undefined
        );
        const runtime = getRegisterInfoHandlersRuntime({
            getProcessCurrentWorkingDirectory,
            getProcessStringValue,
            getProcessVersionValue,
        });

        expect(runtime.getProcessCurrentWorkingDirectory()).toBe("/repo");
        expect(runtime.getProcessStringValue("platform")).toBe("win32");
        expect(runtime.getProcessVersionValue("electron")).toBe("39.0.0");
        expect(getProcessCurrentWorkingDirectory).toHaveBeenCalledOnce();
        expect(getProcessStringValue).toHaveBeenCalledExactlyOnceWith(
            "platform"
        );
        expect(getProcessVersionValue).toHaveBeenCalledExactlyOnceWith(
            "electron"
        );
        expect(runtime.getProcessVersionValue("node")).toBeUndefined();
    });

    it("uses the default runtime process providers", () => {
        expect.assertions(1);

        expect(
            getRegisterInfoHandlersRuntime().getProcessStringValue("platform")
        ).toBe(process.platform);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(3);

        const runtime = getRegisterInfoHandlersRuntime(
            {} as unknown as RegisterInfoHandlersRuntimeScope
        );

        expect(() => runtime.getProcessCurrentWorkingDirectory()).toThrow(
            "registerInfoHandlersRuntime requires processCurrentWorkingDirectory provider"
        );
        expect(() => runtime.getProcessStringValue("platform")).toThrow(
            "registerInfoHandlersRuntime requires processStringValue provider"
        );
        expect(() => runtime.getProcessVersionValue("node")).toThrow(
            "registerInfoHandlersRuntime requires processVersionValue provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(4);

        const getProcessStringValue = vi.fn(() => "linux");
        const runtime = getRegisterInfoHandlersRuntime({
            getProcessCurrentWorkingDirectory: () => "/repo",
            getProcessStringValue,
            getProcessVersionValue: () => undefined,
            process: { platform: "win32" },
        } as unknown as RegisterInfoHandlersRuntimeScope);

        expect(runtime.getProcessStringValue("platform")).toBe("linux");
        expect(runtime.getProcessCurrentWorkingDirectory()).toBe("/repo");
        expect(getProcessStringValue).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

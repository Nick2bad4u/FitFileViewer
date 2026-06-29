// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import {
    getIpcSenderPolicyRuntime,
    type IpcSenderPolicyRuntimeScope,
} from "../../../../electron-app/main/security/ipcSenderPolicyRuntime.js";

describe("ipcSenderPolicyRuntime", () => {
    it("reads app and process values through the provided scope", () => {
        expect.assertions(6);

        const appRef = vi.fn(() => ({ getAppPath: () => "C:\\mock\\app" }));
        const getProcessStringValue = vi.fn((name: string) =>
            name === "platform" ? "win32" : undefined
        );
        const isTestEnvironment = vi.fn(() => true);
        const runtime = getIpcSenderPolicyRuntime({
            appRef,
            getProcessStringValue,
            isTestEnvironment,
        });

        expect(runtime.appRef()?.getAppPath?.()).toBe("C:\\mock\\app");
        expect(runtime.getProcessStringValue("platform")).toBe("win32");
        expect(runtime.isTestEnvironment()).toBe(true);
        expect(appRef).toHaveBeenCalledOnce();
        expect(getProcessStringValue).toHaveBeenCalledExactlyOnceWith(
            "platform"
        );
        expect(isTestEnvironment).toHaveBeenCalledOnce();
    });

    it("uses the default runtime test-environment provider", () => {
        expect.assertions(1);

        expect(getIpcSenderPolicyRuntime().isTestEnvironment()).toBe(true);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(3);

        const runtime = getIpcSenderPolicyRuntime(
            {} as unknown as IpcSenderPolicyRuntimeScope
        );

        expect(() => runtime.appRef()).toThrow(
            "ipcSenderPolicyRuntime requires appRef provider"
        );
        expect(() => runtime.getProcessStringValue("platform")).toThrow(
            "ipcSenderPolicyRuntime requires processStringValue provider"
        );
        expect(() => runtime.isTestEnvironment()).toThrow(
            "ipcSenderPolicyRuntime requires testEnvironment provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(4);

        const getProcessStringValue = vi.fn(() => "linux");
        const runtime = getIpcSenderPolicyRuntime({
            appRef: () => undefined,
            getProcessStringValue,
            isTestEnvironment: () => false,
            process: { platform: "win32" },
        } as unknown as IpcSenderPolicyRuntimeScope);

        expect(runtime.getProcessStringValue("platform")).toBe("linux");
        expect(runtime.isTestEnvironment()).toBe(false);
        expect(getProcessStringValue).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

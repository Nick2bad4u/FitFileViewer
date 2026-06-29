import { describe, expect, it, vi } from "vitest";

import {
    getRegisterUpdateMenuHandlersRuntime,
    type RegisterUpdateMenuHandlersProcessStringName,
    type RegisterUpdateMenuHandlersRuntimeScope,
} from "../../../../electron-app/main/menu/registerUpdateMenuHandlersRuntime.js";

describe("registerUpdateMenuHandlersRuntime", () => {
    it("reads process string values through the provided scope", () => {
        expect.assertions(3);

        const getProcessStringValue = vi.fn<
            (
                property: RegisterUpdateMenuHandlersProcessStringName
            ) => string | undefined
        >((property) => (property === "platform" ? "linux" : undefined));
        const runtime = getRegisterUpdateMenuHandlersRuntime({
            getProcessStringValue,
        });

        expect(runtime.getProcessStringValue("platform")).toBe("linux");
        expect(runtime.getProcessStringValue("resourcesPath")).toBe(undefined);
        expect(getProcessStringValue).toHaveBeenCalledTimes(2);
    });

    it("uses the default runtime scope", () => {
        expect.assertions(1);

        expect(
            getRegisterUpdateMenuHandlersRuntime().getProcessStringValue(
                "resourcesPath"
            )
        ).toBe(undefined);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(1);

        const runtime = getRegisterUpdateMenuHandlersRuntime(
            {} as unknown as RegisterUpdateMenuHandlersRuntimeScope
        );

        expect(() => runtime.getProcessStringValue("platform")).toThrow(
            "registerUpdateMenuHandlersRuntime requires processStringValue provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(3);

        const getProcessStringValue = vi.fn(() => undefined);
        const runtime = getRegisterUpdateMenuHandlersRuntime({
            getProcessStringValue,
            process: { platform: "linux" },
        } as unknown as RegisterUpdateMenuHandlersRuntimeScope);

        expect(runtime.getProcessStringValue("platform")).toBe(undefined);
        expect(getProcessStringValue).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

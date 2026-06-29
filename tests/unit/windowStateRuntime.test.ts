import { describe, expect, it, vi } from "vitest";

import {
    getWindowStateRuntime,
    type WindowStateRuntimeScope,
} from "../../electron-app/windowStateRuntime.js";

describe("windowStateRuntime", () => {
    it("reads process environment values through the provided scope", () => {
        expect.assertions(3);

        const getProcessEnvironmentValue = vi.fn<
            (name: string) => string | undefined
        >((name) => (name === "NODE_ENV" ? "development" : undefined));
        const runtime = getWindowStateRuntime({
            getProcessEnvironmentValue,
        });

        expect(runtime.getProcessEnvironmentValue("NODE_ENV")).toBe(
            "development"
        );
        expect(runtime.getProcessEnvironmentValue("OTHER")).toBe(undefined);
        expect(getProcessEnvironmentValue).toHaveBeenCalledTimes(2);
    });

    it("uses the default production scope", () => {
        expect.assertions(1);

        expect(
            getWindowStateRuntime().getProcessEnvironmentValue("__MISSING__")
        ).toBe(undefined);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(1);

        const runtime = getWindowStateRuntime(
            {} as unknown as WindowStateRuntimeScope
        );

        expect(() => runtime.getProcessEnvironmentValue("NODE_ENV")).toThrow(
            "windowStateRuntime requires processEnvironmentValue provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(3);

        const getProcessEnvironmentValue = vi.fn(() => undefined);
        const runtime = getWindowStateRuntime({
            getProcessEnvironmentValue,
            process: { env: { NODE_ENV: "development" } },
        } as unknown as WindowStateRuntimeScope);

        expect(runtime.getProcessEnvironmentValue("NODE_ENV")).toBe(undefined);
        expect(getProcessEnvironmentValue).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

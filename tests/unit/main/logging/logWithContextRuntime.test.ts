import { describe, expect, it, vi } from "vitest";

import {
    getLogWithContextRuntime,
    type LogWithContextRuntimeScope,
} from "../../../../electron-app/main/logging/logWithContextRuntime.js";

describe("logWithContextRuntime", () => {
    it("reads process environment values through the provided scope", () => {
        expect.assertions(3);

        const getProcessEnvironmentValue = vi.fn<
            (name: string) => string | undefined
        >((name) => (name === "NODE_ENV" ? "test" : undefined));
        const runtime = getLogWithContextRuntime({
            getProcessEnvironmentValue,
        });

        expect(runtime.getProcessEnvironmentValue("NODE_ENV")).toBe("test");
        expect(runtime.getProcessEnvironmentValue("OTHER")).toBe(undefined);
        expect(getProcessEnvironmentValue).toHaveBeenCalledTimes(2);
    });

    it("uses the default production scope", () => {
        expect.assertions(1);

        expect(
            getLogWithContextRuntime().getProcessEnvironmentValue("__MISSING__")
        ).toBe(undefined);
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(1);

        const runtime = getLogWithContextRuntime(
            {} as unknown as LogWithContextRuntimeScope
        );

        expect(() => runtime.getProcessEnvironmentValue("NODE_ENV")).toThrow(
            "logWithContextRuntime requires processEnvironmentValue provider"
        );
    });

    it("ignores legacy direct process runtime properties", () => {
        expect.assertions(3);

        const getProcessEnvironmentValue = vi.fn(() => undefined);
        const runtime = getLogWithContextRuntime({
            getProcessEnvironmentValue,
            process: { env: { NODE_ENV: "test" } },
        } as unknown as LogWithContextRuntimeScope);

        expect(runtime.getProcessEnvironmentValue("NODE_ENV")).toBe(undefined);
        expect(getProcessEnvironmentValue).toHaveBeenCalledOnce();
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

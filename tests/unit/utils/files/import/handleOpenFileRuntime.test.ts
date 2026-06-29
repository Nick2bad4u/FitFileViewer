import { describe, expect, it } from "vitest";

import {
    getHandleOpenFileRuntime,
    type HandleOpenFileRuntimeScope,
} from "../../../../../electron-app/utils/files/import/handleOpenFileRuntime.js";

describe("handleOpenFileRuntime", () => {
    it("detects non-production environments through the provided scope", () => {
        expect.assertions(3);

        expect(
            getHandleOpenFileRuntime({
                getProcessEnvironmentValue: () => "development",
            }).isNonProductionEnvironment()
        ).toBe(true);
        expect(
            getHandleOpenFileRuntime({
                getProcessEnvironmentValue: () => "test",
            }).isNonProductionEnvironment()
        ).toBe(true);
        expect(
            getHandleOpenFileRuntime({
                getProcessEnvironmentValue: () => "production",
            }).isNonProductionEnvironment()
        ).toBe(false);
    });

    it("treats missing NODE_ENV as production-like", () => {
        expect.assertions(1);

        const runtime = getHandleOpenFileRuntime({
            getProcessEnvironmentValue: () => undefined,
        });

        expect(runtime.isNonProductionEnvironment()).toBe(false);
    });

    it("uses the default production scope", () => {
        expect.assertions(1);

        expect(
            typeof getHandleOpenFileRuntime().isNonProductionEnvironment()
        ).toBe("boolean");
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(1);

        const runtime = getHandleOpenFileRuntime(
            {} as unknown as HandleOpenFileRuntimeScope
        );

        expect(() => runtime.isNonProductionEnvironment()).toThrow(
            "handleOpenFile requires a process environment provider"
        );
    });

    it("fails clearly when the process environment provider slot is omitted", () => {
        expect.assertions(1);

        const runtime = getHandleOpenFileRuntime({
            getProcessEnvironmentValue: undefined,
        });

        expect(() => runtime.isNonProductionEnvironment()).toThrow(
            "handleOpenFile requires a process environment provider"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(2);

        const runtime = getHandleOpenFileRuntime({
            getProcessEnvironmentValue: () => undefined,
            process: { env: { NODE_ENV: "development" } },
        } as unknown as HandleOpenFileRuntimeScope);

        expect(runtime.isNonProductionEnvironment()).toBe(false);
        expect((runtime as unknown as { process?: unknown }).process).toBe(
            undefined
        );
    });
});

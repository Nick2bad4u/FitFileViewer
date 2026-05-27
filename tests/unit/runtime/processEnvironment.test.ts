import { afterEach, describe, expect, it } from "vitest";

import {
    getProcessEnvironmentValue,
    isDevelopmentEnvironment,
    isNodeEnvironment,
    isTestEnvironment,
} from "../../../electron-app/utils/runtime/processEnvironment.js";

const originalProcessDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "process"
);

function setGlobalProcess(value: unknown): void {
    Object.defineProperty(globalThis, "process", {
        configurable: true,
        value,
        writable: true,
    });
}

describe("process environment runtime boundary", () => {
    afterEach(() => {
        if (originalProcessDescriptor) {
            Object.defineProperty(
                globalThis,
                "process",
                originalProcessDescriptor
            );
            return;
        }

        Reflect.deleteProperty(globalThis, "process");
    });

    it("returns undefined when process is missing", () => {
        expect.assertions(4);

        setGlobalProcess(undefined);

        expect(getProcessEnvironmentValue("NODE_ENV")).toBeUndefined();
        expect(isNodeEnvironment("test")).toBe(false);
        expect(isDevelopmentEnvironment()).toBe(false);
        expect(isTestEnvironment()).toBe(false);
    });

    it("returns undefined when process.env is missing or malformed", () => {
        expect.assertions(2);

        setGlobalProcess({});

        expect(getProcessEnvironmentValue("NODE_ENV")).toBeUndefined();

        setGlobalProcess({ env: "test" });

        expect(isTestEnvironment()).toBe(false);
    });

    it("reads string environment values only", () => {
        expect.assertions(6);

        setGlobalProcess({
            env: {
                FFV_DEBUG_MENU: 1,
                NODE_ENV: "development",
            },
        });

        expect(getProcessEnvironmentValue("NODE_ENV")).toBe("development");
        expect(getProcessEnvironmentValue("FFV_DEBUG_MENU")).toBeUndefined();
        expect(isNodeEnvironment("development")).toBe(true);
        expect(isDevelopmentEnvironment()).toBe(true);
        expect(isTestEnvironment()).toBe(false);

        setGlobalProcess({ env: { NODE_ENV: "test" } });

        expect(isTestEnvironment()).toBe(true);
    });
});

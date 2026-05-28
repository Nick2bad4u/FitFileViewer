import { afterEach, describe, expect, it, vi } from "vitest";

import {
    isDevelopmentEnvironment,
    isNodeEnv,
    isTestEnvironment,
} from "../../../../../electron-app/utils/charts/core/renderChartRuntimeHelpers.js";

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

describe("render chart runtime environment helpers", () => {
    afterEach(() => {
        if (originalProcessDescriptor) {
            Object.defineProperty(
                globalThis,
                "process",
                originalProcessDescriptor
            );
        }
    });

    it("treats missing process globals as a non-node environment", () => {
        expect.assertions(3);

        setGlobalProcess(undefined);

        expect(isNodeEnv("test")).toBe(false);
        expect(isTestEnvironment()).toBe(false);
        expect(isDevelopmentEnvironment()).toBe(false);
    });

    it("ignores malformed process.env values", () => {
        expect.assertions(3);

        setGlobalProcess({ env: undefined });

        expect(isNodeEnv("test")).toBe(false);
        expect(isTestEnvironment()).toBe(false);
        expect(isDevelopmentEnvironment()).toBe(false);
    });

    it("reads NODE_ENV only when it is a string", () => {
        expect.assertions(4);

        setGlobalProcess({ env: { NODE_ENV: "development" } });

        expect(isNodeEnv("development")).toBe(true);
        expect(isDevelopmentEnvironment()).toBe(true);
        expect(isTestEnvironment()).toBe(false);

        setGlobalProcess({ env: { NODE_ENV: 1 } });

        expect(isNodeEnv("1")).toBe(false);
    });
});

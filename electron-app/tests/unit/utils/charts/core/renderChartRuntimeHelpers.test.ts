import { afterEach, describe, expect, it, vi } from "vitest";

import {
    isDevelopmentEnvironment,
    isNodeEnv,
    isTestEnvironment,
} from "../../../../../utils/charts/core/renderChartRuntimeHelpers.js";

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

function restoreGlobalProcess(): void {
    if (originalProcessDescriptor) {
        Object.defineProperty(
            globalThis,
            "process",
            originalProcessDescriptor
        );
        return;
    }

    Reflect.deleteProperty(globalThis, "process");
}

describe("renderChartRuntimeHelpers environment detection", () => {
    afterEach(() => {
        restoreGlobalProcess();
        vi.unstubAllGlobals();
    });

    it("treats a missing renderer process shim as a non-node environment", () => {
        expect.assertions(3);

        setGlobalProcess(undefined);

        expect(isNodeEnv("test")).toBe(false);
        expect(isDevelopmentEnvironment()).toBe(false);
        expect(isTestEnvironment()).toBe(false);
    });

    it("treats a renderer process shim without env as a non-node environment", () => {
        expect.assertions(3);

        setGlobalProcess({});

        expect(isNodeEnv("test")).toBe(false);
        expect(isDevelopmentEnvironment()).toBe(false);
        expect(isTestEnvironment()).toBe(false);
    });

    it("reads NODE_ENV when the renderer process shim exposes an env object", () => {
        expect.assertions(3);

        setGlobalProcess({
            env: {
                NODE_ENV: "test",
            },
        });

        expect(isNodeEnv("test")).toBe(true);
        expect(isTestEnvironment()).toBe(true);
        expect(isDevelopmentEnvironment()).toBe(false);
    });
});

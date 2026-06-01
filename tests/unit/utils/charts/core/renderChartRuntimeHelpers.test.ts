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

function restoreGlobalProcess(): void {
    if (originalProcessDescriptor) {
        Object.defineProperty(globalThis, "process", originalProcessDescriptor);
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
        expect.assertions(1);

        setGlobalProcess(undefined);

        expect({
            developmentEnvironment: isDevelopmentEnvironment(),
            nodeTestEnvironment: isNodeEnv("test"),
            testEnvironment: isTestEnvironment(),
        }).toStrictEqual({
            developmentEnvironment: false,
            nodeTestEnvironment: false,
            testEnvironment: false,
        });
    });

    it("treats a renderer process shim without env as a non-node environment", () => {
        expect.assertions(1);

        setGlobalProcess({});

        expect({
            developmentEnvironment: isDevelopmentEnvironment(),
            nodeTestEnvironment: isNodeEnv("test"),
            testEnvironment: isTestEnvironment(),
        }).toStrictEqual({
            developmentEnvironment: false,
            nodeTestEnvironment: false,
            testEnvironment: false,
        });
    });

    it("reads NODE_ENV when the renderer process shim exposes an env object", () => {
        expect.assertions(1);

        setGlobalProcess({
            env: {
                NODE_ENV: "test",
            },
        });

        expect({
            developmentEnvironment: isDevelopmentEnvironment(),
            nodeTestEnvironment: isNodeEnv("test"),
            testEnvironment: isTestEnvironment(),
        }).toStrictEqual({
            developmentEnvironment: false,
            nodeTestEnvironment: true,
            testEnvironment: true,
        });
    });
});

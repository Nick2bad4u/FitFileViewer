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
        expect.hasAssertions();

        setGlobalProcess(undefined);

        expect({
            isDevelopment: isDevelopmentEnvironment(),
            isNodeTest: isNodeEnv("test"),
            isTest: isTestEnvironment(),
        }).toEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
        });
    });

    it("ignores malformed process.env values", () => {
        expect.hasAssertions();

        setGlobalProcess({ env: undefined });

        expect({
            isDevelopment: isDevelopmentEnvironment(),
            isNodeTest: isNodeEnv("test"),
            isTest: isTestEnvironment(),
        }).toEqual({
            isDevelopment: false,
            isNodeTest: false,
            isTest: false,
        });
    });

    it("reads NODE_ENV only when it is a string", () => {
        expect.hasAssertions();

        setGlobalProcess({ env: { NODE_ENV: "development" } });

        expect({
            isDevelopment: isDevelopmentEnvironment(),
            isNodeDevelopment: isNodeEnv("development"),
            isTest: isTestEnvironment(),
        }).toEqual({
            isDevelopment: true,
            isNodeDevelopment: true,
            isTest: false,
        });

        setGlobalProcess({ env: { NODE_ENV: 1 } });

        expect({ isNodeNumericEnv: isNodeEnv("1") }).toEqual({
            isNodeNumericEnv: false,
        });
    });
});

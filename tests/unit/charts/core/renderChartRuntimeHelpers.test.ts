import { afterEach, describe, expect, it } from "vitest";

import {
    ensureProcessNextTick,
    getGlobalChartInstances,
    isDevelopmentEnvironment,
    isNodeEnv,
    isTestEnvironment,
} from "../../../../electron-app/utils/charts/core/renderChartRuntimeHelpers.js";
import {
    clearChartInstanceRegistryForTests,
    clearRegisteredChartInstances,
    setRegisteredChartInstances,
} from "../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

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

function getEnvironmentSnapshot(): {
    isDevelopment: boolean;
    isNodeDevelopment: boolean;
    isNodeTest: boolean;
    isTest: boolean;
} {
    return {
        isDevelopment: isDevelopmentEnvironment(),
        isNodeDevelopment: isNodeEnv("development"),
        isNodeTest: isNodeEnv("test"),
        isTest: isTestEnvironment(),
    };
}

describe("render chart runtime helpers", () => {
    const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        "window"
    );

    afterEach(() => {
        restoreGlobalProcess();
        clearChartInstanceRegistryForTests();
        if (originalWindowDescriptor) {
            Object.defineProperty(
                globalThis,
                "window",
                originalWindowDescriptor
            );
            return;
        }

        Reflect.deleteProperty(globalThis, "window");
    });

    it("handles missing process globals without touching process.env directly", () => {
        expect.assertions(1);

        const snapshots = [
            undefined,
            {},
            { env: undefined },
            { env: { NODE_ENV: 1 } },
        ].map((processValue) => {
            setGlobalProcess(processValue);
            return getEnvironmentSnapshot();
        });

        expect(snapshots).toStrictEqual([
            {
                isDevelopment: false,
                isNodeDevelopment: false,
                isNodeTest: false,
                isTest: false,
            },
            {
                isDevelopment: false,
                isNodeDevelopment: false,
                isNodeTest: false,
                isTest: false,
            },
            {
                isDevelopment: false,
                isNodeDevelopment: false,
                isNodeTest: false,
                isTest: false,
            },
            {
                isDevelopment: false,
                isNodeDevelopment: false,
                isNodeTest: false,
                isTest: false,
            },
        ]);
    });

    it("reads chart runtime environment state through the shared runtime boundary", () => {
        expect.assertions(2);

        setGlobalProcess({ env: { NODE_ENV: "development" } });

        expect(getEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: true,
            isNodeDevelopment: true,
            isNodeTest: false,
            isTest: false,
        });

        setGlobalProcess({ env: { NODE_ENV: "test" } });

        expect(getEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: false,
            isNodeDevelopment: false,
            isNodeTest: true,
            isTest: true,
        });
    });

    it("adds a nextTick shim without replacing an existing process object", async () => {
        expect.assertions(3);

        setGlobalProcess({ env: { NODE_ENV: "test" } });

        ensureProcessNextTick();

        const processValue = globalThis.process as typeof process;
        const calls: unknown[] = [];
        processValue.nextTick((value: unknown) => {
            calls.push(value);
        }, "queued");

        expect(processValue.env.NODE_ENV).toBe("test");
        expect(calls).toStrictEqual([]);
        await Promise.resolve();
        expect(calls).toStrictEqual(["queued"]);
    });

    it("returns registered chart instances before falling back to caller-provided arrays", () => {
        expect.assertions(3);

        expect(getGlobalChartInstances(["fallback"])).toStrictEqual([
            "fallback",
        ]);

        const registeredChart = { id: "registered" };
        setRegisteredChartInstances([registeredChart]);

        expect(getGlobalChartInstances(["fallback"])).toStrictEqual([
            registeredChart,
        ]);

        clearRegisteredChartInstances();

        expect(getGlobalChartInstances("invalid")).toStrictEqual([]);
    });
});

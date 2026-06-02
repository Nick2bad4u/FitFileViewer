import { afterEach, describe, expect, it } from "vitest";

import {
    ensureProcessNextTick,
    getGlobalChartInstances,
    isDevelopmentEnvironment,
    isNodeEnv,
    isTestEnvironment,
} from "../../../../electron-app/utils/charts/core/renderChartRuntimeHelpers.js";

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
    isTest: boolean;
} {
    return {
        isDevelopment: isDevelopmentEnvironment(),
        isNodeDevelopment: isNodeEnv("development"),
        isTest: isTestEnvironment(),
    };
}

describe("render chart runtime helpers", () => {
    afterEach(() => {
        restoreGlobalProcess();
        Reflect.deleteProperty(globalThis, "_chartjsInstances");
    });

    it("handles missing process globals without touching process.env directly", () => {
        expect.assertions(1);

        const snapshots = [undefined, {}].map((processValue) => {
            setGlobalProcess(processValue);
            return getEnvironmentSnapshot();
        });

        expect(snapshots).toStrictEqual([
            {
                isDevelopment: false,
                isNodeDevelopment: false,
                isTest: false,
            },
            {
                isDevelopment: false,
                isNodeDevelopment: false,
                isTest: false,
            },
        ]);
    });

    it("reads chart runtime environment state through the shared runtime boundary", () => {
        expect.assertions(1);

        setGlobalProcess({ env: { NODE_ENV: "development" } });

        expect(getEnvironmentSnapshot()).toStrictEqual({
            isDevelopment: true,
            isNodeDevelopment: true,
            isTest: false,
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

    it("returns chart instances only when the resolved global value is an array", () => {
        expect.assertions(3);

        const chartGlobal = globalThis as typeof globalThis & {
            _chartjsInstances?: unknown[];
        };

        expect(getGlobalChartInstances(["fallback"])).toStrictEqual([
            "fallback",
        ]);

        chartGlobal._chartjsInstances = ["global"];

        expect(getGlobalChartInstances(["fallback"])).toStrictEqual(["global"]);

        chartGlobal._chartjsInstances = undefined;

        expect(getGlobalChartInstances("invalid")).toStrictEqual([]);
    });
});

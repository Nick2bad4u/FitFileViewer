import { afterEach, describe, expect, it, vi } from "vitest";

import {
    ensureProcessNextTick,
    getDebouncedChartStateManager,
    getChartLifecycleActions,
    getGlobalChartInstances,
    isDevelopmentEnvironment,
    isLoadingStateSuppressed,
    isNodeEnv,
    isTestEnvironment,
    setLoadingStateSuppressed,
} from "../../../../electron-app/utils/charts/core/renderChartRuntimeHelpers.js";
import {
    registerChartActions,
    resetChartActionsRegistryForTests,
} from "../../../../electron-app/utils/charts/core/chartActionsRegistry.js";
import {
    registerChartStateManager,
    resetChartStateManagerRegistryForTests,
} from "../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js";
import {
    clearChartInstanceRegistryForTests,
    clearRegisteredChartInstances,
    setRegisteredChartInstances,
} from "../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";
import type {
    ProcessShim,
    RenderChartRuntimeHelpersRuntime,
} from "../../../../electron-app/utils/charts/core/renderChartRuntimeHelpersRuntime.js";

function createRuntime(
    processShim: ProcessShim | null
): RenderChartRuntimeHelpersRuntime {
    return {
        ensureProcessShim: vi.fn(() => processShim ?? {}),
        getProcessEnvironmentValue: vi.fn((name: string) => {
            const environment = processShim?.env;
            if (typeof environment !== "object" || environment === null) {
                return undefined;
            }

            const value = environment[name];
            return typeof value === "string" ? value : undefined;
        }),
        getProcessShim: vi.fn(() => processShim),
    };
}

function getEnvironmentSnapshot(runtime: RenderChartRuntimeHelpersRuntime): {
    isDevelopment: boolean;
    isNodeDevelopment: boolean;
    isNodeTest: boolean;
    isTest: boolean;
} {
    return {
        isDevelopment: isDevelopmentEnvironment(runtime),
        isNodeDevelopment: isNodeEnv("development", runtime),
        isNodeTest: isNodeEnv("test", runtime),
        isTest: isTestEnvironment(runtime),
    };
}

describe("render chart runtime helpers", () => {
    afterEach(() => {
        setLoadingStateSuppressed(false);
        resetChartActionsRegistryForTests();
        resetChartStateManagerRegistryForTests();
        clearChartInstanceRegistryForTests();
    });

    it("handles missing process globals without touching process.env directly", () => {
        expect.assertions(1);

        const snapshots = [
            null,
            {},
            { env: undefined },
            { env: { NODE_ENV: 1 } },
        ].map((processValue) => {
            return getEnvironmentSnapshot(createRuntime(processValue));
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

        expect(
            getEnvironmentSnapshot(
                createRuntime({ env: { NODE_ENV: "development" } })
            )
        ).toStrictEqual({
            isDevelopment: true,
            isNodeDevelopment: true,
            isNodeTest: false,
            isTest: false,
        });

        expect(
            getEnvironmentSnapshot(createRuntime({ env: { NODE_ENV: "test" } }))
        ).toStrictEqual({
            isDevelopment: false,
            isNodeDevelopment: false,
            isNodeTest: true,
            isTest: true,
        });
    });

    it("adds a nextTick shim without replacing an existing process object", async () => {
        expect.assertions(3);

        const processValue: ProcessShim = { env: { NODE_ENV: "test" } },
            runtime = createRuntime(processValue);

        ensureProcessNextTick(runtime);

        const calls: unknown[] = [];
        processValue.nextTick((value: unknown) => {
            calls.push(value);
        }, "queued");

        expect(processValue.env.NODE_ENV).toBe("test");
        expect(calls).toStrictEqual([]);
        await Promise.resolve();
        expect(calls).toStrictEqual(["queued"]);
    });

    it("adds a nextTick shim through an injected runtime", async () => {
        expect.assertions(4);

        const processShim: ProcessShim = {},
            runtime: RenderChartRuntimeHelpersRuntime = {
                ensureProcessShim: vi.fn(() => processShim),
                getProcessEnvironmentValue: vi.fn(() => undefined),
                getProcessShim: vi.fn(() => processShim),
            };

        ensureProcessNextTick(runtime);

        const nextTick = processShim.nextTick,
            calls: unknown[] = [];

        expect(runtime.ensureProcessShim).toHaveBeenCalledExactlyOnceWith();
        expect(runtime.getProcessShim).not.toHaveBeenCalled();
        expect(typeof nextTick).toBe("function");

        if (typeof nextTick !== "function") {
            throw new TypeError(
                "Expected injected process shim to receive nextTick"
            );
        }

        nextTick((value: unknown) => {
            calls.push(value);
        }, "queued");

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

    it("returns the registered chart state manager from the typed registry", () => {
        expect.assertions(2);

        const registeredRender = () => undefined,
            registeredManager = { debouncedRender: registeredRender };

        expect(getDebouncedChartStateManager()).toBeNull();

        registerChartStateManager(registeredManager);

        expect(getDebouncedChartStateManager()).toBe(registeredManager);
    });

    it("returns registered chart actions from the typed registry", () => {
        expect.assertions(2);

        const registeredActions = { completeRendering: () => undefined };

        expect(getChartLifecycleActions()).toBeNull();

        registerChartActions(registeredActions);

        expect(getChartLifecycleActions()).toBe(registeredActions);
    });

    it("tracks loading suppression through module state", () => {
        expect.assertions(3);

        expect(isLoadingStateSuppressed()).toBe(false);

        setLoadingStateSuppressed(true);

        expect(isLoadingStateSuppressed()).toBe(true);

        setLoadingStateSuppressed(false);

        expect(isLoadingStateSuppressed()).toBe(false);
    });
});

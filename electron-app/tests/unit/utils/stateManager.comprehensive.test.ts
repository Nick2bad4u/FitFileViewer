/**
 * @file Comprehensive tests for the state manager core module.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    __resetStateManagerForTests,
    clearStateHistory,
    getState,
    getStateHistory,
    getSubscriptions,
    setState,
    subscribe,
    updateState,
    resetState,
    type StateListener,
} from "../../../utils/state/core/stateManager.js";
import type { AppStateShape } from "../../../utils/state/core/stateManagerDefaults.js";

type ComplexState = {
    readonly array: readonly number[];
    readonly func: () => string;
    readonly nested: {
        readonly prop: string;
    };
};

type CircularState = {
    readonly prop: string;
    self?: CircularState;
};

function createStateListener(): ReturnType<typeof vi.fn<StateListener>> {
    return vi.fn<StateListener>();
}

function getRootState(): AppStateShape {
    return getState<AppStateShape>("") as AppStateShape;
}

describe("State Manager Comprehensive", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        __resetStateManagerForTests();
    });

    describe("Basic State Operations", () => {
        it("should set and get simple state values", () => {
            setState("test.value", "hello");
            expect(getState("test.value")).toBe("hello");
        });

        it("should set and get nested state values", () => {
            setState("nested.deep.value", 42);
            expect(getState("nested.deep.value")).toBe(42);
        });

        it("should return undefined for non-existent state paths", () => {
            expect(getState("nonexistent.path")).toBeUndefined();
        });

        it("should handle null and undefined values", () => {
            setState("test.null", null);
            setState("test.undefined", undefined);

            expect(getState("test.null")).toBeNull();
            expect(getState("test.undefined")).toBeUndefined();
        });

        it("should handle complex objects", () => {
            const complexObj: ComplexState = {
                array: [
                    1,
                    2,
                    3,
                ],
                nested: { prop: "value" },
                func: () => "test",
            };

            setState("complex", complexObj);
            const result = getState<ComplexState>("complex");

            expect(result).toBe(complexObj);
            expect(result?.array).toEqual([
                1,
                2,
                3,
            ]);
            expect(result?.nested.prop).toBe("value");
            expect(typeof result?.func).toBe("function");
        });

        it("should overwrite existing state values", () => {
            setState("test.overwrite", "original");
            setState("test.overwrite", "updated");

            expect(getState("test.overwrite")).toBe("updated");
        });

        it("should handle getState with empty path", () => {
            const fullState = getRootState();

            expect(fullState.ui.activeTab).toBe("summary");
            expect(fullState.charts.selectedChart).toBe("elevation");
            expect(fullState.map.baseLayer).toBe("openstreetmap");
        });
    });

    describe("State Options and Configuration", () => {
        it("should handle silent option correctly", () => {
            const mockSubscriber = createStateListener();
            subscribe("test.silent", mockSubscriber);

            setState("test.silent", "value", { silent: true });

            expect(getState("test.silent")).toBe("value");
            expect(
                getSubscriptions().subscriptionDetails["test.silent"]
            ).toStrictEqual({
                hasListeners: true,
                listenerCount: 1,
            });
            expect(mockSubscriber).not.toHaveBeenCalled();
        });

        it("should include source information in state changes", () => {
            const mockSubscriber = createStateListener();
            subscribe("test.source", mockSubscriber);

            setState("test.source", "value", { source: "test-suite" });

            expect(getState("test.source")).toBe("value");
            expect(getStateHistory().at(-1)).toMatchObject({
                path: "test.source",
                source: "test-suite",
            });
            expect(mockSubscriber).toHaveBeenCalledWith(
                "value",
                undefined,
                "test.source"
            );
        });

        it("should handle merge option with objects", () => {
            setState("merge.test", { a: 1, b: 2 });
            setState("merge.test", { b: 3, c: 4 }, { merge: true });

            const result = getState("merge.test");
            expect(result).toStrictEqual({ a: 1, b: 3, c: 4 });
        });

        it("should handle merge option with non-objects", () => {
            setState("merge.primitive", "initial");
            setState("merge.primitive", "updated", { merge: true });

            expect(getState("merge.primitive")).toBe("updated");
        });

        it("should handle merge option with arrays", () => {
            setState("merge.array", [1, 2]);
            setState("merge.array", [3, 4], { merge: true });

            expect(getState("merge.array")).toStrictEqual([3, 4]);
        });
    });

    describe("Subscription System", () => {
        it("should subscribe to state changes", () => {
            const mockSubscriber = createStateListener();
            subscribe("test.subscription", mockSubscriber);

            setState("test.subscription", "new value");

            expect(getState("test.subscription")).toBe("new value");
            expect(mockSubscriber).toHaveBeenCalledWith(
                "new value",
                undefined,
                "test.subscription"
            );
        });

        it("should provide old value in subscription callbacks", () => {
            const mockSubscriber = createStateListener();
            setState("test.old-value", "initial");
            subscribe("test.old-value", mockSubscriber);

            setState("test.old-value", "updated");

            expect(getState("test.old-value")).toBe("updated");
            expect(getStateHistory().at(-1)).toMatchObject({
                oldValue: "initial",
                path: "test.old-value",
            });
            expect(mockSubscriber).toHaveBeenCalledWith(
                "updated",
                "initial",
                "test.old-value"
            );
        });

        it("should support multiple subscribers for the same path", () => {
            const subscriber1 = createStateListener();
            const subscriber2 = createStateListener();

            subscribe("test.multiple", subscriber1);
            subscribe("test.multiple", subscriber2);

            setState("test.multiple", "value");

            expect(getState("test.multiple")).toBe("value");
            expect(
                getSubscriptions().subscriptionDetails["test.multiple"]
            ).toStrictEqual({
                hasListeners: true,
                listenerCount: 2,
            });
            expect(subscriber1).toHaveBeenCalledWith(
                "value",
                undefined,
                "test.multiple"
            );
            expect(subscriber2).toHaveBeenCalledWith(
                "value",
                undefined,
                "test.multiple"
            );
        });

        it("should unsubscribe successfully", () => {
            const mockSubscriber = createStateListener();
            const unsubscribe = subscribe("test.unsubscribe", mockSubscriber);

            setState("test.unsubscribe", "value");
            expect(mockSubscriber).toHaveBeenCalledTimes(1);
            expect(getSubscriptions().paths).toContain("test.unsubscribe");

            unsubscribe();
            mockSubscriber.mockClear();
            setState("test.unsubscribe", "value2");

            expect(getState("test.unsubscribe")).toBe("value2");
            expect(mockSubscriber).not.toHaveBeenCalled();
            expect(getSubscriptions().paths).not.toContain("test.unsubscribe");
        });

        it("should handle parent path listeners", () => {
            const parentCallback = createStateListener();
            const childCallback = createStateListener();

            subscribe("parent", parentCallback);
            subscribe("parent.child", childCallback);

            setState("parent.child", "value");

            expect(getState("parent")).toStrictEqual({ child: "value" });
            expect(childCallback).toHaveBeenCalledWith(
                "value",
                undefined,
                "parent.child"
            );
            expect(parentCallback).toHaveBeenCalledWith(
                { child: "value" },
                { child: "value" },
                "parent"
            );
        });

        it("should handle errors in subscription callbacks", () => {
            const errorCallback = vi.fn<StateListener>(() => {
                throw new Error("Test error");
            });
            const normalCallback = createStateListener();
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockReturnValue(undefined);

            subscribe("error.test", errorCallback);
            subscribe("error.test", normalCallback);

            setState("error.test", "value");

            expect(getState("error.test")).toBe("value");
            expect(errorCallback).toHaveBeenCalled();
            expect(normalCallback).toHaveBeenCalledWith(
                "value",
                undefined,
                "error.test"
            );
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should handle errors in parent path callbacks", () => {
            const errorCallback = vi.fn<StateListener>(() => {
                throw new Error("Parent error");
            });
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockReturnValue(undefined);

            subscribe("parent", errorCallback);
            setState("parent.child", "value");

            expect(getState("parent")).toStrictEqual({ child: "value" });
            expect(errorCallback).toHaveBeenCalledWith(
                { child: "value" },
                { child: "value" },
                "parent"
            );
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe("Advanced State Operations", () => {
        it("should handle updateState function", () => {
            setState("update.test", { a: 1, b: 2 });
            updateState("update.test", { b: 3, c: 4 });

            const result = getState("update.test");
            expect(result).toStrictEqual({ a: 1, b: 3, c: 4 });
        });

        it("should handle resetState for specific paths", () => {
            setState("reset.test.nested", "value");
            expect(getState("reset.test.nested")).toBe("value");

            resetState("reset.test.nested");
            expect(getState("reset.test.nested")).toBeUndefined();
        });

        it("should handle resetState for entire state", () => {
            setState("reset.global", "value");
            expect(getState("reset.global")).toBe("value");

            resetState();
            expect(getState("reset.global")).toBeUndefined();
            expect(getRootState().ui.activeTab).toBe("summary");
        });

        it("should handle deep nested object creation", () => {
            setState("deep.nested.very.deeply.nested", "value");
            expect(getState("deep.nested.very.deeply.nested")).toBe("value");
        });

        it("should handle invalid final key gracefully", () => {
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            setState("test.", "value");
            setState("test..invalid", "value");

            expect(getState("test.")).toBeUndefined();
            expect(getState("test..invalid")).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it("should handle null and undefined in state traversal", () => {
            setState("nullpath", null);
            expect(getState("nullpath.subpath")).toBeUndefined();

            setState("undefpath", undefined);
            expect(getState("undefpath.subpath")).toBeUndefined();
        });

        it("should handle resetState with non-existent paths", () => {
            expect(() => resetState("nonexistent.path")).not.toThrow();
            expect(() => resetState("also.nonexistent")).not.toThrow();
        });

        it("should handle resetState with null target", () => {
            setState("nulltest", null);
            expect(() => resetState("nulltest.subpath")).not.toThrow();
        });

        it("should log state changes", () => {
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockReturnValue(undefined);

            setState("log.test", "value", { source: "test-source" });

            expect(getState("log.test")).toBe("value");
            expect(getStateHistory().at(-1)).toMatchObject({
                path: "log.test",
                source: "test-source",
            });
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "[StateManager] log.test updated by test-source:"
                ),
                expect.any(Object)
            );

            consoleSpy.mockRestore();
        });
    });

    describe("Error Handling and Edge Cases", () => {
        it("should handle empty string paths gracefully", () => {
            expect(() => setState("", "value")).not.toThrow();
            expect(getRootState().ui.activeTab).toBe("summary");
        });

        it("should handle circular references in objects", () => {
            const circular: CircularState = { prop: "value" };
            circular.self = circular;

            expect(() => setState("circular", circular)).not.toThrow();
            const result = getState<CircularState>("circular");
            expect(result?.prop).toBe("value");
            expect(result?.self).toBe(result);
        });

        it("should handle very deep nesting levels", () => {
            const deepPath =
                "a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z";

            setState(deepPath, "deep value");
            expect(getState(deepPath)).toBe("deep value");
        });

        it("should handle defensive key checks", () => {
            // Test with empty key segments
            setState("test..empty", "value");
            expect(() => getState("test..empty")).not.toThrow();
            expect(getState("test.empty")).toBe("value");
        });
    });

    describe("Performance and Memory", () => {
        it("should handle rapid state changes efficiently", () => {
            const start = performance.now();

            for (let i = 0; i < 100; i++) {
                setState(`performance.test.${i}`, i);
            }

            const end = performance.now();
            const duration = end - start;

            expect(getState("performance.test.99")).toBe(99);
            expect(duration).toBeLessThan(1000);
        });

        it("should clean up subscriptions properly", () => {
            const subscribers = [];

            for (let i = 0; i < 10; i++) {
                const unsubscribe = subscribe(
                    "cleanup.test",
                    createStateListener()
                );
                subscribers.push(unsubscribe);
            }

            setState("cleanup.test", "value");

            expect(
                getSubscriptions().subscriptionDetails["cleanup.test"]
            ).toStrictEqual({
                hasListeners: true,
                listenerCount: 10,
            });

            subscribers.forEach((unsub) => unsub());

            expect(() => setState("cleanup.test", "value2")).not.toThrow();
            expect(getSubscriptions().paths).not.toContain("cleanup.test");
        });

        it("should maintain state history", () => {
            clearStateHistory();

            setState("history.test", "value1");
            setState("history.test", "value2");
            setState("history.test", "value3");

            const history = getStateHistory();

            expect(history).toHaveLength(3);
            expect(history.map((entry) => entry.newValue)).toStrictEqual([
                "value1",
                "value2",
                "value3",
            ]);
            expect(history.at(-1)).toMatchObject({
                oldValue: "value2",
                path: "history.test",
            });
        });

        it("should handle maximum history size", () => {
            clearStateHistory();

            for (let i = 0; i < 60; i++) {
                setState(`history.stress.${i}`, `value${i}`);
            }

            const history = getStateHistory();

            expect(history).toHaveLength(50);
            expect(history[0]).toMatchObject({ path: "history.stress.10" });
            expect(history.at(-1)).toMatchObject({
                newValue: "value59",
                path: "history.stress.59",
            });
        });
    });
});

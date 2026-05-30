import { describe, expect, it, vi } from "vitest";
import {
    __resetStateManagerForTests,
    clearStateHistory,
    getState,
    getStateHistory,
    getSubscriptions,
    resetState,
    setState,
    subscribe,
    updateState,
    type StateListener,
} from "../../../electron-app/utils/state/core/stateManager.js";
import type { AppStateShape } from "../../../electron-app/utils/state/core/stateManagerDefaults.js";

type TestObjectState = {
    readonly a: number;
    readonly b: number;
    readonly c?: number;
};

type CircularState = {
    readonly prop: string;
    self?: CircularState;
};

function resetStateManager(): void {
    __resetStateManagerForTests();
}

function createStateListener(): ReturnType<typeof vi.fn<StateListener>> {
    return vi.fn<StateListener>();
}

function getRootState(): AppStateShape {
    return getState<AppStateShape>("") as AppStateShape;
}

describe("state manager core", () => {
    it("sets and gets simple state values", () => {
        expect.assertions(1);

        resetStateManager();

        setState("test.value", "hello");

        expect(getState("test.value")).toBe("hello");
    });

    it("sets and gets nested state values", () => {
        expect.assertions(1);

        resetStateManager();

        setState("nested.deep.value", 42);

        expect(getState("nested.deep")).toStrictEqual({ value: 42 });
    });

    it("returns undefined for non-existent state paths", () => {
        expect.assertions(1);

        resetStateManager();

        expect(getState("nonexistent.path")).toBeUndefined();
    });

    it("handles null and undefined values", () => {
        expect.assertions(2);

        resetStateManager();

        setState("test.null", null);
        setState("test.undefined", undefined);

        expect(getState("test.null")).toBeNull();
        expect(getState("test.undefined")).toBeUndefined();
    });

    it("stores complex objects by reference", () => {
        expect.assertions(4);

        resetStateManager();

        const complexObject = {
            array: [
                1,
                2,
                3,
            ],
            func: () => "result",
            nested: { prop: "value" },
        };

        setState("complex", complexObject);
        const result = getState<typeof complexObject>("complex");

        expect(result).toBe(complexObject);
        expect(result?.array).toStrictEqual([
            1,
            2,
            3,
        ]);
        expect(result?.nested.prop).toBe("value");
        expect(result?.func).toBeTypeOf("function");
    });

    it("overwrites existing state values", () => {
        expect.assertions(1);

        resetStateManager();

        setState("test.overwrite", "original");
        setState("test.overwrite", "updated");

        expect(getState("test.overwrite")).toBe("updated");
    });

    it("keeps silent updates out of subscriber callbacks while mutating state", () => {
        expect.assertions(3);

        resetStateManager();

        const mockSubscriber = createStateListener();
        const unsubscribe = subscribe("test.silent", mockSubscriber);

        setState("test.silent", "value", { silent: true });

        expect(getState("test.silent")).toBe("value");
        expect(
            getSubscriptions().subscriptionDetails["test.silent"]
        ).toStrictEqual({
            hasListeners: true,
            listenerCount: 1,
        });
        expect(mockSubscriber).not.toHaveBeenCalled();

        unsubscribe();
    });

    it("passes source-tagged changes through the subscriber contract", () => {
        expect.assertions(3);

        resetStateManager();

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

    it("notifies subscribers with the new value and path", () => {
        expect.assertions(2);

        resetStateManager();

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

    it("provides old values in subscription callbacks", () => {
        expect.assertions(3);

        resetStateManager();

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

    it("supports multiple subscribers for the same path", () => {
        expect.assertions(4);

        resetStateManager();

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

    it("removes subscribers through the unsubscribe callback", () => {
        expect.assertions(4);

        resetStateManager();

        const mockSubscriber = createStateListener();
        const unsubscribe = subscribe("test.unsubscribe", mockSubscriber);

        setState("test.unsubscribe", "value");

        expect(mockSubscriber).toHaveBeenCalledOnce();
        expect(getSubscriptions().paths).toContain("test.unsubscribe");

        unsubscribe();
        setState("test.unsubscribe", "value2");

        expect(getState("test.unsubscribe")).toBe("value2");
        expect(getSubscriptions().paths).not.toContain("test.unsubscribe");
    });

    it("notifies parent path listeners when child state changes", () => {
        expect.assertions(4);

        resetStateManager();

        const parentCallback = createStateListener();
        const childCallback = createStateListener();

        subscribe("parent", parentCallback);
        subscribe("parent.child", childCallback);

        setState("parent.child", "value");

        expect(getState("parent")).toStrictEqual({ child: "value" });
        expect(getSubscriptions().paths).toStrictEqual([
            "parent",
            "parent.child",
        ]);
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

    it("handles errors in subscription callbacks without skipping other subscribers", () => {
        expect.assertions(4);

        resetStateManager();

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
        expect(errorCallback).toHaveBeenCalledOnce();
        expect(normalCallback).toHaveBeenCalledWith(
            "value",
            undefined,
            "error.test"
        );
        expect(consoleSpy).toHaveBeenCalledOnce();

        consoleSpy.mockRestore();
    });

    it("handles errors in parent path callbacks after updating child state", () => {
        expect.assertions(3);

        resetStateManager();

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
        expect(consoleSpy).toHaveBeenCalledOnce();

        consoleSpy.mockRestore();
    });

    it("handles empty string paths without throwing", () => {
        expect.assertions(2);

        resetStateManager();

        expect(setState("", "value")).toBeUndefined();
        expect(getRootState().ui.activeTab).toBe("summary");
    });

    it("handles circular references in objects", () => {
        expect.assertions(4);

        resetStateManager();

        const circular: CircularState = { prop: "value" };
        circular.self = circular;

        expect(setState("circular", circular)).toBeUndefined();

        const result = getState<CircularState>("circular");

        expect(result).toBe(circular);
        expect(result?.prop).toBe("value");
        expect(result?.self).toBe(result);
    });

    it("handles very deep nesting levels", () => {
        expect.assertions(1);

        resetStateManager();

        const deepPath = "a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z";

        setState(deepPath, "deep value");

        expect(getState(deepPath)).toBe("deep value");
    });

    it("handles rapid state changes efficiently", () => {
        expect.assertions(2);

        resetStateManager();

        const start = performance.now();

        for (let i = 0; i < 100; i += 1) {
            setState(`performance.test.${i}`, i);
        }

        const duration = performance.now() - start;

        expect(
            getState<Record<string, number>>("performance.test")
        ).toMatchObject({
            "99": 99,
        });
        expect(duration).toBeLessThan(1000);
    });

    it("cleans up subscription registrations", () => {
        expect.assertions(3);

        resetStateManager();

        const subscribers = Array.from({ length: 10 }, () =>
            subscribe("cleanup.test", createStateListener())
        );

        setState("cleanup.test", "value");

        expect(
            getSubscriptions().subscriptionDetails["cleanup.test"]
        ).toStrictEqual({
            hasListeners: true,
            listenerCount: 10,
        });

        subscribers.forEach((unsubscribe) => {
            unsubscribe();
        });

        expect(setState("cleanup.test", "value2")).toBeUndefined();
        expect(getSubscriptions().paths).not.toContain("cleanup.test");
    });

    it("updates object state through merge semantics", () => {
        expect.assertions(2);

        resetStateManager();

        setState("merge.test", { a: 1, b: 2 });
        updateState("merge.test", { b: 3, c: 4 });

        const result = getState<TestObjectState>("merge.test");

        expect(result).toStrictEqual({ a: 1, b: 3, c: 4 });
        expect(getStateHistory().at(-1)).toMatchObject({
            newValue: { b: 3, c: 4 },
            path: "merge.test",
        });
    });

    it("records chronological state history entries", () => {
        expect.assertions(3);

        resetStateManager();
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

    it("resets specific state paths", () => {
        expect.assertions(2);

        resetStateManager();

        setState("reset.test.nested", "value");

        expect(getState("reset.test.nested")).toBe("value");

        resetState("reset.test.nested");

        expect(getState("reset.test.nested")).toBeUndefined();
    });

    it("resets the full state to defaults", () => {
        expect.assertions(3);

        resetStateManager();

        setState("reset.global", "value");

        expect(getState("reset.global")).toBe("value");

        resetState();

        expect(getState("reset.global")).toBeUndefined();
        expect(getRootState().ui.activeTab).toBe("summary");
    });

    it("returns the root state for empty getState paths", () => {
        expect.assertions(3);

        resetStateManager();

        const fullState = getRootState();

        expect(fullState.ui.activeTab).toBe("summary");
        expect(fullState.charts.selectedChart).toBe("elevation");
        expect(fullState.map.baseLayer).toBe("openstreetmap");
    });

    it("warns and skips invalid final keys", () => {
        expect.assertions(3);

        resetStateManager();

        const consoleSpy = vi.spyOn(console, "warn").mockReturnValue(undefined);

        setState("test.", "value");
        setState("test..invalid", "value");

        expect(getState("test.")).toBeUndefined();
        expect(getState("test..invalid")).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(
            "[StateManager] Invalid final key for path",
            "test."
        );

        consoleSpy.mockRestore();
    });

    it("replaces primitives when merge is requested for non-objects", () => {
        expect.assertions(1);

        resetStateManager();

        setState("merge.primitive", "initial");
        setState("merge.primitive", "updated", { merge: true });

        expect(getState("merge.primitive")).toBe("updated");
    });

    it("replaces arrays when merge is requested", () => {
        expect.assertions(1);

        resetStateManager();

        setState("merge.array", [1, 2]);
        setState("merge.array", [3, 4], { merge: true });

        expect(getState("merge.array")).toStrictEqual([3, 4]);
    });

    it("creates nested object containers while setting deep paths", () => {
        expect.assertions(2);

        resetStateManager();

        setState("deep.nested.very.deeply.nested", "value");

        expect(getState("deep.nested.very.deeply.nested")).toBe("value");
        expect(getState("deep.nested.very.deeply")).toStrictEqual({
            nested: "value",
        });
    });

    it("keeps history bounded while recording the latest changes", () => {
        expect.assertions(3);

        resetStateManager();
        clearStateHistory();

        for (let i = 0; i < 60; i += 1) {
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

    it("returns undefined when traversal hits null or undefined branches", () => {
        expect.assertions(2);

        resetStateManager();

        setState("nullpath", null);
        setState("undefpath", undefined);

        expect(getState("nullpath.subpath")).toBeUndefined();
        expect(getState("undefpath.subpath")).toBeUndefined();
    });

    it("handles defensive key checks for empty segments", () => {
        expect.assertions(2);

        resetStateManager();

        setState("test..empty", "value");

        expect(getState("test..empty")).toBeUndefined();
        expect(getState("test.empty")).toBe("value");
    });

    it("ignores reset requests for non-existent paths", () => {
        expect.assertions(3);

        resetStateManager();

        expect(resetState("nonexistent.path")).toBeUndefined();
        expect(resetState("also.nonexistent")).toBeUndefined();
        expect(getRootState().ui.activeTab).toBe("summary");
    });

    it("handles reset requests when a traversal target is null", () => {
        expect.assertions(2);

        resetStateManager();

        setState("nulltest", null);

        expect(resetState("nulltest.subpath")).toBeUndefined();
        expect(getState("nulltest")).toBeNull();
    });

    it("allows unsubscribe after the callback path is removed", () => {
        expect.assertions(2);

        resetStateManager();

        const callback = createStateListener();
        const unsubscribe = subscribe("temp.path", callback);

        resetState("temp.path");

        expect(unsubscribe()).toBeUndefined();
        expect(getSubscriptions().paths).not.toContain("temp.path");
    });

    it("logs state changes with the update source", () => {
        expect.assertions(3);

        resetStateManager();

        const consoleSpy = vi.spyOn(console, "log").mockReturnValue(undefined);

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
            expect.objectContaining({
                newValue: "value",
                oldValue: undefined,
            })
        );

        consoleSpy.mockRestore();
    });
});

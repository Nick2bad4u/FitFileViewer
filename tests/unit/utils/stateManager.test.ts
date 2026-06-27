import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    __resetStateManagerForTests,
    clearStateHistory,
    getState,
    getStateHistory,
    getSubscriptions,
    resetState,
    setState,
    subscribe,
    subscribeSingleton,
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

function getRootStateRecord(): Record<string, unknown> {
    return getState<Record<string, unknown>>("") as Record<string, unknown>;
}

function getRequiredState<T>(value: T | undefined, path: string): T {
    if (value === undefined) {
        throw new Error(`Expected state at path: ${path}`);
    }

    return value;
}

function getStableHistoryEntry(entry = getStateHistory().at(-1)) {
    if (!entry) {
        throw new TypeError("Expected state history entry");
    }

    return {
        newValue: entry.newValue,
        oldValue: entry.oldValue,
        path: entry.path,
        source: entry.source,
        timestampType: typeof entry.timestamp,
    };
}

describe("state manager core", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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

    it("normalizes renderer active-tab writes at the core state boundary", () => {
        expect.assertions(4);

        resetStateManager();

        setState("ui.activeTab", "map");
        expect(getState("ui.activeTab")).toBe("map");

        setState("ui.activeTab", "table");
        expect(getState("ui.activeTab")).toBe("summary");

        setState("ui.activeTabContent", "data");
        expect(getState("ui.activeTabContent")).toBe("data");

        setState("ui.activeTabContent", "table");
        expect(getState("ui.activeTabContent")).toBe("summary");
    });

    it("normalizes active-tab values when replacing the UI state branch", () => {
        expect.assertions(3);

        resetStateManager();

        setState("ui", {
            activeTab: "charts",
            activeTabContent: "table",
            controlsEnabled: true,
        });

        expect(getState("ui.activeTab")).toBe("summary");
        expect(getState("ui.activeTabContent")).toBe("summary");
        expect(getState("ui.controlsEnabled")).toBe(true);
    });

    it("normalizes browser lifecycle writes at the core state boundary", () => {
        expect.assertions(3);

        resetStateManager();

        setState("browser.view", "timeline");
        setState("browser.listing", {
            fileCount: Number.NaN,
            folderCount: 3,
            itemCount: -1,
            status: "loaded",
        });
        setState("browser.scan", {
            decodedActivityCount: 2,
            processedFileCount: Number.POSITIVE_INFINITY,
            status: "decoding",
        });

        expect(getState("browser.view")).toBe("files");
        expect(getState("browser.listing")).toStrictEqual({
            error: null,
            fileCount: 0,
            folderCount: 3,
            itemCount: 0,
            loadedAt: null,
            relPath: "",
            root: null,
            status: "loaded",
        });
        expect(getState("browser.scan")).toStrictEqual({
            decodedActivityCount: 2,
            error: null,
            fileCount: 0,
            processedFileCount: 0,
            root: null,
            scannedAt: null,
            status: "decoding",
        });
    });

    it("normalizes browser state values when replacing the browser branch", () => {
        expect.assertions(4);

        resetStateManager();

        setState("browser", {
            listing: "bad",
            relPath: "2026/june",
            scan: [],
            view: "bad",
        });

        expect(getState("browser.view")).toBe("files");
        expect(getState("browser.relPath")).toBe("2026/june");
        expect(getState("browser.listing")).toStrictEqual({
            error: null,
            fileCount: 0,
            folderCount: 0,
            itemCount: 0,
            loadedAt: null,
            relPath: "",
            root: null,
            status: "idle",
        });
        expect(getState("browser.scan")).toStrictEqual({
            decodedActivityCount: 0,
            error: null,
            fileCount: 0,
            processedFileCount: 0,
            root: null,
            scannedAt: null,
            status: "idle",
        });
    });

    it("normalizes FIT-file loading lifecycle writes at the core state boundary", () => {
        expect.assertions(3);

        resetStateManager();

        setState("fitFile.loadingPhase", "queued");
        setState("fitFile.loadingProgress", 143.6);
        setState("fitFile.loadingState", {
            error: 404,
            filePath: "C:/rides/current.fit",
            phase: "rendering",
            progress: Number.NaN,
            startedAt: "yesterday",
            updatedAt: 1234,
        });

        expect(getState("fitFile.loadingPhase")).toBe("idle");
        expect(getState("fitFile.loadingProgress")).toBe(100);
        expect(getState("fitFile.loadingState")).toStrictEqual({
            error: null,
            filePath: "C:/rides/current.fit",
            phase: "rendering",
            progress: 0,
            startedAt: null,
            updatedAt: 1234,
        });
    });

    it("normalizes FIT-file loading values when replacing the FIT branch", () => {
        expect.assertions(4);

        resetStateManager();

        setState("fitFile", {
            currentFile: "C:/rides/current.fit",
            loadingPhase: "queued",
            loadingProgress: -20,
            loadingState: {
                error: "bad file",
                filePath: false,
                phase: "loaded",
                progress: 99.6,
                startedAt: Number.POSITIVE_INFINITY,
                updatedAt: 5678,
            },
        });

        expect(getState("fitFile.currentFile")).toBe("C:/rides/current.fit");
        expect(getState("fitFile.loadingPhase")).toBe("idle");
        expect(getState("fitFile.loadingProgress")).toBe(0);
        expect(getState("fitFile.loadingState")).toStrictEqual({
            error: "bad file",
            filePath: null,
            phase: "loaded",
            progress: 100,
            startedAt: null,
            updatedAt: 5678,
        });
    });

    it("returns undefined for non-existent state paths", () => {
        expect.assertions(1);

        resetStateManager();

        expect({
            hasNonexistentRoot: Object.hasOwn(
                getRootStateRecord(),
                "nonexistent"
            ),
            missingValue: getState("nonexistent.path"),
        }).toStrictEqual({
            hasNonexistentRoot: false,
            missingValue: undefined,
        });
    });

    it("handles null and undefined values", () => {
        expect.assertions(1);

        resetStateManager();

        setState("test.null", null);
        setState("test.undefined", undefined);

        const testState = getRootStateRecord().test as Record<string, unknown>;
        expect({
            hasUndefinedKey: Object.hasOwn(testState, "undefined"),
            nullValue: getState("test.null"),
            undefinedValue: getState("test.undefined"),
        }).toStrictEqual({
            hasUndefinedKey: true,
            nullValue: null,
            undefinedValue: undefined,
        });
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
        const result = getRequiredState(
            getState<typeof complexObject>("complex"),
            "complex"
        );

        expect(result).toBe(complexObject);
        expect(result.array).toStrictEqual([
            1,
            2,
            3,
        ]);
        expect(result.nested.prop).toBe("value");
        expect(result.func).toBeTypeOf("function");
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
        expect(getStableHistoryEntry()).toStrictEqual({
            newValue: "value",
            oldValue: undefined,
            path: "test.source",
            source: "test-suite",
            timestampType: "number",
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
        expect(getStableHistoryEntry()).toStrictEqual({
            newValue: "updated",
            oldValue: "initial",
            path: "test.old-value",
            source: "unknown",
            timestampType: "number",
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

    it("replaces singleton subscriptions without publishing a global registry", () => {
        expect.assertions(5);

        resetStateManager();

        const firstSubscriber = createStateListener();
        const secondSubscriber = createStateListener();

        subscribeSingleton("test.singleton", "same-id", firstSubscriber);
        subscribeSingleton("test.singleton", "same-id", secondSubscriber);

        setState("test.singleton", "value");

        expect(firstSubscriber).not.toHaveBeenCalled();
        expect(secondSubscriber).toHaveBeenCalledWith(
            "value",
            undefined,
            "test.singleton"
        );
        expect(
            getSubscriptions().subscriptionDetails["test.singleton"]
        ).toStrictEqual({
            hasListeners: true,
            listenerCount: 1,
        });
        expect("__ffvSingletonStateSubscriptions" in globalThis).toBe(false);

        resetStateManager();

        expect(getSubscriptions().paths).not.toContain("test.singleton");
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

        const result = getRequiredState(
            getState<CircularState>("circular"),
            "circular"
        );

        expect(result).toBe(circular);
        expect(result.prop).toBe("value");
        expect(result.self).toBe(result);
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

        expect(getState<Record<string, number>>("performance.test")["99"]).toBe(
            99
        );
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
        expect(getStableHistoryEntry()).toStrictEqual({
            newValue: { b: 3, c: 4 },
            oldValue: { a: 1, b: 2 },
            path: "merge.test",
            source: "unknown",
            timestampType: "number",
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
        expect(getStableHistoryEntry(history.at(-1))).toStrictEqual({
            newValue: "value3",
            oldValue: "value2",
            path: "history.test",
            source: "unknown",
            timestampType: "number",
        });
    });

    it("resets specific state paths", () => {
        expect.assertions(2);

        resetStateManager();

        setState("reset.test.nested", "value");

        expect(getState("reset.test.nested")).toBe("value");

        resetState("reset.test.nested");

        const resetStateBranch = getRootStateRecord().reset as
            | Record<string, unknown>
            | undefined;
        const resetTestBranch = resetStateBranch?.test as
            | Record<string, unknown>
            | undefined;
        expect({
            hasNestedKey: resetTestBranch
                ? Object.hasOwn(resetTestBranch, "nested")
                : false,
            resetValue: getState("reset.test.nested"),
        }).toStrictEqual({
            hasNestedKey: false,
            resetValue: undefined,
        });
    });

    it("resets the full state to defaults", () => {
        expect.assertions(2);

        resetStateManager();

        setState("reset.global", "value");

        expect(getState("reset.global")).toBe("value");

        resetState();

        expect({
            activeTab: getRootState().ui.activeTab,
            hasResetRoot: Object.hasOwn(getRootStateRecord(), "reset"),
            resetValue: getState("reset.global"),
        }).toStrictEqual({
            activeTab: "summary",
            hasResetRoot: false,
            resetValue: undefined,
        });
    });

    it("returns the root state for empty getState paths", () => {
        expect.assertions(6);

        resetStateManager();

        const fullState = getRootState();

        expect(fullState.ui.activeTab).toBe("summary");
        expect(fullState.ui.activeTabContent).toBe("summary");
        expect(fullState.charts.selectedChart).toBe("elevation");
        expect(fullState.map.baseLayer).toBe("openstreetmap");
        expect(fullState.ui.tabReadiness.data).toStrictEqual({
            error: null,
            status: "idle",
            updatedAt: null,
        });
        expect(fullState.browser.listing).toStrictEqual({
            error: null,
            fileCount: 0,
            folderCount: 0,
            itemCount: 0,
            loadedAt: null,
            relPath: "",
            root: null,
            status: "idle",
        });
    });

    it("warns and skips invalid final keys", () => {
        expect.assertions(2);

        resetStateManager();

        const consoleSpy = vi.spyOn(console, "warn").mockReturnValue(undefined);

        setState("test.", "value");
        setState("test..invalid", "value");

        const testState = getRootStateRecord().test as Record<string, unknown>;
        expect({
            compressedInvalidValue: getState("test.invalid"),
            emptyFinalValue: getState("test."),
            emptySegmentValue: getState("test..invalid"),
            hasCompressedInvalidKey: Object.hasOwn(testState, "invalid"),
        }).toStrictEqual({
            compressedInvalidValue: "value",
            emptyFinalValue: undefined,
            emptySegmentValue: undefined,
            hasCompressedInvalidKey: true,
        });
        expect(consoleSpy).toHaveBeenCalledExactlyOnceWith(
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
        expect(getStableHistoryEntry(history[0])).toStrictEqual({
            newValue: "value10",
            oldValue: undefined,
            path: "history.stress.10",
            source: "unknown",
            timestampType: "number",
        });
        expect(getStableHistoryEntry(history.at(-1))).toStrictEqual({
            newValue: "value59",
            oldValue: undefined,
            path: "history.stress.59",
            source: "unknown",
            timestampType: "number",
        });
    });

    it("returns undefined when traversal hits null or undefined branches", () => {
        expect.assertions(1);

        resetStateManager();

        setState("nullpath", null);
        setState("undefpath", undefined);

        expect({
            hasUndefParent: Object.hasOwn(getRootStateRecord(), "undefpath"),
            nullParent: getState("nullpath"),
            nullSubpath: getState("nullpath.subpath"),
            undefinedSubpath: getState("undefpath.subpath"),
        }).toStrictEqual({
            hasUndefParent: true,
            nullParent: null,
            nullSubpath: undefined,
            undefinedSubpath: undefined,
        });
    });

    it("handles defensive key checks for empty segments", () => {
        expect.assertions(1);

        resetStateManager();

        setState("test..empty", "value");

        const testState = getRootStateRecord().test as Record<string, unknown>;
        expect({
            compressedEmptyValue: getState("test.empty"),
            emptySegmentValue: getState("test..empty"),
            hasCompressedEmptyKey: Object.hasOwn(testState, "empty"),
        }).toStrictEqual({
            compressedEmptyValue: "value",
            emptySegmentValue: undefined,
            hasCompressedEmptyKey: true,
        });
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
        expect(getStableHistoryEntry()).toStrictEqual({
            newValue: "value",
            oldValue: undefined,
            path: "log.test",
            source: "test-source",
            timestampType: "number",
        });
        expect(consoleSpy).toHaveBeenCalledWith(
            "[StateManager] log.test updated by test-source:",
            {
                newValue: "value",
                oldValue: undefined,
            }
        );

        consoleSpy.mockRestore();
    });
});

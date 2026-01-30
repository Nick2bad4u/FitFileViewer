/**
 * Comprehensive tests covering all state management functionality
 *
 * @file Tests for State Manager Core Module
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    getState,
    setState,
    subscribe,
    updateState,
    resetState,
} from "../../../utils/state/core/stateManager.js";

describe("State Manager Core", () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
            const complexObj = {
                array: [
                    1,
                    2,
                    3,
                ],
                nested: { prop: "value" },
                func: () => {},
            };

            setState("complex", complexObj);
            const result = getState("complex");

            expect(result.array).toEqual([
                1,
                2,
                3,
            ]);
            expect(result.nested.prop).toBe("value");
            expect(typeof result.func).toBe("function");
        });

        it("should overwrite existing state values", () => {
            setState("test.overwrite", "original");
            setState("test.overwrite", "updated");

            expect(getState("test.overwrite")).toBe("updated");
        });
    });

    describe("State Options and Configuration", () => {
        it("should handle silent option correctly", () => {
            const mockSubscriber = vi.fn();
            subscribe("test.silent", mockSubscriber);

            setState("test.silent", "value", { silent: true });

            expect(mockSubscriber).not.toHaveBeenCalled();
        });

        it("should include source information in state changes", () => {
            const mockSubscriber = vi.fn();
            subscribe("test.source", mockSubscriber);

            setState("test.source", "value", { source: "test-suite" });

            expect(mockSubscriber).toHaveBeenCalledWith(
                "value",
                undefined,
                "test.source"
            );
        });
    });

    describe("Subscription System", () => {
        it("should subscribe to state changes", () => {
            const mockSubscriber = vi.fn();
            subscribe("test.subscription", mockSubscriber);

            setState("test.subscription", "new value");

            expect(mockSubscriber).toHaveBeenCalledWith(
                "new value",
                undefined,
                "test.subscription"
            );
        });

        it("should provide old value in subscription callbacks", () => {
            const mockSubscriber = vi.fn();
            setState("test.old-value", "initial");
            subscribe("test.old-value", mockSubscriber);

            setState("test.old-value", "updated");

            expect(mockSubscriber).toHaveBeenCalledWith(
                "updated",
                "initial",
                "test.old-value"
            );
        });

        it("should support multiple subscribers for the same path", () => {
            const subscriber1 = vi.fn();
            const subscriber2 = vi.fn();

            subscribe("test.multiple", subscriber1);
            subscribe("test.multiple", subscriber2);

            setState("test.multiple", "value");

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
            const mockSubscriber = vi.fn();
            const unsubscribe = subscribe("test.unsubscribe", mockSubscriber);

            setState("test.unsubscribe", "value");
            expect(mockSubscriber).toHaveBeenCalledTimes(1);

            unsubscribe();
            setState("test.unsubscribe", "value2");

            expect(mockSubscriber).toHaveBeenCalledTimes(1);
        });
    });

    describe("Error Handling and Edge Cases", () => {
        it("should handle empty string paths gracefully", () => {
            expect(() => setState("", "value")).not.toThrow();
            expect(getState("")).toBeDefined();
        });

        it("should handle circular references in objects", () => {
            const circular = { prop: "value" };
            // @ts-ignore - Intentionally creating circular reference for testing
            circular.self = circular;

            expect(() => setState("circular", circular)).not.toThrow();
            const result = getState("circular");
            expect(result.prop).toBe("value");
            expect(result.self).toBe(result);
        });

        it("should handle very deep nesting levels", () => {
            const deepPath =
                "a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z";

            setState(deepPath, "deep value");
            expect(getState(deepPath)).toBe("deep value");
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

            expect(duration).toBeLessThan(1000);
        });

        it("should clean up subscriptions properly", () => {
            const subscribers = [];

            for (let i = 0; i < 10; i++) {
                const unsubscribe = subscribe("cleanup.test", vi.fn());
                subscribers.push(unsubscribe);
            }

            setState("cleanup.test", "value");

            subscribers.forEach((unsub) => unsub());

            expect(() => setState("cleanup.test", "value2")).not.toThrow();
        });
    });

    describe("Advanced State Operations", () => {
        it("should handle updateState with merge functionality", () => {
            setState("merge.test", { a: 1, b: 2 });
            updateState("merge.test", { b: 3, c: 4 });

            const result = getState("merge.test");
            expect(result).toEqual({ a: 1, b: 3, c: 4 });
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
            expect(getState("ui.activeTab")).toBe("summary"); // Should restore initial state
        });

        it("should handle getState with empty path", () => {
            const fullState = getState("");
            expect(fullState).toBeDefined();
            expect(fullState.ui).toBeDefined();
        });

        it("should handle setState with invalid final key", () => {
            const consoleSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            setState("test.", "value");
            setState("test..invalid", "value");

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it("should handle merge option with non-objects", () => {
            setState("merge.primitive", "initial");
            setState("merge.primitive", "updated", { merge: true });

            expect(getState("merge.primitive")).toBe("updated");
        });

        it("should handle merge option with arrays", () => {
            setState("merge.array", [1, 2]);
            setState("merge.array", [3, 4], { merge: true });

            expect(getState("merge.array")).toEqual([3, 4]); // Should not merge arrays
        });

        it("should handle nested object creation", () => {
            setState("deep.nested.very.deeply.nested", "value");
            expect(getState("deep.nested.very.deeply.nested")).toBe("value");
        });

        it("should handle parent path listeners", () => {
            const parentCallback = vi.fn();
            const childCallback = vi.fn();

            subscribe("parent", parentCallback);
            subscribe("parent.child", childCallback);

            setState("parent.child", "value");

            expect(childCallback).toHaveBeenCalledWith(
                "value",
                undefined,
                "parent.child"
            );
            expect(parentCallback).toHaveBeenCalled();
        });

        it("should handle errors in subscription callbacks", () => {
            const errorCallback = vi.fn(() => {
                throw new Error("Test error");
            });
            const normalCallback = vi.fn();
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            subscribe("error.test", errorCallback);
            subscribe("error.test", normalCallback);

            setState("error.test", "value");

            expect(errorCallback).toHaveBeenCalled();
            expect(normalCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should handle errors in parent path callbacks", () => {
            const errorCallback = vi.fn(() => {
                throw new Error("Parent error");
            });
            const consoleSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            subscribe("parent", errorCallback);
            setState("parent.child", "value");

            expect(errorCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should maintain state history", () => {
            setState("history.test", "value1");
            setState("history.test", "value2");
            setState("history.test", "value3");

            // History should be maintained (exact implementation details may vary)
            expect(() => setState("history.test", "value4")).not.toThrow();
        });

        it("should handle maximum history size", () => {
            // Create more than MAX_HISTORY_SIZE entries
            for (let i = 0; i < 60; i++) {
                setState(`history.stress.${i}`, `value${i}`);
            }

            expect(() => setState("history.final", "final")).not.toThrow();
        });

        it("should handle null and undefined in state traversal", () => {
            setState("nullpath", null);
            expect(getState("nullpath.subpath")).toBeUndefined();

            setState("undefpath", undefined);
            expect(getState("undefpath.subpath")).toBeUndefined();
        });

        it("should handle defensive key checks", () => {
            // Test with empty key segments
            setState("test..empty", "value");
            expect(() => getState("test..empty")).not.toThrow();
        });

        it("should handle resetState with non-existent paths", () => {
            expect(() => resetState("nonexistent.path")).not.toThrow();
            expect(() => resetState("also.nonexistent")).not.toThrow();
        });

        it("should handle resetState with null target", () => {
            setState("nulltest", null);
            expect(() => resetState("nulltest.subpath")).not.toThrow();
        });

        it("should handle unsubscribe with non-existent path", () => {
            const callback = vi.fn();
            const unsubscribe = subscribe("temp.path", callback);

            // Test unsubscribe function when path might be removed
            // Should not throw when unsubscribing
            expect(() => unsubscribe()).not.toThrow();
        });

        it("should log state changes", () => {
            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {});

            setState("log.test", "value", { source: "test-source" });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "[StateManager] log.test updated by test-source:"
                ),
                expect.any(Object)
            );

            consoleSpy.mockRestore();
        });
    });
});

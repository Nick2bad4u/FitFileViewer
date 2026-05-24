/**
 * @file Simple State Manager Test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    __resetStateManagerForTests,
    clearStateHistory,
    getState,
    getStateHistory,
    setState,
    subscribe,
} from "../../../utils/state/core/stateManager.js";

describe("State Manager Simple Test", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        __resetStateManagerForTests();
        clearStateHistory();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        __resetStateManagerForTests();
    });

    it("sets nested state, notifies subscribers, and stops after unsubscribe", () => {
        const listener = vi.fn();
        const unsubscribe = subscribe("ui.activeTab", listener);

        setState("ui.activeTab", "map", {
            source: "stateManager.simple.test",
        });

        expect(getState("ui.activeTab")).toBe("map");
        expect(listener).toHaveBeenCalledWith("map", "summary", "ui.activeTab");
        expect(getStateHistory()).toEqual([
            expect.objectContaining({
                newValue: "map",
                oldValue: "summary",
                path: "ui.activeTab",
                source: "stateManager.simple.test",
            }),
        ]);

        unsubscribe();
        listener.mockClear();

        setState("ui.activeTab", "table", {
            source: "stateManager.simple.test",
        });

        expect(getState("ui.activeTab")).toBe("table");
        expect(listener).not.toHaveBeenCalled();
    });

    it("warns and leaves state unchanged for an invalid path", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        setState("", "ignored", {
            source: "stateManager.simple.invalid",
        });

        expect(warnSpy).toHaveBeenCalledWith(
            "[StateManager] Invalid final key for path",
            ""
        );
        expect(getState("")).not.toBe("ignored");
    });
});

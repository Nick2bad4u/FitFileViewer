// State manager subscription behavior tests.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    __resetStateManagerForTests,
    clearStateHistory,
    getState,
    getStateHistory,
    setState,
    subscribe,
} from "../../../electron-app/utils/state/core/stateManager.js";

describe("state manager subscriptions", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockReturnValue(undefined);
        vi.spyOn(console, "warn").mockReturnValue(undefined);
        __resetStateManagerForTests();
        clearStateHistory();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        __resetStateManagerForTests();
    });

    it("sets nested state, notifies subscribers, and stops after unsubscribe", () => {
        expect.assertions(5);

        const listener =
            vi.fn<
                (newValue: unknown, oldValue: unknown, path: string) => void
            >();
        const unsubscribe = subscribe("ui.activeTab", listener);

        setState("ui.activeTab", "map", {
            source: "stateManager.subscriptions.test",
        });

        expect(getState("ui.activeTab")).toBe("map");
        expect(listener).toHaveBeenCalledWith("map", "summary", "ui.activeTab");
        expect(
            getStateHistory().map(({ newValue, oldValue, path, source }) => ({
                newValue,
                oldValue,
                path,
                source,
            }))
        ).toStrictEqual([
            {
                newValue: "map",
                oldValue: "summary",
                path: "ui.activeTab",
                source: "stateManager.subscriptions.test",
            },
        ]);

        unsubscribe();
        listener.mockClear();

        setState("ui.activeTab", "table", {
            source: "stateManager.subscriptions.test",
        });

        expect(getState("ui.activeTab")).toBe("summary");
        expect(listener).not.toHaveBeenCalled();
    });

    it("warns and leaves state unchanged for an invalid path", () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        setState("", "ignored", {
            source: "stateManager.subscriptions.invalid",
        });

        expect(warnSpy).toHaveBeenCalledWith(
            "[StateManager] Invalid final key for path",
            ""
        );
        expect(getState("")).not.toBe("ignored");
    });
});

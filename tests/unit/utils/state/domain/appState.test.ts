import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    appState,
    setState,
    STATE_EVENTS,
    subscribe,
} from "../../../../../electron-app/utils/state/domain/appState.js";

type RootState = {
    ui: {
        activeTab: string;
    };
};

function getRootState(): RootState {
    return appState.get("") as RootState;
}

describe("legacy appState domain manager", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockReturnValue(undefined);
        vi.spyOn(console, "warn").mockReturnValue(undefined);
        appState.reset();
    });

    afterEach(() => {
        appState.reset();
        vi.restoreAllMocks();
    });

    it("keeps state fields as plain data properties", () => {
        expect.assertions(3);

        const descriptor = Object.getOwnPropertyDescriptor(
            getRootState().ui,
            "activeTab"
        );

        expect(descriptor?.get).toBeUndefined();
        expect(descriptor?.set).toBeUndefined();
        expect(descriptor?.writable).toBe(true);
    });

    it("emits path and domain events directly from set", () => {
        expect.assertions(4);

        const pathListener = vi.fn();
        const tabListener = vi.fn();
        const unsubscribePath = subscribe("ui.activeTab-changed", pathListener);
        const unsubscribeTab = subscribe(STATE_EVENTS.TAB_CHANGED, tabListener);

        expect(setState("ui.activeTab", "map")).toBe(true);

        expect(getRootState().ui.activeTab).toBe("map");
        expect(pathListener).toHaveBeenCalledWith({
            newValue: "map",
            oldValue: "summary",
            path: "ui.activeTab",
            timestamp: expect.any(Number),
        });
        expect(tabListener).toHaveBeenCalledWith({
            previousTab: "summary",
            tab: "map",
        });

        unsubscribePath();
        unsubscribeTab();
    });
});

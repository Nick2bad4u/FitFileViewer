import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    MAP_THEME_EVENTS,
    registerMapThemeToggleUpdater,
    resetMapThemeToggleStateForTests,
} from "../../../../../electron-app/utils/theming/specific/mapThemeToggleState.js";

describe("mapThemeToggleState", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetMapThemeToggleStateForTests();
        document.body.replaceChildren();
    });

    afterEach(() => {
        resetMapThemeToggleStateForTests();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("installs document listeners once and invokes the latest registered updater", () => {
        expect.assertions(4);

        let firstUpdates = 0;
        let secondUpdates = 0;
        const addEventListenerSpy = vi.spyOn(document, "addEventListener");

        registerMapThemeToggleUpdater(() => {
            firstUpdates += 1;
        });
        registerMapThemeToggleUpdater(() => {
            secondUpdates += 1;
        });

        document.dispatchEvent(new CustomEvent(MAP_THEME_EVENTS.CHANGED));
        vi.advanceTimersByTime(50);

        expect(firstUpdates).toBe(0);
        expect(secondUpdates).toBe(1);
        expect(
            addEventListenerSpy.mock.calls.filter(
                ([eventName]) =>
                    eventName === "themechange" ||
                    eventName === MAP_THEME_EVENTS.CHANGED
            )
        ).toHaveLength(2);
        expect(MAP_THEME_EVENTS.CHANGED).toBe("mapThemeChanged");
    });

    it("reset aborts listeners and cancels pending updates", () => {
        expect.assertions(2);

        let updates = 0;
        registerMapThemeToggleUpdater(() => {
            updates += 1;
        });

        document.dispatchEvent(new CustomEvent(MAP_THEME_EVENTS.CHANGED));
        resetMapThemeToggleStateForTests();
        vi.advanceTimersByTime(50);

        expect(updates).toBe(0);

        document.dispatchEvent(new CustomEvent(MAP_THEME_EVENTS.CHANGED));
        vi.advanceTimersByTime(50);

        expect(updates).toBe(0);
    });
});

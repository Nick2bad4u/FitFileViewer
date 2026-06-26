import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    MAP_THEME_EVENTS,
    registerMapThemeToggleUpdater,
    resetMapThemeToggleStateForTests,
} from "../../../../../electron-app/utils/theming/specific/mapThemeToggleState.js";
import type {
    MapThemeToggleRuntime,
    MapThemeToggleTimerHandle,
} from "../../../../../electron-app/utils/theming/specific/mapThemeToggleRuntime.js";

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

    it("uses an injected runtime for listeners, timers, and reset cleanup", () => {
        expect.assertions(8);

        const listeners = new Map<string, EventListener>();
        const timer = 7 as MapThemeToggleTimerHandle;
        let scheduledCallback: (() => void) | undefined;
        const abortController = new AbortController();
        const clearTimeout =
            vi.fn<(handle: MapThemeToggleTimerHandle) => void>();
        const runtime: MapThemeToggleRuntime = {
            addDocumentListener: vi.fn((eventName, listener) => {
                listeners.set(eventName, listener);
            }),
            clearTimeout,
            createAbortController: vi.fn(() => abortController),
            createElement: vi.fn((tagName) => document.createElement(tagName)),
            createMapThemeChangedEvent: vi.fn(
                (eventName, inverted) =>
                    new CustomEvent(eventName, {
                        detail: { inverted },
                    })
            ),
            createSvgElement: vi.fn((tagName) =>
                document.createElementNS("http://www.w3.org/2000/svg", tagName)
            ),
            dispatchDocumentEvent: vi.fn((event) =>
                document.dispatchEvent(event)
            ),
            findExistingToggle: vi.fn(() => null),
            isBodyThemeDark: vi.fn(() => false),
            setTimeout: vi.fn((callback) => {
                scheduledCallback = callback;
                return timer;
            }),
        };
        let updates = 0;

        registerMapThemeToggleUpdater(() => {
            updates += 1;
        }, runtime);

        listeners.get(MAP_THEME_EVENTS.CHANGED)?.(
            new CustomEvent(MAP_THEME_EVENTS.CHANGED)
        );

        expect(runtime.createAbortController).toHaveBeenCalledOnce();
        expect(runtime.addDocumentListener).toHaveBeenCalledTimes(2);
        expect(runtime.setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            50
        );
        expect(updates).toBe(0);
        expect(scheduledCallback).toBeTypeOf("function");

        resetMapThemeToggleStateForTests(runtime);

        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(abortController.signal.aborted).toBe(true);
        expect(MAP_THEME_EVENTS.CHANGED).toBe("mapThemeChanged");
    });
});

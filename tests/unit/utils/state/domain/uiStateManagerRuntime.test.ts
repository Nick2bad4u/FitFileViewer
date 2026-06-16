import { describe, expect, it, vi } from "vitest";

import { getUIStateManagerRuntime } from "../../../../../electron-app/utils/state/domain/uiStateManagerRuntime.js";

describe("uiStateManagerRuntime", () => {
    it("creates abort controllers through the scoped runtime", () => {
        expect.assertions(2);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }

        const runtime = getUIStateManagerRuntime({
            getAbortController: () =>
                TestAbortController as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(created).toBe(true);
    });

    it("throws when abort controllers are unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getUIStateManagerRuntime({}).createAbortController()
        ).toThrow("UI state manager requires an AbortController runtime");
    });

    it("resolves system theme media queries from the scoped runtime", () => {
        expect.assertions(3);

        const mediaQuery = { matches: true } as MediaQueryList;
        const scopedMatchMedia = vi.fn(() => mediaQuery);

        expect(
            getUIStateManagerRuntime({
                getMatchMedia: () => scopedMatchMedia,
            }).getSystemThemeMediaQuery()
        ).toBe(mediaQuery);
        expect(scopedMatchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
        expect(
            getUIStateManagerRuntime({}).getSystemThemeMediaQuery()
        ).toBeNull();
    });

    it("ignores direct scoped matchMedia when no provider is scoped", () => {
        expect.assertions(2);

        const mediaQuery = { matches: false } as MediaQueryList;
        const directMatchMedia = vi.fn(() => mediaQuery);

        expect(
            getUIStateManagerRuntime({
                matchMedia: directMatchMedia,
            } as unknown as Parameters<
                typeof getUIStateManagerRuntime
            >[0]).getSystemThemeMediaQuery()
        ).toBeNull();
        expect(directMatchMedia).not.toHaveBeenCalled();
    });

    it("routes window listeners through the scoped event target provider", () => {
        expect.assertions(4);

        const addEventListener = vi.fn();
        const directAddEventListener = vi.fn();
        const runtime = getUIStateManagerRuntime({
            getEventTarget: () => ({ addEventListener }),
            eventTarget: {
                addEventListener: directAddEventListener,
            },
        } as unknown as Parameters<typeof getUIStateManagerRuntime>[0]);
        const listener = vi.fn();
        const options = { once: true };

        expect(runtime.hasWindow()).toBe(true);
        runtime.addWindowEventListener("resize", listener, options);

        expect(addEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(directAddEventListener).not.toHaveBeenCalled();
        expect(getUIStateManagerRuntime({}).hasWindow()).toBe(false);
    });

    it("reads window state from the scoped viewport provider", () => {
        expect.assertions(2);

        const runtime = getUIStateManagerRuntime({
            getViewportState: () => ({
                innerHeight: 800,
                innerWidth: 1200,
                outerHeight: 850,
                outerWidth: 1250,
                screen: {
                    availHeight: 1080,
                    availWidth: 1920,
                },
                screenX: 100,
                screenY: 200,
            }),
        });

        expect(runtime.getWindowState()).toStrictEqual({
            height: 800,
            maximized: false,
            width: 1200,
            x: 100,
            y: 200,
        });
        expect(
            getUIStateManagerRuntime({
                getViewportState: () => ({
                    innerHeight: 800,
                    innerWidth: 1200,
                    outerHeight: 1080,
                    outerWidth: 1920,
                    screen: {
                        availHeight: 1080,
                        availWidth: 1920,
                    },
                    screenX: 100,
                    screenY: 200,
                }),
            }).getWindowState()
        ).toMatchObject({ maximized: true });
    });

    it("returns null when scoped window state is unavailable", () => {
        expect.assertions(2);

        expect(getUIStateManagerRuntime({}).getWindowState()).toBeNull();
        expect(
            getUIStateManagerRuntime({
                getViewportState: () => ({
                    innerHeight: 800,
                    innerWidth: 1200,
                }),
            }).getWindowState()
        ).toBeNull();
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(10);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }
        const addEventListener = vi.fn();
        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
        const runtime = getUIStateManagerRuntime({
            AbortController:
                TestAbortController as unknown as typeof AbortController,
            eventTarget: { addEventListener },
            matchMedia,
            viewportState: {
                innerHeight: 800,
                innerWidth: 1200,
                outerHeight: 1080,
                outerWidth: 1920,
                screen: {
                    availHeight: 1080,
                    availWidth: 1920,
                },
                screenX: 100,
                screenY: 200,
            },
        } as unknown as Parameters<typeof getUIStateManagerRuntime>[0]);
        const listener = vi.fn();

        expect(() => runtime.createAbortController()).toThrow(
            "UI state manager requires an AbortController runtime"
        );
        expect(runtime.getSystemThemeMediaQuery()).toBeNull();
        expect(runtime.getWindowState()).toBeNull();
        expect(runtime.hasWindow()).toBe(false);
        runtime.addWindowEventListener("resize", listener);
        expect(created).toBe(false);
        expect(matchMedia).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
        expect(getUIStateManagerRuntime({}).hasWindow()).toBe(false);
        expect(getUIStateManagerRuntime({}).getWindowState()).toBeNull();
    });
});

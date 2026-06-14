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
            AbortController:
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
        expect.assertions(4);

        const mediaQuery = { matches: true } as MediaQueryList;
        const scopedMatchMedia = vi.fn(() => mediaQuery);
        const windowMatchMedia = vi.fn(
            () => ({ matches: false }) as MediaQueryList
        );

        expect(
            getUIStateManagerRuntime({
                matchMedia: scopedMatchMedia,
                window: {
                    addEventListener: vi.fn(),
                    matchMedia: windowMatchMedia,
                },
            }).getSystemThemeMediaQuery()
        ).toBe(mediaQuery);
        expect(scopedMatchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
        expect(windowMatchMedia).not.toHaveBeenCalled();
        expect(
            getUIStateManagerRuntime({}).getSystemThemeMediaQuery()
        ).toBeNull();
    });

    it("falls back to window matchMedia when no direct matcher is scoped", () => {
        expect.assertions(2);

        const mediaQuery = { matches: false } as MediaQueryList;
        const windowMatchMedia = vi.fn(() => mediaQuery);

        expect(
            getUIStateManagerRuntime({
                window: {
                    addEventListener: vi.fn(),
                    matchMedia: windowMatchMedia,
                },
            }).getSystemThemeMediaQuery()
        ).toBe(mediaQuery);
        expect(windowMatchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
    });

    it("routes window listeners through the scoped target", () => {
        expect.assertions(3);

        const addEventListener = vi.fn();
        const runtime = getUIStateManagerRuntime({
            window: {
                addEventListener,
                matchMedia: vi.fn(),
            },
        });
        const listener = vi.fn();
        const options = { once: true };

        expect(runtime.hasWindow()).toBe(true);
        runtime.addWindowEventListener("resize", listener, options);

        expect(addEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(getUIStateManagerRuntime({}).hasWindow()).toBe(false);
    });

    it("reads window state from the scoped runtime", () => {
        expect.assertions(2);

        const runtime = getUIStateManagerRuntime({
            window: {
                addEventListener: vi.fn(),
                innerHeight: 800,
                innerWidth: 1200,
                matchMedia: vi.fn(),
                outerHeight: 850,
                outerWidth: 1250,
                screen: {
                    availHeight: 1080,
                    availWidth: 1920,
                },
                screenX: 100,
                screenY: 200,
            },
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
                window: {
                    addEventListener: vi.fn(),
                    innerHeight: 800,
                    innerWidth: 1200,
                    matchMedia: vi.fn(),
                    outerHeight: 1080,
                    outerWidth: 1920,
                    screen: {
                        availHeight: 1080,
                        availWidth: 1920,
                    },
                    screenX: 100,
                    screenY: 200,
                },
            }).getWindowState()
        ).toMatchObject({ maximized: true });
    });

    it("returns null when scoped window state is unavailable", () => {
        expect.assertions(2);

        expect(getUIStateManagerRuntime({}).getWindowState()).toBeNull();
        expect(
            getUIStateManagerRuntime({
                window: {
                    addEventListener: vi.fn(),
                    matchMedia: vi.fn(),
                },
            }).getWindowState()
        ).toBeNull();
    });
});

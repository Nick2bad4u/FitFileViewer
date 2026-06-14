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
});

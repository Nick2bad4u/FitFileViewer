import { describe, expect, it, vi } from "vitest";

import { getEnableTabButtonsDebugRuntime } from "../../../../../electron-app/utils/ui/controls/enableTabButtonsDebugRuntime.js";

describe("getEnableTabButtonsDebugRuntime", () => {
    it("calls the injected computed-style function when runtime APIs are available", () => {
        expect.assertions(2);

        const element = document.createElement("button");
        const getComputedStyle = vi.fn<(element: Element) => CSSStyleDeclaration>(
            () => ({ display: "block" }) as CSSStyleDeclaration
        );
        const runtime = getEnableTabButtonsDebugRuntime({
            getComputedStyle,
            window: {},
        });

        expect(runtime.assertComputedStyleAvailable(element)).toBeUndefined();
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnableTabButtonsDebugRuntime({
            AbortController,
            window: {},
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("creates abort controllers through the injected window runtime", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            window: { AbortController },
        });

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("throws when no window runtime is available", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            getComputedStyle: () => ({ display: "block" }) as CSSStyleDeclaration,
        });

        expect(() =>
            runtime.assertComputedStyleAvailable(document.createElement("button"))
        ).toThrow("getComputedStyle not available");
    });

    it("throws when no computed-style function is available", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            window: {},
        });

        expect(() =>
            runtime.assertComputedStyleAvailable(document.createElement("button"))
        ).toThrow("getComputedStyle not available");
    });

    it("throws when the injected abort-controller runtime is invalid", () => {
        expect.assertions(1);

        const runtime = getEnableTabButtonsDebugRuntime({
            AbortController: "AbortController" as unknown as typeof AbortController,
            window: {},
        });

        expect(() => runtime.createAbortController()).toThrow(
            "enableTabButtonsDebug requires an AbortController runtime"
        );
    });
});

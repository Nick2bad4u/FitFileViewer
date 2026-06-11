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
});

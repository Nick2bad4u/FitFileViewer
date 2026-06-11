import { describe, expect, it, vi } from "vitest";

import { getUpdateControlsStateRuntime } from "../../../../../electron-app/utils/rendering/helpers/updateControlsStateRuntime.js";

describe("getUpdateControlsStateRuntime", () => {
    it("reads computed display from an injected runtime scope", () => {
        expect.assertions(2);

        const element = document.createElement("div");
        const getComputedStyle = vi.fn<(element: Element) => CSSStyleDeclaration>(
            () =>
                ({
                    display: "grid",
                }) as CSSStyleDeclaration
        );
        const runtime = getUpdateControlsStateRuntime({ getComputedStyle });

        expect(runtime.getComputedDisplay(element)).toBe("grid");
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("uses an empty display value when computed style is unavailable", () => {
        expect.assertions(1);

        const runtime = getUpdateControlsStateRuntime({});

        expect(runtime.getComputedDisplay(document.createElement("div"))).toBe(
            ""
        );
    });
});

import { describe, expect, it } from "vitest";

import { safeComputedStyle } from "../../../../../electron-app/utils/ui/controls/enableTabButtonsHelpers.js";

describe("safeComputedStyle", () => {
    it("normalizes camelCase CSS property names through computed style lookups", () => {
        expect.assertions(1);

        const button = document.createElement("button");
        button.style.pointerEvents = "none";
        document.body.append(button);

        try {
            expect(safeComputedStyle(button, "pointerEvents")).toBe("none");
        } finally {
            button.remove();
        }
    });
});

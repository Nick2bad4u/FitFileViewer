import { describe, expect, it, vi } from "vitest";

vi.mock(import("../../../utils/ui/modals/aboutModal.js"), () => ({
    modalAnimationDuration: 123,
}));

import { injectModalStyles } from "../../../utils/ui/modals/injectModalStyles.js";

describe(injectModalStyles, () => {
    it("injects the about modal stylesheet once", () => {
        expect.assertions(5);

        document.head.replaceChildren();

        injectModalStyles();
        injectModalStyles();

        const styles = document.querySelectorAll("#about-modal-styles");
        const style = styles.item(0);
        const css = style?.textContent ?? "";

        expect(styles).toHaveLength(1);
        expect(styles.item(1)).toBeNull();
        expect(style).toBeInstanceOf(HTMLStyleElement);
        expect(css).toContain(".fancy-modal");
        expect(css).toContain("123ms");
    });
});

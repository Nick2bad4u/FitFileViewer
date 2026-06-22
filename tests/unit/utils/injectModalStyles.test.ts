import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getAboutModalDocument: vi.fn<() => Document | undefined>(() => document),
}));

vi.mock(import("../../../electron-app/utils/ui/modals/aboutModal.js"), () => ({
    modalAnimationDuration: 123,
}));

vi.mock(
    import("../../../electron-app/utils/ui/modals/aboutModalRuntime.js"),
    () => ({
        getAboutModalRuntime: () => ({
            getDocument: mocks.getAboutModalDocument,
        }),
    })
);

import { injectModalStyles } from "../../../electron-app/utils/ui/modals/injectModalStyles.js";

describe(injectModalStyles, () => {
    it("injects the about modal stylesheet once", () => {
        expect.assertions(5);

        document.head.replaceChildren();
        mocks.getAboutModalDocument.mockReturnValue(document);

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

    it("fails clearly when the About modal document runtime is unavailable", () => {
        expect.assertions(2);

        document.head.replaceChildren();
        mocks.getAboutModalDocument.mockReturnValue(undefined);

        expect(() => injectModalStyles()).toThrow(
            "injectModalStyles requires a document runtime"
        );
        expect(document.querySelector("#about-modal-styles")).toBeNull();
    });
});

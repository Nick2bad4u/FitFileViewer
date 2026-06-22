import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    addEventListenerWithCleanup:
        vi.fn<
            (
                element: EventTarget | null | undefined,
                eventType: string,
                handler: EventListener | null | undefined,
                options?: AddEventListenerOptions | boolean
            ) => () => void
        >(),
    contentElement: document.createElement("section"),
    getAboutModalDocument: vi.fn<() => Document | undefined>(() => document),
    handleEscapeKey: vi.fn<(event: KeyboardEvent) => void>(),
    injectModalStyles: vi.fn<() => void>(),
    loadVersionInfo: vi.fn<() => Promise<void>>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/app/initialization/loadVersionInfo.js"),
    () => ({
        loadVersionInfo: mocks.loadVersionInfo,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/events/eventListenerManager.js"),
    () => ({
        addEventListenerWithCleanup: mocks.addEventListenerWithCleanup,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/aboutModalRuntime.js"),
    () => ({
        getAboutModalRuntime: () => ({
            getDocument: mocks.getAboutModalDocument,
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/aboutModal.js"),
    () => ({
        createAboutModalContentElement: () => mocks.contentElement,
        handleEscapeKey: mocks.handleEscapeKey,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/injectModalStyles.js"),
    () => ({
        injectModalStyles: mocks.injectModalStyles,
    })
);

const { ensureAboutModal } =
    await import("../../../../../electron-app/utils/ui/modals/ensureAboutModal.js");

describe(ensureAboutModal, () => {
    it("creates the hidden About modal and performs one-time setup", () => {
        expect.assertions(11);

        document.body.replaceChildren();
        mocks.addEventListenerWithCleanup.mockClear();
        mocks.contentElement.dataset.testid = "about-content";
        mocks.getAboutModalDocument.mockReturnValue(document);
        mocks.handleEscapeKey.mockClear();
        mocks.injectModalStyles.mockClear();
        mocks.loadVersionInfo.mockResolvedValue(undefined);

        ensureAboutModal();

        const modal = document.querySelector<HTMLDivElement>("#about-modal");

        expect(modal).toBeInstanceOf(HTMLDivElement);
        expect(modal?.className).toBe("modal fancy-modal");
        expect(modal?.getAttribute("role")).toBe("dialog");
        expect(modal?.getAttribute("aria-modal")).toBe("true");
        expect(modal?.getAttribute("aria-labelledby")).toBe(
            "about-modal-title"
        );
        expect(modal?.style.display).toBe("none");
        expect(modal?.querySelector("[data-testid='about-content']")).toBe(
            mocks.contentElement
        );
        expect(document.body.lastElementChild).toBe(modal);
        expect(mocks.addEventListenerWithCleanup).not.toHaveBeenCalled();
        expect(mocks.injectModalStyles).toHaveBeenCalledOnce();
        expect(mocks.loadVersionInfo).toHaveBeenCalledOnce();
    });

    it("does not duplicate modal setup when the modal already exists", () => {
        expect.assertions(5);

        document.body.replaceChildren();
        mocks.addEventListenerWithCleanup.mockClear();
        mocks.getAboutModalDocument.mockReturnValue(document);
        mocks.handleEscapeKey.mockClear();
        mocks.injectModalStyles.mockClear();
        mocks.loadVersionInfo.mockReset();
        const existingModal = document.createElement("div");
        existingModal.id = "about-modal";
        document.body.append(existingModal);

        ensureAboutModal();

        expect(document.querySelectorAll("#about-modal")).toHaveLength(1);
        expect(document.querySelector("#about-modal")).toBe(existingModal);
        expect(mocks.addEventListenerWithCleanup).not.toHaveBeenCalled();
        expect(mocks.injectModalStyles).not.toHaveBeenCalled();
        expect(mocks.loadVersionInfo).not.toHaveBeenCalled();
    });

    it("fails clearly when the About modal document runtime is unavailable", () => {
        expect.assertions(3);

        document.body.replaceChildren();
        mocks.getAboutModalDocument.mockReturnValue(undefined);
        mocks.injectModalStyles.mockClear();
        mocks.loadVersionInfo.mockReset();

        expect(() => ensureAboutModal()).toThrow(
            "ensureAboutModal requires a document runtime"
        );
        expect(mocks.injectModalStyles).not.toHaveBeenCalled();
        expect(mocks.loadVersionInfo).not.toHaveBeenCalled();
    });
});

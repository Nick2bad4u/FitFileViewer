import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type ModalExports = {
    showKeyboardShortcutsModal: () => void;
    closeKeyboardShortcutsModal: () => void;
};

const rafMock = vi.fn<(callback: FrameRequestCallback) => number>(
        (callback) => {
            callback(0);
            return 1;
        }
    ),
    cancelRafMock = vi.fn<(handle: number) => void>();

vi.stubGlobal("requestAnimationFrame", rafMock);
vi.stubGlobal("cancelAnimationFrame", cancelRafMock);

function resolveModalExports(
    module: Partial<ModalExports> & { default?: Partial<ModalExports> }
): ModalExports {
    const resolved = {
        closeKeyboardShortcutsModal:
            module.closeKeyboardShortcutsModal ??
            module.default?.closeKeyboardShortcutsModal,
        showKeyboardShortcutsModal:
            module.showKeyboardShortcutsModal ??
            module.default?.showKeyboardShortcutsModal,
    } satisfies Partial<ModalExports>;

    if (
        !resolved.showKeyboardShortcutsModal ||
        !resolved.closeKeyboardShortcutsModal
    ) {
        throw new Error("Failed to load keyboard shortcuts modal exports");
    }

    return resolved as ModalExports;
}

async function loadModal() {
    await vi.resetModules();
    delete (globalThis as any).showKeyboardShortcutsModal;
    delete (globalThis as any).closeKeyboardShortcutsModal;
    const module =
        await import("../../../../../electron-app/utils/ui/modals/keyboardShortcutsModal.js");
    return resolveModalExports(module);
}

function expectHTMLElement<T extends HTMLElement>(
    element: T | null | undefined,
    description: string
): T {
    expect(element, `${description} should be an HTMLElement`).toBeInstanceOf(
        HTMLElement
    );

    if (!(element instanceof HTMLElement)) {
        throw new Error(`${description} not found`);
    }

    return element;
}

function getClassList(element: Element): string[] {
    return [...element.classList];
}

describe("keyboardShortcutsModal", () => {
    afterEach(() => {
        document.body.innerHTML = "";
        document.head.innerHTML = "";
        document.body.style.overflow = "";
        delete (globalThis as any).electronAPI;
        rafMock.mockClear();
        cancelRafMock.mockClear();
        vi.useRealTimers();
    });

    it("creates and displays the modal when triggered", async () => {
        expect.assertions(10);

        const { showKeyboardShortcutsModal } = await loadModal();
        const trigger = document.createElement("button");
        trigger.textContent = "open";
        document.body.append(trigger);
        trigger.focus();

        vi.useFakeTimers();

        (globalThis as any).electronAPI = {
            openExternal: vi.fn<(url: string) => void>(),
        };

        showKeyboardShortcutsModal();

        const modal = document.querySelector<HTMLDivElement>(
            "#keyboard-shortcuts-modal"
        );
        const keyboardShortcutsModal = expectHTMLElement(
            modal,
            "keyboard shortcuts modal"
        );
        expect(keyboardShortcutsModal.id).toBe("keyboard-shortcuts-modal");
        expect(keyboardShortcutsModal.style.display).toBe("flex");
        expect(getClassList(keyboardShortcutsModal)).toContain("show");

        const closeBtn =
            keyboardShortcutsModal.querySelector<HTMLButtonElement>(
                "#shortcuts-modal-close"
            );
        const closeButton = expectHTMLElement(closeBtn, "modal close button");
        expect(closeButton.type).toBe("button");
        expect(closeButton.getAttribute("aria-label")).toBe(
            "Close Keyboard Shortcuts dialog"
        );
        expect(document.activeElement).toBe(closeBtn);
        expect(document.body.style.overflow).toBe("hidden");
        expect(
            document.querySelectorAll("#keyboard-shortcuts-modal-styles")
        ).toHaveLength(1);
    });

    it("closes modal with animation and restores focus", async () => {
        expect.assertions(8);

        const { showKeyboardShortcutsModal, closeKeyboardShortcutsModal } =
            await loadModal();
        vi.useFakeTimers();

        const trigger = document.createElement("button");
        trigger.textContent = "trigger";
        document.body.append(trigger);
        trigger.focus();

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>(
            "#keyboard-shortcuts-modal"
        );
        const keyboardShortcutsModal = expectHTMLElement(
            modal,
            "keyboard shortcuts modal"
        );
        const closeBtn =
            keyboardShortcutsModal.querySelector<HTMLButtonElement>(
                "#shortcuts-modal-close"
            );
        expectHTMLElement(closeBtn, "modal close button");

        closeKeyboardShortcutsModal();
        expect(getClassList(keyboardShortcutsModal)).not.toContain("show");

        vi.advanceTimersByTime(350);

        expect(keyboardShortcutsModal.style.display).toBe("none");
        expect(document.body.style.overflow).toBe("");
        expect(document.activeElement).toBe(trigger);

        cancelRafMock.mockClear();
        closeKeyboardShortcutsModal();

        expect(cancelRafMock).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("closes when Escape is pressed", async () => {
        expect.assertions(4);

        const { showKeyboardShortcutsModal } = await loadModal();
        vi.useFakeTimers();

        const trigger = document.createElement("button");
        document.body.append(trigger);
        trigger.focus();

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>(
            "#keyboard-shortcuts-modal"
        );
        const keyboardShortcutsModal = expectHTMLElement(
            modal,
            "keyboard shortcuts modal"
        );
        expect(keyboardShortcutsModal.style.display).toBe("flex");

        const event = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
        });
        document.dispatchEvent(event);
        vi.advanceTimersByTime(350);

        expect(keyboardShortcutsModal.style.display).toBe("none");
        expect(document.body.style.overflow).toBe("");
    });

    it("traps focus within the modal", async () => {
        expect.assertions(6);

        const { showKeyboardShortcutsModal } = await loadModal();
        vi.useFakeTimers();

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>(
            "#keyboard-shortcuts-modal"
        );
        const keyboardShortcutsModal = expectHTMLElement(
            modal,
            "keyboard shortcuts modal"
        );
        const focusable = keyboardShortcutsModal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        expect(focusable).toHaveLength(1);

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        expect(first).toBe(last);
        expect(first.id).toBe("shortcuts-modal-close");

        last.focus();
        const forwardTab = new KeyboardEvent("keydown", {
            key: "Tab",
            bubbles: true,
        });
        keyboardShortcutsModal.dispatchEvent(forwardTab);
        expect({
            activeElement: document.activeElement,
            defaultPrevented: forwardTab.defaultPrevented,
        }).toStrictEqual({
            activeElement: first,
            defaultPrevented: true,
        });

        first.focus();
        const reverseTab = new KeyboardEvent("keydown", {
            key: "Tab",
            shiftKey: true,
            bubbles: true,
        });
        keyboardShortcutsModal.dispatchEvent(reverseTab);
        expect({
            activeElement: document.activeElement,
            defaultPrevented: reverseTab.defaultPrevented,
        }).toStrictEqual({
            activeElement: last,
            defaultPrevented: true,
        });
    });

    it("opens external links via electron API", async () => {
        expect.assertions(3);

        const { showKeyboardShortcutsModal } = await loadModal();
        vi.useFakeTimers();

        const openExternal = vi.fn<(url: string) => void>();
        (globalThis as any).electronAPI = { openExternal };

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>(
            "#keyboard-shortcuts-modal"
        );
        const keyboardShortcutsModal = expectHTMLElement(
            modal,
            "keyboard shortcuts modal"
        );
        const link = document.createElement("a");
        link.href = "https://example.com";
        link.dataset.externalLink = "true";
        link.textContent = "Docs";
        keyboardShortcutsModal.append(link);

        const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        });
        link.dispatchEvent(clickEvent);

        expect(openExternal).toHaveBeenCalledWith(
            expect.stringMatching(/^https:\/\/example\.com\/?$/)
        );
        expect(clickEvent).toMatchObject({ defaultPrevented: true });
    });
});

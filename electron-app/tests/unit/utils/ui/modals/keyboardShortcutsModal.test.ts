import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type ModalExports = {
    showKeyboardShortcutsModal: () => void;
    closeKeyboardShortcutsModal: () => void;
};

const rafMock = vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
    }),
    cancelRafMock = vi.fn();

vi.stubGlobal("requestAnimationFrame", rafMock);
vi.stubGlobal("cancelAnimationFrame", cancelRafMock);

function resolveModalExports(module: Partial<ModalExports> & { default?: Partial<ModalExports> }): ModalExports {
    const resolved = {
        closeKeyboardShortcutsModal: module.closeKeyboardShortcutsModal ?? module.default?.closeKeyboardShortcutsModal,
        showKeyboardShortcutsModal: module.showKeyboardShortcutsModal ?? module.default?.showKeyboardShortcutsModal,
    } satisfies Partial<ModalExports>;

    if (!resolved.showKeyboardShortcutsModal || !resolved.closeKeyboardShortcutsModal) {
        throw new Error("Failed to load keyboard shortcuts modal exports");
    }

    return resolved as ModalExports;
}

async function loadModal() {
    await vi.resetModules();
    delete (globalThis as any).showKeyboardShortcutsModal;
    delete (globalThis as any).closeKeyboardShortcutsModal;
    const module = await import("../../../../../utils/ui/modals/keyboardShortcutsModal.js");
    return resolveModalExports(module);
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
        const { showKeyboardShortcutsModal } = await loadModal();
        const trigger = document.createElement("button");
        trigger.textContent = "open";
        document.body.append(trigger);
        trigger.focus();

        vi.useFakeTimers();

        (globalThis as any).electronAPI = { openExternal: vi.fn() };

        showKeyboardShortcutsModal();

        const modal = document.querySelector<HTMLDivElement>("#keyboard-shortcuts-modal");
        expect(modal).toBeTruthy();
        expect(modal?.style.display).toBe("flex");
        expect(modal?.classList.contains("show")).toBe(true);

        const closeBtn = modal?.querySelector<HTMLButtonElement>("#shortcuts-modal-close");
        expect(closeBtn).toBeTruthy();
        expect(document.activeElement).toBe(closeBtn);
        expect(document.body.style.overflow).toBe("hidden");
        expect(document.querySelectorAll("#keyboard-shortcuts-modal-styles").length).toBe(1);
    });

    it("closes modal with animation and restores focus", async () => {
        const { showKeyboardShortcutsModal, closeKeyboardShortcutsModal } = await loadModal();
        vi.useFakeTimers();

        const trigger = document.createElement("button");
        trigger.textContent = "trigger";
        document.body.append(trigger);
        trigger.focus();

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>("#keyboard-shortcuts-modal");
        const closeBtn = modal?.querySelector<HTMLButtonElement>("#shortcuts-modal-close");
        expect(closeBtn).toBeTruthy();

        closeKeyboardShortcutsModal();
        expect(modal?.classList.contains("show")).toBe(false);

        vi.advanceTimersByTime(350);

        expect(modal?.style.display).toBe("none");
        expect(document.body.style.overflow).toBe("");
        expect(document.activeElement).toBe(trigger);
    });

    it("closes when Escape is pressed", async () => {
        const { showKeyboardShortcutsModal } = await loadModal();
        vi.useFakeTimers();

        const trigger = document.createElement("button");
        document.body.append(trigger);
        trigger.focus();

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>("#keyboard-shortcuts-modal");
        expect(modal?.style.display).toBe("flex");

        const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
        document.dispatchEvent(event);
        vi.advanceTimersByTime(350);

        expect(modal?.style.display).toBe("none");
        expect(document.body.style.overflow).toBe("");
    });

    it("traps focus within the modal", async () => {
        const { showKeyboardShortcutsModal } = await loadModal();
        vi.useFakeTimers();

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>("#keyboard-shortcuts-modal");
        const focusable = modal?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        expect(focusable && focusable.length).toBeTruthy();
        if (!focusable) {
            throw new Error("Focusable elements not found");
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        last.focus();
        const forwardTab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
        modal?.dispatchEvent(forwardTab);
        expect(document.activeElement).toBe(first);
        expect(forwardTab.defaultPrevented).toBe(true);

        first.focus();
        const reverseTab = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
        modal?.dispatchEvent(reverseTab);
        expect(document.activeElement).toBe(last);
        expect(reverseTab.defaultPrevented).toBe(true);
    });

    it("opens external links via electron API", async () => {
        const { showKeyboardShortcutsModal } = await loadModal();
        vi.useFakeTimers();

        const openExternal = vi.fn();
        (globalThis as any).electronAPI = { openExternal };

        showKeyboardShortcutsModal();
        const modal = document.querySelector<HTMLDivElement>("#keyboard-shortcuts-modal");
        const link = document.createElement("a");
        link.href = "https://example.com";
        link.dataset.externalLink = "true";
        link.textContent = "Docs";
        modal?.append(link);

        const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
        link.dispatchEvent(clickEvent);

        expect(openExternal).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/example\.com\/?$/));
        expect(clickEvent.defaultPrevented).toBe(true);
    });
});

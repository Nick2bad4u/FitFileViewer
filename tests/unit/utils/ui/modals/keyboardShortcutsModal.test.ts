import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

const runtimeMocks = vi.hoisted(() => ({
    appendToBody: vi.fn((element: HTMLElement) => {
        document.body.append(element);
    }),
    appendToHead: vi.fn((element: HTMLElement) => {
        document.head.append(element);
    }),
    cancelAnimationFrame: vi.fn<(handle: number) => void>(),
    clearTimeout: vi.fn<typeof globalThis.clearTimeout>((handle) =>
        globalThis.clearTimeout(handle)
    ),
    createElement: vi.fn(
        <K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] => document.createElement(tagName)
    ),
    createSvgElement: vi.fn(
        <K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] =>
            document.createElementNS("http://www.w3.org/2000/svg", tagName)
    ),
    getActiveElement: vi.fn(() => document.activeElement),
    isHTMLElement: vi.fn(
        (value: unknown): value is HTMLElement => value instanceof HTMLElement
    ),
    isKeyboardEvent: vi.fn(
        (value: unknown): value is KeyboardEvent =>
            value instanceof KeyboardEvent
    ),
    querySelector: vi.fn(<K extends Element = Element>(selector: string) =>
        document.querySelector<K>(selector)
    ),
    requestAnimationFrame: vi.fn<(callback: FrameRequestCallback) => number>(
        (callback) => {
            callback(0);
            return 1;
        }
    ),
    setBodyOverflow: vi.fn((value: string) => {
        document.body.style.overflow = value;
    }),
    setTimeout: vi.fn<typeof globalThis.setTimeout>((callback, delay) =>
        globalThis.setTimeout(callback, delay)
    ),
}));

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/keyboardShortcutsModalRuntime.js"),
    () => ({
        getKeyboardShortcutsModalRuntime: () => runtimeMocks,
        KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE: "http://www.w3.org/2000/svg",
    })
);

type ModalExports = {
    showKeyboardShortcutsModal: (options?: {
        readonly electronApiScope?: RendererElectronApiScope | undefined;
    }) => void;
    closeKeyboardShortcutsModal: () => void;
};

function createElectronApiScope(api: {
    readonly openExternal: (url: string) => void;
}): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

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

function getModalDisplayState(modal: HTMLElement) {
    const describedBy = modal.getAttribute("aria-describedby"),
        labelledBy = modal.getAttribute("aria-labelledby");

    return {
        ariaDescribedBy: describedBy,
        ariaLabelledBy: labelledBy,
        ariaModal: modal.getAttribute("aria-modal"),
        categoryTitles: Array.from(
            modal.querySelectorAll(".shortcuts-category-title"),
            (title) => title.textContent
        ),
        classList: getClassList(modal),
        display: modal.style.display,
        id: modal.id,
        role: modal.getAttribute("role"),
        shortcutActions: Array.from(
            modal.querySelectorAll(".shortcut-action"),
            (action) => action.textContent
        ),
        subtitle:
            describedBy === null
                ? undefined
                : document.getElementById(describedBy)?.textContent,
        title:
            labelledBy === null
                ? undefined
                : document.getElementById(labelledBy)?.textContent,
    };
}

describe("keyboardShortcutsModal", () => {
    afterEach(() => {
        document.body.replaceChildren();
        document.head.replaceChildren();
        document.body.style.overflow = "";
        runtimeMocks.appendToBody.mockClear();
        runtimeMocks.appendToHead.mockClear();
        runtimeMocks.cancelAnimationFrame.mockClear();
        runtimeMocks.clearTimeout.mockClear();
        runtimeMocks.createElement.mockClear();
        runtimeMocks.createSvgElement.mockClear();
        runtimeMocks.getActiveElement.mockClear();
        runtimeMocks.querySelector.mockClear();
        runtimeMocks.requestAnimationFrame.mockClear();
        runtimeMocks.setBodyOverflow.mockClear();
        runtimeMocks.setTimeout.mockClear();
        vi.useRealTimers();
    });

    it("does not publish compatibility globals", async () => {
        expect.assertions(1);

        await loadModal();

        expect(
            [
                "closeKeyboardShortcutsModal",
                "showKeyboardShortcutsModal",
            ].filter((globalName) => Reflect.has(globalThis, globalName))
        ).toStrictEqual([]);
    });

    it("creates and displays the modal when triggered", async () => {
        expect.assertions(8);

        const { showKeyboardShortcutsModal } = await loadModal();
        const trigger = document.createElement("button");
        trigger.textContent = "open";
        document.body.append(trigger);
        trigger.focus();

        vi.useFakeTimers();

        const electronApiScope = createElectronApiScope({
            openExternal: vi.fn<(url: string) => void>(),
        });

        showKeyboardShortcutsModal({ electronApiScope });

        const modal = document.querySelector<HTMLDivElement>(
            "#keyboard-shortcuts-modal"
        );
        const keyboardShortcutsModal = expectHTMLElement(
            modal,
            "keyboard shortcuts modal"
        );
        expect(getModalDisplayState(keyboardShortcutsModal)).toStrictEqual({
            ariaDescribedBy: "keyboard-shortcuts-modal-subtitle",
            ariaLabelledBy: "keyboard-shortcuts-modal-title",
            ariaModal: "true",
            categoryTitles: [
                "File Operations",
                "View Controls",
                "Application",
            ],
            classList: [
                "modal",
                "fancy-modal",
                "show",
            ],
            display: "flex",
            id: "keyboard-shortcuts-modal",
            role: "dialog",
            shortcutActions: [
                "Open File",
                "Save As",
                "Print",
                "Close Window",
                "Reload",
                "Toggle Fullscreen",
                "Toggle DevTools",
                "Export",
                "Theme: Dark/Light",
            ],
            subtitle: "Boost your productivity with these keyboard shortcuts",
            title: "Keyboard Shortcuts",
        });

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
        expect(getModalDisplayState(keyboardShortcutsModal)).toStrictEqual({
            ariaDescribedBy: "keyboard-shortcuts-modal-subtitle",
            ariaLabelledBy: "keyboard-shortcuts-modal-title",
            ariaModal: "true",
            categoryTitles: [
                "File Operations",
                "View Controls",
                "Application",
            ],
            classList: ["modal", "fancy-modal"],
            display: "flex",
            id: "keyboard-shortcuts-modal",
            role: "dialog",
            shortcutActions: [
                "Open File",
                "Save As",
                "Print",
                "Close Window",
                "Reload",
                "Toggle Fullscreen",
                "Toggle DevTools",
                "Export",
                "Theme: Dark/Light",
            ],
            subtitle: "Boost your productivity with these keyboard shortcuts",
            title: "Keyboard Shortcuts",
        });

        vi.advanceTimersByTime(350);

        expect(keyboardShortcutsModal.style.display).toBe("none");
        expect(document.body.style.overflow).toBe("");
        expect(document.activeElement).toBe(trigger);

        runtimeMocks.cancelAnimationFrame.mockClear();
        closeKeyboardShortcutsModal();

        expect(runtimeMocks.cancelAnimationFrame).not.toHaveBeenCalled();
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
            bubbles: true,
            cancelable: true,
            key: "Tab",
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
            bubbles: true,
            cancelable: true,
            key: "Tab",
            shiftKey: true,
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
        const electronApiScope = createElectronApiScope({ openExternal });

        showKeyboardShortcutsModal({ electronApiScope });
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

        expect(openExternal).toHaveBeenCalledWith("https://example.com");
        expect(clickEvent.defaultPrevented).toBe(true);
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type AboutModalModules =
    typeof import("../../../../../electron-app/utils/ui/modals/ensureAboutModal.js") &
        typeof import("../../../../../electron-app/utils/ui/modals/aboutModal.js");

type AboutElectronApi = {
    openExternal: (url: string) => void;
};
type AboutElectronApiFixture = {
    aboutElectronAPI: AboutElectronApi;
    electronApiScope: RendererElectronApiScope;
};

const aboutModalRuntimeMocks = vi.hoisted(() => ({
    cancelAnimationFrame: vi.fn<(handle: number) => void>(),
    clearTimeout: vi.fn<typeof globalThis.clearTimeout>((handle) =>
        globalThis.clearTimeout(handle)
    ),
    createDocumentFragment: vi.fn(() =>
        globalThis.document.createDocumentFragment()
    ),
    createElement: vi.fn(
        <K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] =>
            globalThis.document.createElement(tagName)
    ),
    createElementTreeWalker: vi.fn((root: Node) =>
        globalThis.document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    ),
    createSvgElement: vi.fn(
        <K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] =>
            globalThis.document.createElementNS(
                "http://www.w3.org/2000/svg",
                tagName
            )
    ),
    getActiveHTMLElement: vi.fn(() =>
        globalThis.document.activeElement instanceof HTMLElement
            ? globalThis.document.activeElement
            : null
    ),
    getDocument: vi.fn<() => Document | undefined>(() => globalThis.document),
    getDocumentEventTarget: vi.fn(() => globalThis.document),
    isElement: vi.fn(
        (value: unknown): value is Element => value instanceof Element
    ),
    isHTMLElement: vi.fn(
        (value: unknown): value is HTMLElement => value instanceof HTMLElement
    ),
    isKeyboardEvent: vi.fn(
        (value: unknown): value is KeyboardEvent =>
            value instanceof KeyboardEvent
    ),
    parseHtmlDocument: vi.fn((html: string) =>
        // eslint-disable-next-line sdl/no-domparser-html-without-sanitization -- Mirrors aboutModalRuntime; production sanitizer runs immediately after parsing.
        new DOMParser().parseFromString(html, "text/html")
    ),
    queryElement: vi.fn(
        <TElement extends Element = Element>(selector: string) =>
            globalThis.document.querySelector<TElement>(selector)
    ),
    queryElements: vi.fn(
        <TElement extends Element = Element>(selector: string) =>
            globalThis.document.querySelectorAll<TElement>(selector)
    ),
    requestAnimationFrame: vi.fn<(callback: FrameRequestCallback) => number>(
        (callback) => {
            callback(0);
            return 1;
        }
    ),
    setTimeout: vi.fn<typeof globalThis.setTimeout>((callback, delay) =>
        globalThis.setTimeout(callback, delay)
    ),
}));

// Mock heavy side-effect modules before importing the subject under test
vi.mock(
    import("../../../../../electron-app/utils/app/initialization/loadVersionInfo.js"),
    () => ({
        loadVersionInfo: vi.fn<() => Promise<void>>(async () => undefined),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/injectModalStyles.js"),
    () => ({
        injectModalStyles: vi.fn<() => void>(() => {
            // No-op: avoid adding a massive style block in jsdom
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/modals/aboutModalRuntime.js"),
    () => ({
        getAboutModalRuntime: () => aboutModalRuntimeMocks,
    })
);

// Utilities to import after mocks
const importModules = async (): Promise<AboutModalModules> => {
    const ensureAboutModalMod =
        await import("../../../../../electron-app/utils/ui/modals/ensureAboutModal.js");
    const aboutModalMod =
        await import("../../../../../electron-app/utils/ui/modals/aboutModal.js");
    return { ...ensureAboutModalMod, ...aboutModalMod };
};

function getRequiredElementById(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLElement)) {
        throw new TypeError(`Expected #${id} element`);
    }

    return element;
}

function getRequiredButtonById(id: string): HTMLButtonElement {
    const button = document.getElementById(id);
    if (!(button instanceof HTMLButtonElement)) {
        throw new TypeError(`Expected #${id} button`);
    }

    return button;
}

function getRequiredExternalLink(selector: string): HTMLAnchorElement {
    const link = document.querySelector(selector);
    if (!(link instanceof HTMLAnchorElement)) {
        throw new TypeError(`Expected external link for ${selector}`);
    }

    return link;
}

function createAboutElectronApiFixture(): AboutElectronApiFixture {
    const electronAPI = {
        openExternal: vi.fn<(url: string) => void>(),
    };

    return {
        aboutElectronAPI: electronAPI,
        electronApiScope: {
            getElectronAPI: () => electronAPI,
        },
    };
}

describe("about modal UI behaviors", () => {
    let aboutElectronAPI: AboutElectronApi;
    let electronApiScope: RendererElectronApiScope;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useFakeTimers();
        document.body.replaceChildren();

        // Provide a focusable element to verify focus restoration
        const focusable = document.createElement("button");
        focusable.id = "focus-origin";
        document.body.appendChild(focusable);
        focusable.focus();

        ({ aboutElectronAPI, electronApiScope } =
            createAboutElectronApiFixture());

        for (const mock of Object.values(aboutModalRuntimeMocks)) {
            mock.mockClear();
        }
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.replaceChildren();
    });

    it("ensures modal creation, shows with content, and closes via close button", async () => {
        expect.assertions(6);

        const { ensureAboutModal, showAboutModal } = await importModules();

        ensureAboutModal();
        const modal = getRequiredElementById("about-modal");
        expect(modal).toBeInstanceOf(HTMLElement);

        // Show with custom body content
        showAboutModal('<p id="custom">Hello</p>');
        const body = getRequiredElementById("about-modal-body");
        expect(body.innerHTML).toContain("Hello");
        expect(body.innerHTML).not.toContain("Missing");

        // Close via the X button
        const closeBtn = getRequiredButtonById("about-modal-close");
        expect(closeBtn).toBeInstanceOf(HTMLButtonElement);
        closeBtn.click();

        // Advance timers to allow animation to complete
        vi.advanceTimersByTime(350);
        expect(modal.style.display).toBe("none");

        // Focus should be restored to the element focused before showing the modal
        expect(document.activeElement?.id).toBe("focus-origin");
    });

    it("renders features and system info together and loads version info", async () => {
        expect.assertions(5);

        const { ensureAboutModal, showAboutModal } = await importModules();
        const { loadVersionInfo } =
            await import("../../../../../electron-app/utils/app/initialization/loadVersionInfo.js");

        ensureAboutModal();
        showAboutModal();

        const section = getRequiredElementById("info-toggle-section");
        expect(section).toBeInstanceOf(HTMLElement);
        expect(section.innerHTML).toContain("system-info-grid");
        expect(section.innerHTML).not.toContain("missing-system-info-grid");

        const featuresPanel = document.querySelector(".about-panel--features");
        expect(featuresPanel).toBeInstanceOf(HTMLElement);

        // loadVersionInfo is called by ensureAboutModal and showAboutModal
        expect(loadVersionInfo).toHaveBeenCalledTimes(2);
    });

    it("closes on Escape key via global handler", async () => {
        expect.assertions(2);

        const { ensureAboutModal, showAboutModal } = await importModules();

        ensureAboutModal();
        showAboutModal("", { electronApiScope });

        const modal = getRequiredElementById("about-modal");
        expect(modal).toBeInstanceOf(HTMLElement);

        // Dispatch Escape on document (listener registered in ensureAboutModal)
        const evt = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
        });
        document.dispatchEvent(evt);

        vi.advanceTimersByTime(350);
        expect(modal.style.display).toBe("none");
    });

    it("handles external links using electronAPI when available", async () => {
        expect.assertions(2);

        const { ensureAboutModal, showAboutModal } = await importModules();

        ensureAboutModal();
        showAboutModal("", { electronApiScope });

        const link = getRequiredExternalLink(
            '[data-external-link][href="https://electronjs.org/"]'
        );
        expect(link).toBeInstanceOf(HTMLAnchorElement);

        link.click();
        expect(aboutElectronAPI.openExternal).toHaveBeenCalledWith(
            "https://electronjs.org/"
        );
    });

    it("does not create duplicate modal elements when ensured multiple times", async () => {
        expect.assertions(1);

        const { ensureAboutModal } = await importModules();
        ensureAboutModal();
        ensureAboutModal();
        const modals = document.querySelectorAll("#about-modal");
        expect(modals).toHaveLength(1);
    });
});

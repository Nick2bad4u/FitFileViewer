import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AboutModalModules =
    typeof import("../../../../../electron-app/utils/ui/modals/ensureAboutModal.js") &
        typeof import("../../../../../electron-app/utils/ui/modals/aboutModal.js");

type AboutElectronApi = {
    getAppVersion: () => Promise<string>;
    getChromeVersion: () => Promise<string>;
    getElectronVersion: () => Promise<string>;
    getLicenseInfo: () => Promise<string>;
    getNodeVersion: () => Promise<string>;
    getPlatformInfo: () => Promise<{ arch: string; platform: string }>;
    openExternal: (url: string) => void;
};

type AboutWindow = Window & { electronAPI: AboutElectronApi };

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

// Utilities to import after mocks
const importModules = async (): Promise<AboutModalModules> => {
    const ensureAboutModalMod =
        await import("../../../../../electron-app/utils/ui/modals/ensureAboutModal.js");
    const aboutModalMod =
        await import("../../../../../electron-app/utils/ui/modals/aboutModal.js");
    return { ...ensureAboutModalMod, ...aboutModalMod };
};

// Helpers
const rafImmediate = (): void => {
    // Execute RAF callbacks immediately to allow class toggles and transitions
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
        cb(0);
        return 1;
    };
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

describe("about modal UI behaviors", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useFakeTimers();
        document.body.replaceChildren();

        // Provide a focusable element to verify focus restoration
        const focusable = document.createElement("button");
        focusable.id = "focus-origin";
        document.body.appendChild(focusable);
        focusable.focus();

        const aboutWindow = window as AboutWindow;
        aboutWindow.electronAPI = {
            openExternal: vi.fn<(url: string) => void>(),
            getAppVersion: vi.fn<() => Promise<string>>(async () => "1.2.3"),
            getElectronVersion: vi.fn<() => Promise<string>>(
                async () => "38.1.0"
            ),
            getNodeVersion: vi.fn<() => Promise<string>>(
                async () => process.versions?.node ?? "18.0.0"
            ),
            getChromeVersion: vi.fn<() => Promise<string>>(
                async () => process.versions?.chrome ?? "128.0.0"
            ),
            getPlatformInfo: vi.fn<
                () => Promise<{ arch: string; platform: string }>
            >(async () => ({
                arch: "x64",
                platform: "testOS",
            })),
            getLicenseInfo: vi.fn<() => Promise<string>>(
                async () => "Unlicense"
            ),
        };

        rafImmediate();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
        document.body.replaceChildren();
        Reflect.deleteProperty(window, "electronAPI");
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
        showAboutModal();

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
        const aboutWindow = window as AboutWindow;

        ensureAboutModal();
        showAboutModal();

        const link = getRequiredExternalLink(
            '[data-external-link][href="https://electronjs.org/"]'
        );
        expect(link).toBeInstanceOf(HTMLAnchorElement);

        link.click();
        expect(aboutWindow.electronAPI.openExternal).toHaveBeenCalledWith(
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

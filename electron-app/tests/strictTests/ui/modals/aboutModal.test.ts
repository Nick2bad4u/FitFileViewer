import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock heavy side-effect modules before importing the subject under test
vi.mock("../../../../utils/app/initialization/loadVersionInfo.js", () => ({
    loadVersionInfo: vi.fn(async () => undefined),
}));

vi.mock("../../../../utils/ui/modals/injectModalStyles.js", () => ({
    injectModalStyles: vi.fn(() => {
        // No-op: avoid adding a massive style block in jsdom
    }),
}));

// Utilities to import after mocks
const importModules = async () => {
    const ensureAboutModalMod =
        await import("../../../../utils/ui/modals/ensureAboutModal.js");
    const aboutModalMod =
        await import("../../../../utils/ui/modals/aboutModal.js");
    return { ...ensureAboutModalMod, ...aboutModalMod } as any;
};

// Helpers
const rafImmediate = () => {
    // Execute RAF callbacks immediately to allow class toggles and transitions
    (globalThis as any).requestAnimationFrame = (cb: (t: number) => void) => {
        cb(0);
        return 1 as any;
    };
};

describe("About Modal - UI behaviors", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useFakeTimers();
        document.body.innerHTML = "";

        // Provide a focusable element to verify focus restoration
        const focusable = document.createElement("button");
        focusable.id = "focus-origin";
        document.body.appendChild(focusable);
        focusable.focus();

        // Provide electronAPI mock for external links
        (globalThis as any).window = globalThis.window ?? ({} as any);
        (window as any).electronAPI = {
            openExternal: vi.fn(),
            getAppVersion: vi.fn(async () => "1.2.3"),
            getElectronVersion: vi.fn(async () => "38.1.0"),
            getNodeVersion: vi.fn(
                async () => process.versions?.node ?? "18.0.0"
            ),
            getChromeVersion: vi.fn(
                async () => process.versions?.chrome ?? "128.0.0"
            ),
            getPlatformInfo: vi.fn(async () => ({
                platform: "testOS",
                arch: "x64",
            })),
            getLicenseInfo: vi.fn(async () => "Unlicense"),
        };

        rafImmediate();
    });

    it("ensures modal creation, shows with content, and closes via close button", async () => {
        const { ensureAboutModal, showAboutModal } = await importModules();

        ensureAboutModal();
        const modal = document.getElementById("about-modal");
        expect(modal).toBeTruthy();

        // Show with custom body content
        showAboutModal('<p id="custom">Hello</p>');
        const body = document.getElementById("about-modal-body");
        expect(body?.innerHTML).toContain("Hello");

        // Close via the X button
        const closeBtn = document.getElementById(
            "about-modal-close"
        ) as HTMLButtonElement;
        expect(closeBtn).toBeTruthy();
        closeBtn.click();

        // Advance timers to allow animation to complete
        vi.advanceTimersByTime(350);
        expect((modal as HTMLElement).style.display).toBe("none");

        // Focus should be restored to the element focused before showing the modal
        expect(document.activeElement?.id).toBe("focus-origin");
    });

    it("toggles features and back to system info, reloading version info on return", async () => {
        const { ensureAboutModal, showAboutModal } = await importModules();
        const { loadVersionInfo } =
            await import("../../../../utils/app/initialization/loadVersionInfo.js");

        ensureAboutModal();
        showAboutModal();

        const toggleBtn = document.getElementById(
            "toggle-info-btn"
        ) as HTMLButtonElement;
        expect(toggleBtn).toBeTruthy();

        // First click -> show features (content swapped after 150ms)
        toggleBtn.click();
        vi.advanceTimersByTime(200);
        const section = document.getElementById(
            "info-toggle-section"
        ) as HTMLElement;
        expect(section.innerHTML).toContain("features-title");

        // Second click -> back to system info and should trigger loadVersionInfo
        toggleBtn.click();
        vi.advanceTimersByTime(200);
        expect(section.innerHTML).toContain("system-info-grid");
        // loadVersionInfo is called: once in ensureAboutModal, once in showAboutModal, and once after toggling back
        expect(loadVersionInfo).toHaveBeenCalledTimes(3);
    });

    it("closes on Escape key via global handler", async () => {
        const { ensureAboutModal, showAboutModal } = await importModules();

        ensureAboutModal();
        showAboutModal();

        const modal = document.getElementById("about-modal");
        expect(modal).toBeTruthy();

        // Dispatch Escape on document (listener registered in ensureAboutModal)
        const evt = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
        });
        document.dispatchEvent(evt);

        vi.advanceTimersByTime(350);
        expect((modal as HTMLElement).style.display).toBe("none");
    });

    it("handles external links using electronAPI when available", async () => {
        const { ensureAboutModal, showAboutModal } = await importModules();

        ensureAboutModal();
        showAboutModal();

        const link = document.querySelector(
            '[data-external-link][href="https://electronjs.org/"]'
        ) as HTMLAnchorElement;
        expect(link).toBeTruthy();

        link.click();
        expect((window as any).electronAPI.openExternal).toHaveBeenCalledWith(
            "https://electronjs.org/"
        );
    });

    it("does not create duplicate modal elements when ensured multiple times", async () => {
        const { ensureAboutModal } = await importModules();
        ensureAboutModal();
        ensureAboutModal();
        const modals = document.querySelectorAll("#about-modal");
        expect(modals.length).toBe(1);
    });
});

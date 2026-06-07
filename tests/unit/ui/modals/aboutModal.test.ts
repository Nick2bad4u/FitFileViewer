import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
    import("../../../../electron-app/utils/app/initialization/loadVersionInfo.js"),
    () => ({
        loadVersionInfo: vi.fn(),
    })
);

vi.mock(
    import("../../../../electron-app/utils/files/export/exportUtils.js"),
    () => ({
        exportUtils: {
            copyTextToClipboard: vi.fn<() => Promise<boolean>>(() =>
                Promise.resolve(true)
            ),
        },
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn(),
    })
);

function dispatchEscape(): void {
    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Escape",
        })
    );
}

describe("about modal", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        document.head.replaceChildren();
        vi.useFakeTimers();
    });

    afterEach(async () => {
        const { cleanupEventListeners } =
            await import("../../../../electron-app/utils/ui/events/eventListenerManager.js");
        cleanupEventListeners();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("re-registers Escape handling when the existing modal is shown again", async () => {
        expect.assertions(6);

        const { modalAnimationDuration, showAboutModal } =
            await import("../../../../electron-app/utils/ui/modals/aboutModal.js");

        showAboutModal("<p>First open</p>");
        const modal = document.querySelector<HTMLElement>("#about-modal");

        expect(modal).toBeInstanceOf(HTMLElement);

        dispatchEscape();
        vi.advanceTimersByTime(modalAnimationDuration);
        expect(modal?.classList.contains("show")).toBe(false);

        showAboutModal("<p>Second open</p>");
        expect(document.querySelector("#about-modal")).toBe(modal);
        expect(modal?.textContent).not.toContain("First open");
        expect(modal?.style.display).toBe("flex");

        dispatchEscape();
        vi.advanceTimersByTime(modalAnimationDuration);
        expect(modal?.style.display).toBe("none");
    });

    it("does not hide a reopened modal when a previous close animation finishes", async () => {
        expect.assertions(3);

        const { modalAnimationDuration, showAboutModal } =
            await import("../../../../electron-app/utils/ui/modals/aboutModal.js");

        showAboutModal("<p>First open</p>");
        const modal = document.querySelector<HTMLElement>("#about-modal");

        expect(modal).toBeInstanceOf(HTMLElement);

        dispatchEscape();
        showAboutModal("<p>Reopened before close completed</p>");

        expect(modal?.textContent).toContain("Reopened before close completed");

        vi.advanceTimersByTime(modalAnimationDuration);
        expect(modal?.style.display).toBe("flex");
    });

    it("does not stack copy handlers across repeated opens", async () => {
        expect.assertions(2);

        const { exportUtils } =
            await import("../../../../electron-app/utils/files/export/exportUtils.js");
        const { showAboutModal } =
            await import("../../../../electron-app/utils/ui/modals/aboutModal.js");

        showAboutModal("<p>First open</p>");
        showAboutModal("<p>Second open</p>");

        const copyButton = document.querySelector<HTMLButtonElement>(
            "#about-copy-system-info"
        );
        expect(copyButton).toBeInstanceOf(HTMLButtonElement);

        copyButton?.click();
        await Promise.resolve();

        expect(exportUtils.copyTextToClipboard).toHaveBeenCalledTimes(1);
    });
});

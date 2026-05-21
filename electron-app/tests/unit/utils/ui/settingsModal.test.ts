import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    applyTheme: vi.fn<(theme: string, withTransition?: boolean) => void>(),
    createAppIconElement: vi.fn<() => SVGSVGElement>(),
    getEffectiveAccentColor: vi.fn<(theme: string) => string>(),
    getEffectiveTheme: vi.fn<(theme: string) => "dark" | "light">(),
    injectModalStyles: vi.fn<() => void>(),
    isValidHexColor: vi.fn<(color: unknown) => color is string>(),
    loadTheme: vi.fn<() => "auto" | "dark" | "light">(),
    resetAccentColor: vi.fn<(theme: string) => string>(),
    sendThemeChanged: vi.fn<(theme: string) => void>(),
    setAccentColor: vi.fn<(color: string, theme: string) => boolean>(),
    setState:
        vi.fn<
            (
                path: string,
                value: unknown,
                options?: Record<string, unknown>
            ) => void
        >(),
}));

vi.mock(import("../../../../utils/state/core/stateManager.js"), () => ({
    setState: mocks.setState,
}));

vi.mock(import("../../../../utils/theming/core/accentColor.js"), () => ({
    getEffectiveAccentColor: mocks.getEffectiveAccentColor,
    isValidHexColor: mocks.isValidHexColor,
    resetAccentColor: mocks.resetAccentColor,
    setAccentColor: mocks.setAccentColor,
}));

vi.mock(import("../../../../utils/theming/core/theme.js"), () => ({
    THEME_MODES: {
        AUTO: "auto",
        DARK: "dark",
        LIGHT: "light",
    },
    applyTheme: mocks.applyTheme,
    getEffectiveTheme: mocks.getEffectiveTheme,
    loadTheme: mocks.loadTheme,
}));

vi.mock(import("../../../../utils/ui/events/eventListenerManager.js"), () => ({
    addEventListenerWithCleanup: (
        element: EventTarget,
        eventType: string,
        handler: EventListener
    ) => {
        const controller = new AbortController();
        element.addEventListener(eventType, handler, {
            signal: controller.signal,
        });
        return () => controller.abort();
    },
}));

vi.mock(import("../../../../utils/ui/icons/iconFactory.js"), () => ({
    createAppIconElement: mocks.createAppIconElement,
}));

vi.mock(import("../../../../utils/ui/modals/injectModalStyles.js"), () => ({
    injectModalStyles: mocks.injectModalStyles,
}));

import {
    closeSettingsModal,
    showSettingsModal,
} from "../../../../utils/ui/settingsModal.js";

type SettingsModalTestGlobal = typeof globalThis & {
    electronAPI?: {
        sendThemeChanged?: (theme: string) => void;
    };
};

function change(element: HTMLElement): void {
    element.dispatchEvent(new Event("change", { bubbles: true }));
}

function input(element: HTMLElement): void {
    element.dispatchEvent(new Event("input", { bubbles: true }));
}

function click(element: HTMLElement): void {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function getRequiredElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Missing expected element: ${selector}`);
    }
    return element;
}

function resetFixture(): void {
    vi.useFakeTimers();
    vi.clearAllMocks();
    document.body.replaceChildren();
    document.head.replaceChildren();

    mocks.createAppIconElement.mockReturnValue(
        document.createElementNS("http://www.w3.org/2000/svg", "svg")
    );
    mocks.getEffectiveAccentColor.mockReturnValue("#3b82f6");
    mocks.getEffectiveTheme.mockReturnValue("dark");
    mocks.isValidHexColor.mockImplementation(
        (color): color is string =>
            typeof color === "string" && /^#[\da-f]{6}$/i.test(color)
    );
    mocks.loadTheme.mockReturnValue("dark");
    mocks.resetAccentColor.mockReturnValue("#3b82f6");
    mocks.setAccentColor.mockReturnValue(true);
    (globalThis as SettingsModalTestGlobal).electronAPI = {
        sendThemeChanged: mocks.sendThemeChanged,
    };
}

function cleanupFixture(): void {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.replaceChildren();
    document.head.replaceChildren();
    delete (globalThis as SettingsModalTestGlobal).electronAPI;
}

describe("settingsModal", () => {
    it("creates the modal, injects styles, and exposes global menu hooks", async () => {
        expect.assertions(8);

        resetFixture();

        try {
            await showSettingsModal();
            await vi.dynamicImportSettled();
            vi.runOnlyPendingTimers();

            const modal = getRequiredElement<HTMLElement>("#settings-modal");

            expect(modal.style.display).toBe("flex");
            expect(modal.querySelector(".modal-title")?.textContent).toBe(
                "Settings"
            );
            expect(
                getRequiredElement<HTMLSelectElement>("#theme-select").value
            ).toBe("dark");
            expect(
                getRequiredElement<HTMLInputElement>("#accent-color-text").value
            ).toBe("#3b82f6");
            expect(
                document.querySelectorAll("#settings-modal-styles")
            ).toHaveLength(1);
            expect(mocks.injectModalStyles).toHaveBeenCalledOnce();
            expect(globalThis.showSettingsModal).toBe(showSettingsModal);
            expect(globalThis.closeSettingsModal).toBe(closeSettingsModal);
        } finally {
            cleanupFixture();
        }
    });

    it("hides the modal after the close animation delay", async () => {
        expect.assertions(3);

        resetFixture();

        try {
            await showSettingsModal();
            await vi.dynamicImportSettled();

            const modal = getRequiredElement<HTMLElement>("#settings-modal");

            closeSettingsModal();

            expect([...modal.classList]).not.toContain("show");
            expect(modal.style.display).toBe("flex");

            vi.advanceTimersByTime(300);

            expect(modal.style.display).toBe("none");
        } finally {
            cleanupFixture();
        }
    });

    it("persists theme and accent control changes through the expected services", async () => {
        expect.assertions(7);

        resetFixture();

        try {
            await showSettingsModal();
            await vi.dynamicImportSettled();

            const themeSelect =
                getRequiredElement<HTMLSelectElement>("#theme-select");
            themeSelect.value = "light";
            mocks.getEffectiveTheme.mockReturnValue("light");
            change(themeSelect);

            expect(mocks.setState).toHaveBeenCalledWith("ui.theme", "light", {
                source: "settingsModal:theme-select",
            });
            expect(mocks.sendThemeChanged).toHaveBeenCalledWith("light");

            const colorPicker = getRequiredElement<HTMLInputElement>(
                "#accent-color-picker"
            );
            const colorText =
                getRequiredElement<HTMLInputElement>("#accent-color-text");
            colorPicker.value = "#ef4444";
            input(colorPicker);

            expect(colorText.value).toBe("#ef4444");
            expect(mocks.setAccentColor).toHaveBeenLastCalledWith(
                "#ef4444",
                "light"
            );

            colorText.value = "10b981";
            input(colorText);

            expect(colorText.value).toBe("#10b981");
            expect(colorPicker.value).toBe("#10b981");

            click(getRequiredElement<HTMLButtonElement>("#reset-accent-color"));

            expect(mocks.resetAccentColor).toHaveBeenCalledWith("light");
        } finally {
            cleanupFixture();
        }
    });
});

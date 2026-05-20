import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getEffectiveAccentColor: vi.fn<(theme: string) => string>(),
    getEffectiveTheme: vi.fn<(theme: string) => "dark" | "light">(),
    loadTheme: vi.fn<() => "auto" | "dark" | "light">(),
    setAccentColor: vi.fn<(color: string, theme: string) => boolean>(),
    showSettingsModal: vi.fn<() => Promise<void>>(),
}));

vi.mock(import("../../../../utils/theming/core/accentColor.js"), () => ({
    getEffectiveAccentColor: mocks.getEffectiveAccentColor,
    setAccentColor: mocks.setAccentColor,
}));

vi.mock(import("../../../../utils/theming/core/theme.js"), () => ({
    getEffectiveTheme: mocks.getEffectiveTheme,
    loadTheme: mocks.loadTheme,
}));

vi.mock(import("../../../../utils/ui/settingsModal.js"), () => ({
    showSettingsModal: mocks.showSettingsModal,
}));

import {
    initQuickColorSwitcher,
    updateSwitcherActiveColor,
} from "../../../../utils/ui/quickColorSwitcher.js";

const COLOR_OPTION_SELECTOR = ".color-option";
const DROPDOWN_SELECTOR = "#color-switcher-dropdown";
const SETTINGS_BUTTON_SELECTOR = "#open-full-settings";
const SWITCHER_SELECTOR = "#quick-color-switcher";
const TOGGLE_SELECTOR = "#color-switcher-toggle";

function click(element: Element): void {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function getRequiredElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Missing expected element: ${selector}`);
    }
    return element;
}

function resetFixture(): void {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.replaceChildren();
    document.head.replaceChildren();
    mocks.loadTheme.mockReturnValue("dark");
    mocks.getEffectiveTheme.mockReturnValue("dark");
    mocks.getEffectiveAccentColor.mockReturnValue("#10b981");
    mocks.setAccentColor.mockReturnValue(true);
    mocks.showSettingsModal.mockResolvedValue();
}

function cleanupFixture(): void {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.replaceChildren();
    document.head.replaceChildren();
}

describe(initQuickColorSwitcher, () => {
    it("renders the switcher once with the current accent color selected", () => {
        expect.assertions(7);

        resetFixture();

        try {
            initQuickColorSwitcher();

            const switcher = getRequiredElement<HTMLElement>(SWITCHER_SELECTOR);
            const activeOption =
                switcher.querySelector<HTMLButtonElement>(".color-option.active");

            expect(switcher.className).toBe("quick-color-switcher");
            expect(document.querySelectorAll(SWITCHER_SELECTOR)).toHaveLength(1);
            expect(
                document.querySelectorAll("#quick-color-switcher-styles")
            ).toHaveLength(1);
            expect(switcher.querySelectorAll(COLOR_OPTION_SELECTOR)).toHaveLength(
                8
            );
            expect(activeOption?.dataset["color"]).toBe("#10b981");

            initQuickColorSwitcher();

            expect(
                document.getElementById("quick-color-switcher")
            ).toBe(switcher);
            expect(
                document.getElementById("quick-color-switcher-styles")
                    ?.textContent
            ).toContain(".color-option.active");
        } finally {
            cleanupFixture();
        }
    });

    it("opens from the toggle button and closes on outside document clicks", () => {
        expect.assertions(3);

        resetFixture();

        try {
            initQuickColorSwitcher();

            const dropdown = getRequiredElement<HTMLElement>(DROPDOWN_SELECTOR);
            const toggle = getRequiredElement<HTMLButtonElement>(TOGGLE_SELECTOR);

            click(toggle);

            expect([...dropdown.classList]).toContain("open");

            document.body.dispatchEvent(
                new MouseEvent("click", { bubbles: true })
            );

            expect([...dropdown.classList]).not.toContain("open");
            expect(dropdown.id).toBe("color-switcher-dropdown");
        } finally {
            cleanupFixture();
        }
    });

    it("applies a preset accent color and closes the dropdown after the delay", () => {
        expect.assertions(6);

        resetFixture();
        vi.useFakeTimers();

        try {
            initQuickColorSwitcher();

            const dropdown = getRequiredElement<HTMLElement>(DROPDOWN_SELECTOR);
            const redOption = getRequiredElement<HTMLButtonElement>(
                '[data-color="#ef4444"]'
            );
            dropdown.classList.add("open");

            click(redOption);

            expect(mocks.setAccentColor).toHaveBeenCalledWith(
                "#ef4444",
                "dark"
            );
            expect([...redOption.classList]).toContain("active");
            expect(
                getRequiredElement<HTMLButtonElement>('[data-color="#10b981"]')
                    .classList
            ).not.toContain("active");
            expect(vi.getTimerCount()).toBe(1);

            vi.advanceTimersByTime(499);

            expect([...dropdown.classList]).toContain("open");

            vi.advanceTimersByTime(1);

            expect([...dropdown.classList]).not.toContain("open");
        } finally {
            cleanupFixture();
        }
    });

    it("closes the dropdown before opening the full settings modal", async () => {
        expect.assertions(3);

        resetFixture();

        try {
            initQuickColorSwitcher();

            const dropdown = getRequiredElement<HTMLElement>(DROPDOWN_SELECTOR);
            const settingsButton =
                getRequiredElement<HTMLButtonElement>(SETTINGS_BUTTON_SELECTOR);
            dropdown.classList.add("open");

            click(settingsButton);
            await vi.dynamicImportSettled();

            expect(mocks.showSettingsModal).toHaveBeenCalledOnce();
            expect([...dropdown.classList]).not.toContain("open");
            expect(settingsButton.id).toBe("open-full-settings");
        } finally {
            cleanupFixture();
        }
    });
});

describe(updateSwitcherActiveColor, () => {
    it("updates the active color when the switcher already exists", () => {
        expect.assertions(3);

        resetFixture();

        try {
            initQuickColorSwitcher();

            updateSwitcherActiveColor("#ef4444");

            const redOption = getRequiredElement<HTMLButtonElement>(
                '[data-color="#ef4444"]'
            );
            const greenOption = getRequiredElement<HTMLButtonElement>(
                '[data-color="#10b981"]'
            );

            expect([...redOption.classList]).toContain("active");
            expect([...greenOption.classList]).not.toContain("active");
            expect(document.querySelectorAll(COLOR_OPTION_SELECTOR)).toHaveLength(
                8
            );
        } finally {
            cleanupFixture();
        }
    });
});

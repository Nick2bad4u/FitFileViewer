import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getEffectiveAccentColor: vi.fn<(theme: string) => string>(),
    getEffectiveTheme: vi.fn<(theme: string) => "dark" | "light">(),
    loadTheme: vi.fn<() => "auto" | "dark" | "light">(),
    setAccentColor: vi.fn<(color: string, theme: string) => boolean>(),
    showSettingsModal: vi.fn<() => Promise<void>>(),
}));

vi.mock(
    import("../../../../electron-app/utils/theming/core/accentColor.js"),
    () => ({
        getEffectiveAccentColor: mocks.getEffectiveAccentColor,
        setAccentColor: mocks.setAccentColor,
    })
);

vi.mock(import("../../../../electron-app/utils/theming/core/theme.js"), () => ({
    getEffectiveTheme: mocks.getEffectiveTheme,
    loadTheme: mocks.loadTheme,
}));

vi.mock(import("../../../../electron-app/utils/ui/settingsModal.js"), () => ({
    showSettingsModal: mocks.showSettingsModal,
}));

import {
    initQuickColorSwitcher,
    updateSwitcherActiveColor,
} from "../../../../electron-app/utils/ui/quickColorSwitcher.js";

const COLOR_OPTION_SELECTOR = ".color-option";
const DROPDOWN_SELECTOR = "#color-switcher-dropdown";
const SETTINGS_BUTTON_SELECTOR = "#open-full-settings";
const SWITCHER_SELECTOR = "#quick-color-switcher";
const TOGGLE_SELECTOR = "#color-switcher-toggle";
const EXPECTED_COLOR_OPTIONS = [
    { color: "#3b82f6", name: "Blue-tiful" },
    { color: "#8b5cf6", name: "Purple Rain" },
    { color: "#ec4899", name: "Pink Panther" },
    { color: "#10b981", name: "Green Machine" },
    { color: "#f59e0b", name: "Golden Hour" },
    { color: "#ef4444", name: "Red Hot" },
    { color: "#06b6d4", name: "Cyan-tific" },
    { color: "#f97316", name: "Orange Crush" },
] as const;

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

function getClassList(element: Element): string[] {
    return [...element.classList];
}

function getDropdownState(dropdown: HTMLElement) {
    return {
        className: dropdown.className,
        id: dropdown.id,
        isOpen: dropdown.classList.contains("open"),
    };
}

function getColorOptionStates(container: ParentNode = document) {
    return [
        ...container.querySelectorAll<HTMLButtonElement>(COLOR_OPTION_SELECTOR),
    ].map((button) => ({
        active: button.classList.contains("active"),
        ariaLabel: button.getAttribute("aria-label"),
        className: button.className,
        color: button.dataset["color"],
        title: button.title,
        type: button.type,
    }));
}

function createExpectedColorOptionStates(activeColor: string) {
    return EXPECTED_COLOR_OPTIONS.map((preset) => ({
        active: preset.color === activeColor,
        ariaLabel: `Switch to ${preset.name}`,
        className:
            preset.color === activeColor
                ? "color-option active"
                : "color-option",
        color: preset.color,
        title: preset.name,
        type: "button",
    }));
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
        expect.assertions(8);

        resetFixture();

        try {
            initQuickColorSwitcher();

            const switcher = getRequiredElement<HTMLElement>(SWITCHER_SELECTOR);
            const toggle =
                getRequiredElement<HTMLButtonElement>(TOGGLE_SELECTOR);
            const settingsButton = getRequiredElement<HTMLButtonElement>(
                SETTINGS_BUTTON_SELECTOR
            );

            expect(switcher.className).toBe("quick-color-switcher");
            expect(document.querySelectorAll(SWITCHER_SELECTOR)).toHaveLength(
                1
            );
            expect(
                document.querySelectorAll("#quick-color-switcher-styles")
            ).toHaveLength(1);
            expect({
                settingsButton: {
                    id: settingsButton.id,
                    title: settingsButton.title,
                    type: settingsButton.type,
                },
                toggle: {
                    ariaLabel: toggle.getAttribute("aria-label"),
                    className: toggle.className,
                    tooltip: toggle.dataset["tooltip"],
                    type: toggle.type,
                },
            }).toStrictEqual({
                settingsButton: {
                    id: "open-full-settings",
                    title: "Advanced color settings",
                    type: "button",
                },
                toggle: {
                    ariaLabel: "Open color switcher",
                    className: "switcher-toggle",
                    tooltip: "Quick Colors",
                    type: "button",
                },
            });
            expect(getColorOptionStates(switcher)).toStrictEqual(
                createExpectedColorOptionStates("#10b981")
            );

            initQuickColorSwitcher();

            expect(document.getElementById("quick-color-switcher")).toBe(
                switcher
            );
            expect(
                document.querySelectorAll(SWITCHER_SELECTOR)
            ).not.toHaveLength(2);
            expect(
                document.getElementById("quick-color-switcher-styles")
                    ?.textContent
            ).toContain(".color-option.active");
        } finally {
            cleanupFixture();
        }
    });

    it("opens from the toggle button and closes on outside document clicks", () => {
        expect.assertions(2);

        resetFixture();

        try {
            initQuickColorSwitcher();

            const dropdown = getRequiredElement<HTMLElement>(DROPDOWN_SELECTOR);
            const toggle =
                getRequiredElement<HTMLButtonElement>(TOGGLE_SELECTOR);

            click(toggle);

            expect(getDropdownState(dropdown)).toStrictEqual({
                className: "switcher-dropdown open",
                id: "color-switcher-dropdown",
                isOpen: true,
            });

            document.body.dispatchEvent(
                new MouseEvent("click", { bubbles: true })
            );

            expect(getDropdownState(dropdown)).toStrictEqual({
                className: "switcher-dropdown",
                id: "color-switcher-dropdown",
                isOpen: false,
            });
        } finally {
            cleanupFixture();
        }
    });

    it("applies a preset accent color and closes the dropdown after the delay", () => {
        expect.assertions(5);

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
            expect(getColorOptionStates()).toStrictEqual(
                createExpectedColorOptionStates("#ef4444")
            );
            expect({
                activeColor: redOption.dataset["color"],
                pendingTimers: vi.getTimerCount(),
            }).toEqual({
                activeColor: "#ef4444",
                pendingTimers: 1,
            });

            vi.advanceTimersByTime(499);

            expect(getDropdownState(dropdown).isOpen).toBe(true);

            vi.advanceTimersByTime(1);

            expect(getDropdownState(dropdown).isOpen).toBe(false);
        } finally {
            cleanupFixture();
        }
    });

    it("closes the dropdown before opening the full settings modal", async () => {
        expect.assertions(2);

        resetFixture();

        try {
            initQuickColorSwitcher();

            const dropdown = getRequiredElement<HTMLElement>(DROPDOWN_SELECTOR);
            const settingsButton = getRequiredElement<HTMLButtonElement>(
                SETTINGS_BUTTON_SELECTOR
            );
            dropdown.classList.add("open");

            click(settingsButton);
            await vi.dynamicImportSettled();

            expect(mocks.showSettingsModal).toHaveBeenCalledOnce();
            expect(getDropdownState(dropdown)).toStrictEqual({
                className: "switcher-dropdown",
                id: "color-switcher-dropdown",
                isOpen: false,
            });
        } finally {
            cleanupFixture();
        }
    });
});

describe(updateSwitcherActiveColor, () => {
    it("updates the active color when the switcher already exists", () => {
        expect.assertions(2);

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

            expect({
                greenClasses: getClassList(greenOption),
                options: getColorOptionStates(),
                redClasses: getClassList(redOption),
            }).toStrictEqual({
                greenClasses: ["color-option"],
                options: createExpectedColorOptionStates("#ef4444"),
                redClasses: ["color-option", "active"],
            });
            expect(getClassList(greenOption)).not.toContain("active");
        } finally {
            cleanupFixture();
        }
    });
});

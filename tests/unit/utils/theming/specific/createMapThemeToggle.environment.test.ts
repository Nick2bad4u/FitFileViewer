import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMapThemeSetting = vi.fn<() => boolean>(() => true);
const setMapThemeSetting = vi.fn<(inverted: boolean) => unknown>();
const showNotification = vi.fn<
    (message: string, type: string) => Promise<void>
>(async () => {});

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: () => ({
            primary: "#123456",
            surface: "#ffffff",
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getMapThemeSetting,
        setMapThemeSetting,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification,
    })
);

function resetMapThemeToggleGlobals(): void {
    Reflect.deleteProperty(
        globalThis,
        "__ffvMapThemeToggleListenersController"
    );
    Reflect.deleteProperty(globalThis, "__ffvMapThemeToggleListenersInstalled");
    Reflect.deleteProperty(globalThis, "__ffvMapThemeToggleUpdate");
    Reflect.deleteProperty(globalThis, "updateMapTheme");
}

function getMapThemeToggleState(button: HTMLElement): {
    ariaLabel: null | string;
    className: string;
    hasSvgIcon: boolean;
    tagName: string;
    text: null | string;
    title: string;
} {
    return {
        ariaLabel: button.getAttribute("aria-label"),
        className: button.className,
        hasSvgIcon: button.querySelector(".icon > svg") instanceof SVGElement,
        tagName: button.tagName,
        text: button.textContent,
        title: button.title,
    };
}

describe("createMapThemeToggle environment handling", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        resetMapThemeToggleGlobals();
        getMapThemeSetting.mockReturnValue(true);
        setMapThemeSetting.mockClear();
        showNotification.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        resetMapThemeToggleGlobals();
    });

    it("creates the toggle when global process is unavailable", async () => {
        expect.assertions(3);

        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
        vi.stubGlobal("process", undefined);

        const { createMapThemeToggle } =
            await import("../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");

        const button = createMapThemeToggle();

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(getMapThemeToggleState(button)).toEqual({
            ariaLabel: "Toggle map theme",
            className: "map-action-btn map-theme-toggle active",
            hasSvgIcon: true,
            tagName: "BUTTON",
            text: "Map Theme",
            title: "Map: Dark theme (click for light theme)",
        });
        expect(consoleError).not.toHaveBeenCalled();
    });

    it("creates the toggle when process.env is unavailable", async () => {
        expect.assertions(3);

        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
        vi.stubGlobal("process", {});

        const { createMapThemeToggle } =
            await import("../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");

        const button = createMapThemeToggle();

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(getMapThemeToggleState(button)).toEqual({
            ariaLabel: "Toggle map theme",
            className: "map-action-btn map-theme-toggle active",
            hasSvgIcon: true,
            tagName: "BUTTON",
            text: "Map Theme",
            title: "Map: Dark theme (click for light theme)",
        });
        expect(consoleError).not.toHaveBeenCalled();
    });
});

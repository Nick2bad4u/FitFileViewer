import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMapThemeSetting = vi.fn(() => true);
const setMapThemeSetting = vi.fn();
const showNotification = vi.fn();

vi.mock("../../../../../utils/charts/theming/getThemeColors.js", () => ({
    getThemeColors: () => ({
        primary: "#123456",
        surface: "#ffffff",
    }),
}));

vi.mock("../../../../../utils/state/domain/settingsStateManager.js", () => ({
    getMapThemeSetting,
    setMapThemeSetting,
}));

vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification,
}));

function resetMapThemeToggleGlobals(): void {
    Reflect.deleteProperty(
        globalThis,
        "__ffvMapThemeToggleListenersController"
    );
    Reflect.deleteProperty(globalThis, "__ffvMapThemeToggleListenersInstalled");
    Reflect.deleteProperty(globalThis, "__ffvMapThemeToggleUpdate");
    Reflect.deleteProperty(globalThis, "updateMapTheme");
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
        expect.assertions(5);

        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
        vi.stubGlobal("process", undefined);

        const { createMapThemeToggle } =
            await import("../../../../../utils/theming/specific/createMapThemeToggle.js");

        const button = createMapThemeToggle();

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.classList.contains("map-theme-toggle")).toBe(true);
        expect(button.title).toBe("Map: Dark theme (click for light theme)");
        expect(button.querySelector("svg")).toBeInstanceOf(SVGElement);
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
            await import("../../../../../utils/theming/specific/createMapThemeToggle.js");

        const button = createMapThemeToggle();

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.classList.contains("active")).toBe(true);
        expect(consoleError).not.toHaveBeenCalled();
    });
});

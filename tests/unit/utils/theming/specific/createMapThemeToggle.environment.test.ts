import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    getMapThemeToggleRuntime,
    type MapThemeToggleRuntime,
} from "../../../../../electron-app/utils/theming/specific/mapThemeToggleRuntime.js";

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

async function resetMapThemeToggleState(): Promise<void> {
    const { resetMapThemeToggleStateForTests } =
        await import("../../../../../electron-app/utils/theming/specific/mapThemeToggleState.js");

    resetMapThemeToggleStateForTests();
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

function createMapThemeToggleRuntime(
    isTestEnvironment: boolean | undefined
): MapThemeToggleRuntime {
    return getMapThemeToggleRuntime({
        getAbortController: () => AbortController,
        getClearTimeout: () => clearTimeout,
        getCustomEvent: () => CustomEvent,
        getDocument: () => document,
        getIsTestEnvironment: () => isTestEnvironment,
        getSetTimeout: () => setTimeout,
    });
}

describe("createMapThemeToggle environment handling", () => {
    beforeEach(async () => {
        document.body.replaceChildren();
        await resetMapThemeToggleState();
        getMapThemeSetting.mockReturnValue(true);
        setMapThemeSetting.mockClear();
        showNotification.mockClear();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        await resetMapThemeToggleState();
    });

    it("creates the toggle when test-environment state is unavailable", async () => {
        expect.assertions(4);

        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});

        const { createMapThemeToggle } =
            await import("../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");

        const button = createMapThemeToggle(
            createMapThemeToggleRuntime(undefined)
        );

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
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("creates the toggle when runtime reports a test environment", async () => {
        expect.assertions(4);

        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});

        const { createMapThemeToggle } =
            await import("../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");

        const button = createMapThemeToggle(createMapThemeToggleRuntime(true));

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
        expect(showNotification).not.toHaveBeenCalled();
    });
});

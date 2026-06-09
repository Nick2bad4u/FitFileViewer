import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getThemeColors: vi.fn<() => Record<string, string>>(),
    hasActiveFitRouteData: vi.fn<() => boolean>(),
    openFileSelector: vi.fn<() => Promise<void>>(),
    showNotification: vi.fn<(message: string, type: string) => void>(),
    subscribe: vi.fn<(key: string, listener: () => void) => () => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: mocks.getThemeColors,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/files/import/openFileSelector.js"),
    () => ({
        openFileSelector: mocks.openFileSelector,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        subscribe: mocks.subscribe,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitRouteDataState.js"),
    () => ({
        hasActiveFitRouteData: mocks.hasActiveFitRouteData,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

import { createAddFitFileToMapButton } from "../../../../../electron-app/utils/ui/controls/createAddFitFileToMapButton.js";
import { resetAddFitOverlayButtonStateForTests } from "../../../../../electron-app/utils/ui/controls/addFitOverlayButtonState.js";

function resetFixture(): void {
    resetAddFitOverlayButtonStateForTests();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    document.body.replaceChildren();
    mocks.getThemeColors.mockReturnValue({ primary: "#2563eb" });
    mocks.hasActiveFitRouteData.mockReturnValue(false);
    mocks.openFileSelector.mockResolvedValue();
    mocks.subscribe.mockReturnValue(() => {});
}

function getIconPath(button: HTMLButtonElement): SVGPathElement {
    const path = button.querySelector<SVGPathElement>("svg.icon path");
    if (!path) {
        throw new Error("Missing button icon path");
    }
    return path;
}

function getDisabledState(button: HTMLButtonElement): "disabled" | "enabled" {
    return button.disabled ? "disabled" : "enabled";
}

async function clickButton(button: HTMLButtonElement): Promise<void> {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
}

describe(createAddFitFileToMapButton, () => {
    it("creates a disabled map action button when no primary file is loaded", async () => {
        expect.assertions(8);

        resetFixture();

        try {
            const button = createAddFitFileToMapButton();

            expect(button.className).toBe("map-action-btn");
            expect(getDisabledState(button)).toBe("disabled");
            expect(button.getAttribute("aria-disabled")).toBe("true");
            expect(button.getAttribute("aria-label")).toBe(
                "Add FIT files as map overlays"
            );
            expect(button.textContent).toBe("Add FIT File(s) to Map");
            expect(getIconPath(button).getAttribute("stroke")).toBe("#2563eb");
            expect(mocks.subscribe).toHaveBeenCalledExactlyOnceWith(
                "fitFile.rawData",
                expect.any(Function)
            );

            await clickButton(button);

            expect(mocks.showNotification).toHaveBeenCalledExactlyOnceWith(
                "Open a primary FIT file before adding overlays.",
                "info"
            );
        } finally {
            resetFixture();
        }
    });

    it("enables the button when primary record messages exist", async () => {
        expect.assertions(4);

        resetFixture();
        mocks.hasActiveFitRouteData.mockReturnValue(true);

        try {
            const button = createAddFitFileToMapButton();

            expect(getDisabledState(button)).toBe("enabled");
            expect(button.getAttribute("aria-disabled")).toBe("false");

            await clickButton(button);

            expect(mocks.openFileSelector).toHaveBeenCalledOnce();
            expect(mocks.showNotification).not.toHaveBeenCalled();
        } finally {
            resetFixture();
        }
    });

    it("updates the latest button from the shared global subscription", () => {
        expect.assertions(5);

        resetFixture();
        let subscribedListener: (() => void) | undefined;
        mocks.subscribe.mockImplementation((_key, listener) => {
            subscribedListener = listener;
            return () => {};
        });
        mocks.hasActiveFitRouteData.mockReturnValue(false);

        try {
            const firstButton = createAddFitFileToMapButton();
            mocks.hasActiveFitRouteData.mockReturnValue(true);
            const secondButton = createAddFitFileToMapButton();

            subscribedListener?.();

            expect(mocks.subscribe).toHaveBeenCalledOnce();
            expect(getDisabledState(firstButton)).toBe("disabled");
            expect(firstButton.getAttribute("aria-disabled")).toBe("true");
            expect(getDisabledState(secondButton)).toBe("enabled");
            expect(secondButton.getAttribute("aria-disabled")).toBe("false");
        } finally {
            resetFixture();
        }
    });

    it("falls back to currentColor when the theme primary color is unavailable", () => {
        expect.assertions(1);

        resetFixture();
        mocks.getThemeColors.mockReturnValue({});

        try {
            const button = createAddFitFileToMapButton();

            expect(getIconPath(button).getAttribute("stroke")).toBe(
                "currentColor"
            );
        } finally {
            resetFixture();
        }
    });

    it("disables the button when state lookup fails", () => {
        expect.assertions(3);

        resetFixture();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const error = new Error("state failed");
        mocks.hasActiveFitRouteData.mockImplementation(() => {
            throw error;
        });

        try {
            const button = createAddFitFileToMapButton();

            expect(getDisabledState(button)).toBe("disabled");
            expect(button.getAttribute("aria-disabled")).toBe("true");
            expect(warnSpy).toHaveBeenCalledWith(
                "[MapActions] Unable to determine overlay availability:",
                error
            );
        } finally {
            resetFixture();
        }
    });

    it("shows an error notification when opening the selector fails", async () => {
        expect.assertions(2);

        resetFixture();
        const error = new Error("dialog failed");
        mocks.hasActiveFitRouteData.mockReturnValue(true);
        mocks.openFileSelector.mockRejectedValue(error);

        try {
            const button = createAddFitFileToMapButton();

            await clickButton(button);
            await Promise.resolve();

            expect(getDisabledState(button)).toBe("enabled");
            expect(mocks.showNotification).toHaveBeenCalledExactlyOnceWith(
                "Failed to open file selector",
                "error"
            );
        } finally {
            resetFixture();
        }
    });
});

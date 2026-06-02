import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetThemeColors = vi.hoisted(() =>
    vi.fn<() => Record<string, string>>()
);
const mockGetMapThemeSetting = vi.hoisted(() => vi.fn<() => boolean>());
const mockSetMapThemeSetting = vi.hoisted(() =>
    vi.fn<(value: boolean) => void>()
);
const mockShowNotification = vi.hoisted(() =>
    vi.fn<(message: string, type?: string) => void>()
);

vi.mock(
    import("../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: mockGetThemeColors,
    })
);

vi.mock(
    import("../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getMapThemeSetting: mockGetMapThemeSetting,
        setMapThemeSetting: mockSetMapThemeSetting,
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mockShowNotification,
    })
);

const { createMapThemeToggle } =
    await import("../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");

const originalProcessDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "process"
);

function clearMapThemeToggleGlobals(): void {
    const mapThemeGlobal = globalThis as typeof globalThis & {
        __ffvMapThemeToggleListenersController?: AbortController;
        __ffvMapThemeToggleListenersInstalled?: boolean;
        __ffvMapThemeToggleUpdate?: () => void;
    };

    mapThemeGlobal.__ffvMapThemeToggleListenersController?.abort();
    Reflect.deleteProperty(
        mapThemeGlobal,
        "__ffvMapThemeToggleListenersController"
    );
    Reflect.deleteProperty(
        mapThemeGlobal,
        "__ffvMapThemeToggleListenersInstalled"
    );
    Reflect.deleteProperty(mapThemeGlobal, "__ffvMapThemeToggleUpdate");
}

function restoreProcessGlobal(): void {
    if (originalProcessDescriptor) {
        Object.defineProperty(globalThis, "process", originalProcessDescriptor);
        return;
    }

    Reflect.deleteProperty(globalThis, "process");
}

describe("createMapThemeToggle", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        document.body.replaceChildren();
        clearMapThemeToggleGlobals();
        vi.resetAllMocks();
        mockGetThemeColors.mockReturnValue({
            primary: "#2563eb",
            surface: "transparent",
        });
        mockGetMapThemeSetting.mockReturnValue(false);
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        clearMapThemeToggleGlobals();
        restoreProcessGlobal();
    });

    it("creates the toggle in browser-like runtimes without a process global", () => {
        expect.assertions(8);

        Object.defineProperty(globalThis, "process", {
            configurable: true,
            value: undefined,
            writable: true,
        });

        const button = createMapThemeToggle();

        expect(button).toBeInstanceOf(HTMLElement);
        expect(button.classList.contains("map-theme-toggle")).toBe(true);
        expect(button.getAttribute("aria-label")).toBe("Toggle map theme");
        expect(button.title).toBe("Map: Light theme (click for dark theme)");
        expect(button.querySelector("svg")).toBeInstanceOf(SVGElement);
        expect(mockGetMapThemeSetting).toHaveBeenCalledWith();
        expect(mockShowNotification).not.toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
});

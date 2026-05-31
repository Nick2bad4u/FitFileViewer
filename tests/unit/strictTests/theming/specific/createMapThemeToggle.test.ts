import { beforeEach, describe, expect, it, vi } from "vitest";

import { showNotification } from "../../../../../electron-app/utils/ui/notifications/showNotification.js";

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification:
            vi.fn<(message: string, type?: string) => Promise<void>>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: () => ({ surface: "#fff", primary: "#000" }),
    })
);

type CreateMapThemeToggleModule =
    typeof import("../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");

type MapThemeToggleGlobal = typeof globalThis & {
    __ffvMapThemeToggleListenersController?: AbortController;
    __ffvMapThemeToggleListenersInstalled?: boolean;
    __ffvMapThemeToggleUpdate?: () => void;
    updateMapTheme?: () => void;
};

async function importCreateMapThemeToggle(): Promise<CreateMapThemeToggleModule> {
    return import("../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");
}

describe("createMapThemeToggle", () => {
    beforeEach(() => {
        const appGlobal = globalThis as MapThemeToggleGlobal;

        appGlobal.__ffvMapThemeToggleListenersController?.abort();
        delete appGlobal.__ffvMapThemeToggleListenersController;
        delete appGlobal.__ffvMapThemeToggleListenersInstalled;
        delete appGlobal.__ffvMapThemeToggleUpdate;
        delete appGlobal.updateMapTheme;

        localStorage.clear();
        document.body.className = "theme-light";
        document.body.replaceChildren();
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("get/set preference defaults to dark, persists changes, and dispatches details", async () => {
        expect.hasAssertions();

        const eventController = new AbortController();
        const eventSpy = vi.fn<(event: Event) => void>();
        const { getMapThemeInverted, setMapThemeInverted } =
            await importCreateMapThemeToggle();

        document.addEventListener("mapThemeChanged", eventSpy, {
            signal: eventController.signal,
        });

        expect(getMapThemeInverted()).toBe(true);

        setMapThemeInverted(false);

        expect(getMapThemeInverted()).toBe(false);
        expect(localStorage.getItem("ffv-map-theme-inverted")).toBe("false");
        expect(localStorage.getItem("ffv-map-theme-inverted")).not.toBe("true");
        expect(eventSpy).toHaveBeenCalledOnce();
        expect(eventSpy.mock.calls[0]?.[0]).toMatchObject({
            detail: { inverted: false },
            type: "mapThemeChanged",
        });

        eventController.abort();
    });

    it("creates button and toggles state with click", async () => {
        expect.hasAssertions();

        const appGlobal = globalThis as MapThemeToggleGlobal;
        const eventController = new AbortController();
        const eventSpy = vi.fn<(event: Event) => void>();
        const { createMapThemeToggle, MAP_THEME_EVENTS } =
            await importCreateMapThemeToggle();

        const btn = createMapThemeToggle();

        expect(btn.tagName).toBe("BUTTON");
        expect(btn.getAttribute("aria-label")).toBe("Toggle map theme");
        expect(btn.textContent).toContain("Map Theme");
        expect(btn.classList.contains("active")).toBe(true);
        expect(btn.title).toBe("Map: Dark theme (click for light theme)");
        expect(btn.querySelector("svg path")?.getAttribute("d")).toBe(
            "M17 12.5A7.5 7.5 0 1 1 10 2.5a6 6 0 0 0 7 10z"
        );

        appGlobal.updateMapTheme = () => {};
        const updateMapThemeSpy = vi
            .spyOn(appGlobal, "updateMapTheme")
            .mockImplementation();
        document.addEventListener(MAP_THEME_EVENTS.CHANGED, eventSpy, {
            signal: eventController.signal,
        });

        btn.click();

        expect(localStorage.getItem("ffv-map-theme-inverted")).toBe("false");
        expect(btn.classList.contains("active")).toBe(false);
        expect(btn.title).toBe("Map: Light theme (click for dark theme)");
        expect(btn.querySelector("svg circle")).toMatchObject({
            namespaceURI: "http://www.w3.org/2000/svg",
        });
        expect(eventSpy).toHaveBeenCalledOnce();
        expect(eventSpy.mock.calls[0]?.[0]).toMatchObject({
            detail: { inverted: false },
            type: MAP_THEME_EVENTS.CHANGED,
        });
        expect(updateMapThemeSpy).toHaveBeenCalledOnce();
        expect(showNotification).toHaveBeenCalledWith(
            "Map theme set to light",
            "success"
        );

        eventController.abort();
    });

    it("renders the persisted light preference without active dark-map affordances", async () => {
        expect.hasAssertions();

        const { createMapThemeToggle, setMapThemeInverted } =
            await importCreateMapThemeToggle();

        setMapThemeInverted(false);
        const btn = createMapThemeToggle();

        expect([...btn.classList]).not.toContain("active");
        expect(btn.title).toBe("Map: Light theme (click for dark theme)");
        expect(btn.querySelector("svg circle")).toMatchObject({
            namespaceURI: "http://www.w3.org/2000/svg",
        });
        expect(btn.querySelector("svg path")).toBeNull();
    });
});

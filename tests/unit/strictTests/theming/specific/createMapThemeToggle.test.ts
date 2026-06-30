import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MapThemeToggleRuntime } from "../../../../../electron-app/utils/theming/specific/mapThemeToggleRuntime.js";

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

async function importCreateMapThemeToggle(): Promise<CreateMapThemeToggleModule> {
    return import("../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js");
}

async function resetMapThemeToggleState(): Promise<void> {
    const { resetMapThemeToggleStateForTests } =
        await import("../../../../../electron-app/utils/theming/specific/mapThemeToggleState.js");

    resetMapThemeToggleStateForTests();
}

async function importShowNotificationMock(): Promise<
    typeof import("../../../../../electron-app/utils/ui/notifications/showNotification.js")
> {
    return import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
}

function requireElement<TElement extends Element>(
    root: ParentNode,
    selector: string
): TElement {
    const element = root.querySelector<TElement>(selector);
    if (!element) {
        throw new Error(`Expected ${selector} to exist`);
    }
    return element;
}

describe("createMapThemeToggle", () => {
    beforeEach(async () => {
        await resetMapThemeToggleState();
        localStorage.clear();
        document.body.className = "theme-light";
        document.body.replaceChildren();
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("get/set preference defaults to dark, persists changes, and dispatches details", async () => {
        expect.assertions(6);

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
        expect.assertions(13);

        const eventController = new AbortController();
        const eventSpy = vi.fn<(event: Event) => void>();
        const { createMapThemeToggle, MAP_THEME_EVENTS } =
            await importCreateMapThemeToggle();
        const { showNotification } = await importShowNotificationMock();

        const btn = createMapThemeToggle();

        expect(btn.tagName).toBe("BUTTON");
        expect(btn.getAttribute("aria-label")).toBe("Toggle map theme");
        expect(btn.textContent).toContain("Map Theme");
        expect(btn.classList.contains("active")).toBe(true);
        expect(btn.title).toBe("Map: Dark theme (click for light theme)");
        expect(
            requireElement<SVGPathElement>(btn, "svg path").getAttribute("d")
        ).toBe("M17 12.5A7.5 7.5 0 1 1 10 2.5a6 6 0 0 0 7 10z");

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
        expect(showNotification).toHaveBeenCalledWith(
            "Map theme set to light",
            "success"
        );

        eventController.abort();
    });

    it("creates button and dispatches changes through an injected runtime", async () => {
        expect.assertions(8);

        const { createMapThemeToggle, MAP_THEME_EVENTS } =
            await importCreateMapThemeToggle();
        const { showNotification } = await importShowNotificationMock();
        const event = new CustomEvent(MAP_THEME_EVENTS.CHANGED, {
            detail: { inverted: false },
        });
        const runtime: MapThemeToggleRuntime = {
            addDocumentListener: vi.fn(),
            clearTimeout: vi.fn(),
            createAbortController: vi.fn(() => new AbortController()),
            createElement: vi.fn((tagName) => document.createElement(tagName)),
            createMapThemeChangedEvent: vi.fn(() => event),
            createSvgElement: vi.fn((tagName) =>
                document.createElementNS("http://www.w3.org/2000/svg", tagName)
            ),
            dispatchDocumentEvent: vi.fn(() => true),
            findExistingToggle: vi.fn(() => null),
            isBodyThemeDark: vi.fn(() => false),
            isTestEnvironment: vi.fn(() => true),
            setTimeout: vi.fn(() => 1),
        };

        const btn = createMapThemeToggle(runtime);

        expect(runtime.findExistingToggle).toHaveBeenCalledOnce();
        expect(runtime.createElement).toHaveBeenCalledWith("button");
        expect(runtime.createSvgElement).toHaveBeenCalledWith("svg");
        expect(runtime.addDocumentListener).toHaveBeenCalledTimes(2);

        btn.click();

        expect(runtime.createMapThemeChangedEvent).toHaveBeenCalledWith(
            MAP_THEME_EVENTS.CHANGED,
            false
        );
        expect(runtime.dispatchDocumentEvent).toHaveBeenCalledWith(event);
        expect(showNotification).toHaveBeenCalledWith(
            "Map theme set to light",
            "success"
        );
        expect(btn.title).toBe("Map: Light theme (click for dark theme)");
    });

    it("renders the persisted light preference without active dark-map affordances", async () => {
        expect.assertions(4);

        const { createMapThemeToggle, setMapThemeInverted } =
            await importCreateMapThemeToggle();

        setMapThemeInverted(false);
        const btn = createMapThemeToggle();

        expect(btn.classList.contains("active")).toBe(false);
        expect(btn.title).toBe("Map: Light theme (click for dark theme)");
        expect(btn.querySelector("svg circle")).toMatchObject({
            namespaceURI: "http://www.w3.org/2000/svg",
        });
        expect(btn.querySelector("svg path")).toBeNull();
    });
});

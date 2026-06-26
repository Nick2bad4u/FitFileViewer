// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addFullscreenControl } from "../../../../electron-app/utils/maps/controls/mapFullscreenControl.js";
import type { MapFullscreenControlRuntime } from "../../../../electron-app/utils/maps/controls/mapFullscreenControlRuntime.js";

type MockMap = {
    _container: HTMLElement;
    invalidateSize: ReturnType<typeof vi.fn<() => void>>;
};

function getFullscreenButton(root: ParentNode = document): HTMLButtonElement {
    const button = root.querySelector("#fullscreen-btn");
    expect(button).toBeInstanceOf(HTMLButtonElement);
    return button as HTMLButtonElement;
}

function getFullscreenControl(): HTMLDivElement {
    const control = document.querySelector(".custom-fullscreen-control");
    expect(control).toBeInstanceOf(HTMLDivElement);
    return control as HTMLDivElement;
}

function getButtonState(button: HTMLButtonElement) {
    const icon = button.querySelector("svg");
    const firstRect = icon?.querySelector("rect") ?? null;

    return {
        ariaLabel: button.getAttribute("aria-label"),
        firstRect: {
            height: firstRect?.getAttribute("height") ?? null,
            width: firstRect?.getAttribute("width") ?? null,
            x: firstRect?.getAttribute("x") ?? null,
            y: firstRect?.getAttribute("y") ?? null,
        },
        iconRectCount: icon?.querySelectorAll("rect").length ?? 0,
        iconViewBox: icon?.getAttribute("viewBox") ?? null,
        tagName: button.tagName,
        title: button.title,
        type: button.type,
    };
}

describe("mapFullscreenControl.js", () => {
    let mapDiv: HTMLElement;
    let mockMap: MockMap;

    beforeEach(() => {
        // Create mock map element
        mapDiv = document.createElement("div");
        mapDiv.id = "leaflet-map";
        document.body.appendChild(mapDiv);

        // Create mock Leaflet map
        mockMap = {
            invalidateSize: vi.fn<() => void>(),
            _container: mapDiv,
        };

        // Add missing fullscreen methods to JSDOM
        if (!document.exitFullscreen) {
            Object.defineProperty(document, "exitFullscreen", {
                configurable: true,
                value: vi.fn<() => Promise<void>>().mockResolvedValue(),
            });
        }

        if (!Element.prototype.requestFullscreen) {
            Object.defineProperty(Element.prototype, "requestFullscreen", {
                configurable: true,
                value: vi.fn<() => Promise<void>>().mockResolvedValue(),
            });
        }

        // Set up fake timers for setTimeout
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Clean up
        if (mapDiv && mapDiv.parentNode) {
            mapDiv.parentNode.removeChild(mapDiv);
        }

        vi.clearAllMocks();

        // Reset mocks
        vi.restoreAllMocks();
    });

    it("should add fullscreen control to the map", () => {
        expect.assertions(5);

        addFullscreenControl(mockMap);

        // Verify the control was added
        const control = getFullscreenControl();
        expect([...control.classList]).toStrictEqual([
            "custom-fullscreen-control",
            "leaflet-top",
            "leaflet-left",
        ]);
        expect(control.parentElement).toBe(mapDiv);

        // Verify the button was created
        const button = getFullscreenButton(control);
        expect(getButtonState(button)).toStrictEqual({
            ariaLabel: "Toggle Fullscreen",
            firstRect: {
                height: "2",
                width: "5",
                x: "3",
                y: "3",
            },
            iconRectCount: 8,
            iconViewBox: "0 0 22 22",
            tagName: "BUTTON",
            title: "Toggle Fullscreen",
            type: "button",
        });
    });

    it("builds the control through an injected runtime", () => {
        expect.assertions(8);

        const runtime: MapFullscreenControlRuntime = {
            addDocumentFullscreenChangeListener: vi.fn(),
            clearTimeout: vi.fn(),
            createAbortController: vi.fn(() => new AbortController()),
            createElement: vi.fn((tagName) => document.createElement(tagName)),
            createSvgElement: vi.fn((tagName) =>
                document.createElementNS("http://www.w3.org/2000/svg", tagName)
            ),
            documentBodyContains: vi.fn(() => true),
            exitFullscreen: vi.fn(),
            getLegacyFullscreenButton: vi.fn(() => null),
            getMapContainer: vi.fn(() => mapDiv),
            isFullscreenElement: vi.fn(() => false),
            setTimeout: vi.fn(() => 1),
        };

        addFullscreenControl(mockMap, runtime);

        expect(runtime.getMapContainer).toHaveBeenCalledOnce();
        expect(runtime.createElement).toHaveBeenCalledWith("div");
        expect(runtime.createElement).toHaveBeenCalledWith("button");
        expect(runtime.createSvgElement).toHaveBeenCalledWith("svg");
        expect(runtime.createAbortController).toHaveBeenCalledOnce();
        expect(
            runtime.addDocumentFullscreenChangeListener
        ).toHaveBeenCalledOnce();
        expect(getFullscreenButton(mapDiv).title).toBe("Toggle Fullscreen");
    });

    it("should do nothing when map container is not found", () => {
        expect.assertions(2);

        // Remove the map div
        mapDiv.remove();

        vi.spyOn(console, "warn").mockReturnValue(undefined);

        addFullscreenControl(mockMap);

        // Verify warning was logged
        expect(console.warn).toHaveBeenCalledExactlyOnceWith(
            "[mapFullscreenControl] Map container not found"
        );

        // Verify no controls were added
        expect(
            [...document.querySelectorAll(".custom-fullscreen-control")].map(
                (element) => element.className
            )
        ).toStrictEqual([]);
    });

    it("should toggle fullscreen mode when button is clicked", () => {
        expect.assertions(8);

        addFullscreenControl(mockMap);

        const button = getFullscreenButton();

        // Simulate button click
        button.click();

        // Verify fullscreen class was added
        expect([...mapDiv.classList]).toStrictEqual(["fullscreen"]);

        // Verify button was updated
        expect(getButtonState(button)).toStrictEqual({
            ariaLabel: "Toggle Fullscreen",
            firstRect: {
                height: "5",
                width: "2",
                x: "7",
                y: "3",
            },
            iconRectCount: 8,
            iconViewBox: "0 0 22 22",
            tagName: "BUTTON",
            title: "Exit Fullscreen",
            type: "button",
        });

        // Verify requestFullscreen was called
        expect(mapDiv.requestFullscreen).toHaveBeenCalledOnce();

        // Verify map size was invalidated
        vi.advanceTimersByTime(300);
        expect(mockMap.invalidateSize).toHaveBeenCalledOnce();

        // Simulate another click to exit fullscreen
        button.click();

        // Verify fullscreen class was removed
        expect([...mapDiv.classList]).toStrictEqual([]);

        // Verify button was updated
        expect(getButtonState(button)).toStrictEqual({
            ariaLabel: "Toggle Fullscreen",
            firstRect: {
                height: "2",
                width: "5",
                x: "3",
                y: "3",
            },
            iconRectCount: 8,
            iconViewBox: "0 0 22 22",
            tagName: "BUTTON",
            title: "Enter Fullscreen",
            type: "button",
        });

        // Verify exitFullscreen was called
        expect(document.exitFullscreen).toHaveBeenCalledOnce();
    });

    it("should handle fullscreenchange event", () => {
        expect.assertions(4);

        // Mock the invalidateSize directly rather than working with timers
        mockMap.invalidateSize.mockClear();

        addFullscreenControl(mockMap);

        // Get the button
        const button = getFullscreenButton();

        // First make the map fullscreen
        mapDiv.classList.add("fullscreen");
        button.title = "Exit Fullscreen";

        // Mock document.fullscreenElement
        Object.defineProperty(document, "fullscreenElement", {
            configurable: true,
            get: () => null,
        });

        // Instead of mocking setTimeout, we'll test a simpler way
        // We'll manually call invalidateSize after the event is dispatched

        // Get the event listener directly from the document
        // We know there's only one fullscreenchange listener
        const event = new Event("fullscreenchange");
        document.dispatchEvent(event);

        vi.advanceTimersByTime(300);

        // Verify fullscreen class was removed
        expect([...mapDiv.classList]).toStrictEqual([]);

        // Verify button was updated
        expect(getButtonState(button)).toStrictEqual({
            ariaLabel: "Toggle Fullscreen",
            firstRect: {
                height: "2",
                width: "5",
                x: "3",
                y: "3",
            },
            iconRectCount: 8,
            iconViewBox: "0 0 22 22",
            tagName: "BUTTON",
            title: "Enter Fullscreen",
            type: "button",
        });

        // Verify map size was invalidated
        expect(mockMap.invalidateSize).toHaveBeenCalledOnce();

        // Restore mock
        vi.restoreAllMocks();
    });

    it("should create new fullscreen button even when an old one exists", () => {
        expect.assertions(6);

        const mapControls = document.createElement("div");
        mapControls.id = "map-controls";
        const oldButton = document.createElement("button");
        oldButton.id = "fullscreen-btn";
        oldButton.type = "button";
        mapControls.append(oldButton);
        document.body.append(mapControls);

        addFullscreenControl(mockMap);

        expect(
            [...mapControls.querySelectorAll("#fullscreen-btn")].map(
                (element) => element.id
            )
        ).toStrictEqual([]);
        expect(mapDiv.querySelectorAll("#fullscreen-btn")).toHaveLength(1);
        const newButton = getFullscreenButton(mapDiv);
        expect(newButton).not.toBe(oldButton);
        expect(newButton.parentElement).toBeInstanceOf(HTMLDivElement);
        expect((newButton.parentElement as HTMLDivElement).className).toBe(
            "leaflet-bar custom-fullscreen-bar"
        );
    });

    it("should skip map invalidation when the container is detached", () => {
        expect.assertions(5);

        addFullscreenControl(mockMap);
        const button = getFullscreenButton();
        mapDiv.classList.add("fullscreen");
        button.title = "Exit Fullscreen";

        // Remove map container from DOM
        mapDiv.remove();

        // Mock document.fullscreenElement
        Object.defineProperty(document, "fullscreenElement", {
            configurable: true,
            get: () => null,
        });

        expect(document.dispatchEvent(new Event("fullscreenchange"))).toBe(
            true
        );
        vi.advanceTimersByTime(300);

        expect([...mapDiv.classList]).toStrictEqual([]);
        expect(getButtonState(button)).toStrictEqual({
            ariaLabel: "Toggle Fullscreen",
            firstRect: {
                height: "2",
                width: "5",
                x: "3",
                y: "3",
            },
            iconRectCount: 8,
            iconViewBox: "0 0 22 22",
            tagName: "BUTTON",
            title: "Enter Fullscreen",
            type: "button",
        });
        expect(mockMap.invalidateSize).not.toHaveBeenCalled();
    });
});

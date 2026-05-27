/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addFullscreenControl } from "../../../utils/maps/controls/mapFullscreenControl.js";

type MockMap = {
    _container: HTMLElement;
    invalidateSize: ReturnType<typeof vi.fn>;
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
            invalidateSize: vi.fn(),
            _container: mapDiv,
        };

        // Add missing fullscreen methods to JSDOM
        if (!document.exitFullscreen) {
            document.exitFullscreen = vi
                .fn()
                .mockImplementation(() => Promise.resolve());
        }

        if (!Element.prototype.requestFullscreen) {
            Element.prototype.requestFullscreen = vi
                .fn()
                .mockImplementation(() => Promise.resolve());
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

    it("should do nothing when map container is not found", () => {
        // Remove the map div
        mapDiv.remove();

        console.warn = vi.fn();

        addFullscreenControl(mockMap);

        // Verify warning was logged
        expect(console.warn).toHaveBeenCalledOnce();
        expect(console.warn).toHaveBeenCalledWith(
            "[mapFullscreenControl] Map container not found"
        );

        // Verify no controls were added
        expect(
            document.querySelectorAll(".custom-fullscreen-control")
        ).toHaveLength(0);
    });

    it("should toggle fullscreen mode when button is clicked", () => {
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
        expect(mockMap.invalidateSize).toHaveBeenCalledTimes(1);

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
        expect(mockMap.invalidateSize).toHaveBeenCalledTimes(1);

        // Restore mock
        vi.restoreAllMocks();
    });

    it("should create new fullscreen button even when an old one exists", () => {
        const mapControls = document.createElement("div");
        mapControls.id = "map-controls";
        const oldButton = document.createElement("button");
        oldButton.id = "fullscreen-btn";
        oldButton.type = "button";
        mapControls.append(oldButton);
        document.body.append(mapControls);

        addFullscreenControl(mockMap);

        expect(mapControls.querySelectorAll("#fullscreen-btn")).toHaveLength(0);
        expect(mapDiv.querySelectorAll("#fullscreen-btn")).toHaveLength(1);
        const newButton = getFullscreenButton(mapDiv);
        expect(newButton).not.toBe(oldButton);
        expect(newButton.parentElement).toBeInstanceOf(HTMLDivElement);
        expect((newButton.parentElement as HTMLDivElement).className).toBe(
            "leaflet-bar custom-fullscreen-bar"
        );
    });

    it("should skip map invalidation when the container is detached", () => {
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

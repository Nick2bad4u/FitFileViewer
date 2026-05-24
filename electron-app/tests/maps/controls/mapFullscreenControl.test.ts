/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addFullscreenControl } from "../../../utils/maps/controls/mapFullscreenControl.js";

describe("mapFullscreenControl.js", () => {
    /** @type {HTMLElement} */
    let mapDiv;

    /**
     * @type {{
     *     invalidateSize: import("vitest").Mock;
     *     _container: HTMLElement;
     * }}
     */
    let mockMap;

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
        const control = document.querySelector(".custom-fullscreen-control");
        expect(control).toBeInstanceOf(HTMLDivElement);
        expect(control?.classList.contains("custom-fullscreen-control")).toBe(
            true
        );
        expect(control?.classList.contains("leaflet-top")).toBe(true);
        expect(control?.classList.contains("leaflet-left")).toBe(true);

        // Verify the button was created
        const button = document.querySelector("#fullscreen-btn");
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button?.tagName).toBe("BUTTON");
        expect(/** @type {HTMLButtonElement} */ button?.title).toBe(
            "Toggle Fullscreen"
        );
        expect(button?.getAttribute("aria-label")).toBe("Toggle Fullscreen");
    });

    it("should do nothing when map container is not found", () => {
        // Remove the map div
        mapDiv.remove();

        console.warn = vi.fn();

        addFullscreenControl(mockMap);

        // Verify warning was logged
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

        const button =
            /** @type {HTMLButtonElement} */ document.querySelector(
                "#fullscreen-btn"
            );
        expect(button).toBeInstanceOf(HTMLButtonElement);

        // Simulate button click
        button.click();

        // Verify fullscreen class was added
        expect(mapDiv.classList.contains("fullscreen")).toBe(true);

        // Verify button was updated
        expect(button.title).toBe("Exit Fullscreen");

        // Verify requestFullscreen was called
        expect(mapDiv.requestFullscreen).toHaveBeenCalled();

        // Verify map size was invalidated
        vi.advanceTimersByTime(300);
        expect(mockMap.invalidateSize).toHaveBeenCalledTimes(1);

        // Simulate another click to exit fullscreen
        button.click();

        // Verify fullscreen class was removed
        expect(mapDiv.classList.contains("fullscreen")).toBe(false);

        // Verify button was updated
        expect(button.title).toBe("Enter Fullscreen");

        // Verify exitFullscreen was called
        expect(document.exitFullscreen).toHaveBeenCalled();
    });

    it("should handle fullscreenchange event", () => {
        // Mock the invalidateSize directly rather than working with timers
        mockMap.invalidateSize.mockClear();

        addFullscreenControl(mockMap);

        // Get the button
        const button = document.querySelector("#fullscreen-btn");
        expect(button).toBeInstanceOf(HTMLButtonElement);

        // First make the map fullscreen
        mapDiv.classList.add("fullscreen");
        /** @type {HTMLButtonElement} */ button.title = "Exit Fullscreen";

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
        expect(mapDiv.classList.contains("fullscreen")).toBe(false);

        // Verify button was updated
        expect(/** @type {HTMLButtonElement} */ button.title).toBe(
            "Enter Fullscreen"
        );

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
        const newButton = mapDiv.querySelector("#fullscreen-btn");
        expect(newButton).toBeInstanceOf(HTMLButtonElement);
        expect(newButton).not.toBe(oldButton);
    });

    it("should not throw an error when calling invalidateSize on invalid map", () => {
        addFullscreenControl(mockMap);

        // Remove map container from DOM
        mapDiv.remove();

        // Mock document.fullscreenElement
        Object.defineProperty(document, "fullscreenElement", {
            configurable: true,
            get: () => null,
        });

        // This should not throw any error
        expect(() => {
            document.dispatchEvent(new Event("fullscreenchange"));
        }).not.toThrow();
    });
});

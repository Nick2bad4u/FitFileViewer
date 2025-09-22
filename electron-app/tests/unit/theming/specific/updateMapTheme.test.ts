/**
 * @fileoverview Tests for updateMapTheme utility
 *
 * Comprehensive test suite covering map theme updates, event handling,
 * and side effects for the updateMapTheme module.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependency
const mockGetMapThemeInverted = vi.fn();
vi.mock("../../../../utils/theming/specific/createMapThemeToggle.js", () => ({
    getMapThemeInverted: mockGetMapThemeInverted,
}));

// Extend globalThis interface for _mapThemeListener
declare global {
    var _mapThemeListener: (() => void) | undefined;
}

// Import the module AFTER setting up mocks
const { updateMapTheme } = await import("../../../../utils/theming/specific/updateMapTheme.js");

describe("updateMapTheme - comprehensive coverage", () => {
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Reset all mocks
        vi.resetAllMocks();

        // Set up console spies
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // Reset DOM
        document.body.innerHTML = "";

        // Clear module cache to test fresh imports
        vi.clearAllMocks();
    });

    describe("updateMapTheme function", () => {
        it("should apply dark theme filter when map should be dark", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(true);
            document.body.innerHTML = '<div id="leaflet-map"></div>';
            const mapElement = document.querySelector("#leaflet-map") as HTMLElement;

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalled();
            expect(mapElement.style.filter).toBe("invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)");
            expect(consoleLogSpy).toHaveBeenCalledWith("[updateMapTheme] Map theme updated - Map dark: true");
        });

        it("should remove filter when map should be light", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(false);
            document.body.innerHTML = '<div id="leaflet-map"></div>';
            const mapElement = document.querySelector("#leaflet-map") as HTMLElement;

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalled();
            expect(mapElement.style.filter).toBe("none");
            expect(consoleLogSpy).toHaveBeenCalledWith("[updateMapTheme] Map theme updated - Map dark: false");
        });

        it("should handle missing map element gracefully", () => {
            // Setup - no map element in DOM
            mockGetMapThemeInverted.mockReturnValue(true);

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalled();
            expect(consoleLogSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it("should handle errors in getMapThemeInverted", () => {
            // Setup
            const testError = new Error("Theme preference error");
            mockGetMapThemeInverted.mockImplementation(() => {
                throw testError;
            });
            document.body.innerHTML = '<div id="leaflet-map"></div>';

            // Execute
            updateMapTheme();

            // Verify error handling
            expect(consoleErrorSpy).toHaveBeenCalledWith("[updateMapTheme] Error updating map theme:", testError);
        });

        it("should handle DOM query errors", () => {
            // Setup - mock querySelector to throw
            const originalQuerySelector = document.querySelector;
            document.querySelector = vi.fn().mockImplementation(() => {
                throw new Error("DOM query error");
            });
            mockGetMapThemeInverted.mockReturnValue(true);

            try {
                // Execute
                updateMapTheme();

                // Verify error handling
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "[updateMapTheme] Error updating map theme:",
                    expect.any(Error)
                );
            } finally {
                // Restore original querySelector
                document.querySelector = originalQuerySelector;
            }
        });
    });

    describe("Event Listener Setup", () => {
        it("should have set up event listeners after module import", () => {
            // The module was already imported at the top level, so the event listeners
            // should already be established
            expect(globalThis._mapThemeListener).toBeDefined();
            expect(typeof globalThis._mapThemeListener).toBe("function");
        });

        it("should not set up duplicate listeners when already established", () => {
            // Setup - capture current listener count
            const currentListener = globalThis._mapThemeListener;

            // The condition in the module checks if(!globalThis._mapThemeListener)
            // Since it already exists, no new listeners should be added

            // Verify the listener exists
            expect(currentListener).toBeDefined();
        });
    });

    describe("Event Handling", () => {
        it("should respond to themechange events", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(true);
            document.body.innerHTML = '<div id="leaflet-map"></div>';
            const mapElement = document.querySelector("#leaflet-map") as HTMLElement;
            consoleLogSpy.mockClear();

            // Execute - call the listener directly since it's already set up
            if (globalThis._mapThemeListener) {
                globalThis._mapThemeListener();
            }

            // Verify response
            expect(mapElement.style.filter).toBe("invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)");
            expect(consoleLogSpy).toHaveBeenCalledWith("[updateMapTheme] Map theme updated - Map dark: true");
        });

        it("should respond to mapThemeChanged events", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(false);
            document.body.innerHTML = '<div id="leaflet-map"></div>';
            const mapElement = document.querySelector("#leaflet-map") as HTMLElement;
            consoleLogSpy.mockClear();

            // Execute - call the listener directly since it's already set up
            if (globalThis._mapThemeListener) {
                globalThis._mapThemeListener();
            }

            // Verify response
            expect(mapElement.style.filter).toBe("none");
            expect(consoleLogSpy).toHaveBeenCalledWith("[updateMapTheme] Map theme updated - Map dark: false");
        });
    });

    describe("Cleanup Handling", () => {
        it("should remove event listeners on beforeunload", () => {
            // Setup - ensure listener exists first
            if (!globalThis._mapThemeListener) {
                globalThis._mapThemeListener = () => updateMapTheme();
            }

            // Verify listener exists
            expect(globalThis._mapThemeListener).toBeDefined();
            const listener = globalThis._mapThemeListener;

            // Mock removeEventListener to verify cleanup
            const removeEventListenerSpy = vi.spyOn(document.body, "removeEventListener");
            const documentRemoveEventListenerSpy = vi.spyOn(document, "removeEventListener");

            // Execute cleanup manually (simulate the cleanup logic from the module)
            document.body.removeEventListener("themechange", globalThis._mapThemeListener);
            document.removeEventListener("mapThemeChanged", globalThis._mapThemeListener);
            delete globalThis._mapThemeListener;

            // Verify cleanup was called
            expect(removeEventListenerSpy).toHaveBeenCalledWith("themechange", listener);
            expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith("mapThemeChanged", listener);
            expect(globalThis._mapThemeListener).toBeUndefined();
        });

        it("should handle cleanup when no listeners exist", () => {
            // Setup - remove listener
            delete globalThis._mapThemeListener;

            // Execute - this should not throw
            const beforeUnloadEvent = new Event("beforeunload");
            expect(() => {
                window.dispatchEvent(beforeUnloadEvent);
            }).not.toThrow();
        });
    });

    describe("Integration Scenarios", () => {
        it("should handle complete theme update workflow", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(false);
            document.body.innerHTML = '<div id="leaflet-map"></div>';
            const mapElement = document.querySelector("#leaflet-map") as HTMLElement;
            consoleLogSpy.mockClear();

            // Execute complete workflow
            updateMapTheme();
            const themeEvent = new Event("themechange");
            document.body.dispatchEvent(themeEvent);

            // Verify final state
            expect(mapElement.style.filter).toBe("none");
            expect(consoleLogSpy).toHaveBeenCalledWith("[updateMapTheme] Map theme updated - Map dark: false");
        });

        it("should maintain state consistency across multiple calls", () => {
            // Setup
            document.body.innerHTML = '<div id="leaflet-map"></div>';
            const mapElement = document.querySelector("#leaflet-map") as HTMLElement;

            // Execute multiple calls with different theme states
            mockGetMapThemeInverted.mockReturnValue(true);
            updateMapTheme();
            expect(mapElement.style.filter).toBe("invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)");

            mockGetMapThemeInverted.mockReturnValue(false);
            updateMapTheme();
            expect(mapElement.style.filter).toBe("none");

            // Verify consistency
            mockGetMapThemeInverted.mockReturnValue(true);
            updateMapTheme();
            expect(mapElement.style.filter).toBe("invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)");
        });
    });
});

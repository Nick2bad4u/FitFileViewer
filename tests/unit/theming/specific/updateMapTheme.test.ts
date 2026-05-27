/**
 * @file Tests for updateMapTheme utility
 *
 *   Comprehensive test suite covering map theme updates, event handling, and side
 *   effects for the updateMapTheme module.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependency
const mockGetMapThemeInverted = vi.fn();
vi.mock(
    "../../../../electron-app/utils/theming/specific/createMapThemeToggle.js",
    () => ({
        getMapThemeInverted: mockGetMapThemeInverted,
        MAP_THEME_EVENTS: {
            CHANGED: "mapThemeChanged",
        },
    })
);

// Import the module AFTER setting up mocks
const {
    installUpdateMapThemeListeners,
    uninstallUpdateMapThemeListeners,
    updateMapTheme,
} =
    await import("../../../../electron-app/utils/theming/specific/updateMapTheme.js");

describe("updateMapTheme - comprehensive coverage", () => {
    const DARK_TILE_FILTER =
        "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)";
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    /**
     * Sets up a minimal Leaflet-like DOM structure. The dark-map theme filter
     * is applied to `.leaflet-tile-pane` (tiles) only.
     */
    const setupLeafletDom = () => {
        const mapElement = document.createElement("div");
        mapElement.id = "leaflet-map";

        const tilePane = document.createElement("div");
        tilePane.className = "leaflet-tile-pane";

        mapElement.append(tilePane);
        document.body.replaceChildren(mapElement);

        return { mapElement, tilePane };
    };

    beforeEach(() => {
        // Reset all mocks
        vi.resetAllMocks();

        // Set up console spies
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Reset DOM
        document.body.replaceChildren();

        // Ensure listener state does not leak between tests
        uninstallUpdateMapThemeListeners();

        // Clear module cache to test fresh imports
        vi.clearAllMocks();
    });

    describe("updateMapTheme function", () => {
        it("should apply dark theme filter when map should be dark", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(true);
            const { mapElement, tilePane } = setupLeafletDom();

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalled();
            // Container must never be filtered (controls/tooltips live in the map container).
            expect(mapElement.style.filter).toBe("none");
            // Tiles are filtered to create a dark basemap.
            expect(tilePane.style.filter).toBe(DARK_TILE_FILTER);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: true"
            );
        });

        it("should remove filter when map should be light", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(false);
            const { mapElement, tilePane } = setupLeafletDom();

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalled();
            expect(mapElement.style.filter).toBe("none");
            expect(tilePane.style.filter).toBe("none");
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: false"
            );
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
            expect(document.querySelector("#leaflet-map")).toBeNull();
        });

        it("should handle errors in getMapThemeInverted", () => {
            // Setup
            const testError = new Error("Theme preference error");
            mockGetMapThemeInverted.mockImplementation(() => {
                throw testError;
            });
            const mapElement = document.createElement("div");
            mapElement.id = "leaflet-map";
            document.body.append(mapElement);

            // Execute
            updateMapTheme();

            // Verify error handling
            expect(mapElement.classList.contains("ffv-map-inverted")).toBe(
                false
            );
            expect(mapElement.style.filter).toBe("");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Error updating map theme:",
                testError
            );
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
                expect(() => {
                    updateMapTheme();
                }).not.toThrow();

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

    describe("Listener Installation", () => {
        it("should install listeners when requested", () => {
            const addSpy = vi.spyOn(document, "addEventListener");
            mockGetMapThemeInverted.mockReturnValue(true);
            const { tilePane } = setupLeafletDom();

            document.dispatchEvent(new Event("themechange"));
            expect(tilePane.style.filter).toBe("");
            expect(addSpy).not.toHaveBeenCalled();
            installUpdateMapThemeListeners();

            expect(addSpy).toHaveBeenCalledWith(
                "themechange",
                expect.any(Function),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(addSpy).toHaveBeenCalledWith(
                "mapThemeChanged",
                expect.any(Function),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            document.dispatchEvent(new Event("themechange"));
            expect(tilePane.style.filter).toBe(DARK_TILE_FILTER);
        });

        it("should be idempotent (no duplicate installs)", () => {
            const addSpy = vi.spyOn(document, "addEventListener");

            installUpdateMapThemeListeners();
            installUpdateMapThemeListeners();

            // Only the first call should register listeners.
            const themechangeCalls = addSpy.mock.calls.filter(
                (c) => c[0] === "themechange"
            );
            const mapThemeChangedCalls = addSpy.mock.calls.filter(
                (c) => c[0] === "mapThemeChanged"
            );

            expect(themechangeCalls).toHaveLength(1);
            expect(mapThemeChangedCalls).toHaveLength(1);
        });
    });

    describe("Event Handling", () => {
        it("should respond to themechange events", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(true);
            const { mapElement, tilePane } = setupLeafletDom();
            consoleLogSpy.mockClear();

            document.dispatchEvent(new Event("themechange"));
            expect(tilePane.style.filter).toBe("");
            expect(consoleLogSpy).not.toHaveBeenCalled();

            installUpdateMapThemeListeners();

            // Execute
            document.dispatchEvent(new Event("themechange"));

            // Verify response
            expect(mapElement.style.filter).toBe("none");
            expect(tilePane.style.filter).toBe(DARK_TILE_FILTER);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: true"
            );
        });

        it("should respond to mapThemeChanged events", () => {
            // Setup
            mockGetMapThemeInverted.mockReturnValue(false);
            const { mapElement, tilePane } = setupLeafletDom();
            consoleLogSpy.mockClear();

            installUpdateMapThemeListeners();

            // Execute
            document.dispatchEvent(new Event("mapThemeChanged"));

            // Verify response
            expect(mapElement.style.filter).toBe("none");
            expect(tilePane.style.filter).toBe("none");
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: false"
            );
        });
    });

    describe("Cleanup Handling", () => {
        it("should abort event listeners on beforeunload", () => {
            mockGetMapThemeInverted.mockReturnValue(true);
            const { tilePane } = setupLeafletDom();

            installUpdateMapThemeListeners();
            window.dispatchEvent(new Event("beforeunload"));

            consoleLogSpy.mockClear();
            document.dispatchEvent(new Event("themechange"));

            expect(tilePane.style.filter).toBe("");
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it("should handle cleanup when no listeners exist", () => {
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
            const { mapElement, tilePane } = setupLeafletDom();
            consoleLogSpy.mockClear();

            // Execute complete workflow
            updateMapTheme();
            mockGetMapThemeInverted.mockReturnValue(true);
            const themeEvent = new Event("themechange");
            document.body.dispatchEvent(themeEvent);

            // Verify final state
            expect(mapElement.style.filter).toBe("none");
            expect(tilePane.style.filter).toBe("none");
            expect(consoleLogSpy).not.toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: true"
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: false"
            );
        });

        it("should maintain state consistency across multiple calls", () => {
            // Setup
            const { mapElement, tilePane } = setupLeafletDom();
            const snapshots: Array<{
                classApplied: boolean;
                containerFilter: string;
                tileFilter: string;
            }> = [];

            // Execute multiple calls with different theme states
            mockGetMapThemeInverted.mockReturnValue(true);
            updateMapTheme();
            snapshots.push({
                classApplied: mapElement.classList.contains("ffv-map-inverted"),
                containerFilter: mapElement.style.filter,
                tileFilter: tilePane.style.filter,
            });

            mockGetMapThemeInverted.mockReturnValue(false);
            updateMapTheme();
            snapshots.push({
                classApplied: mapElement.classList.contains("ffv-map-inverted"),
                containerFilter: mapElement.style.filter,
                tileFilter: tilePane.style.filter,
            });

            // Verify consistency
            mockGetMapThemeInverted.mockReturnValue(true);
            updateMapTheme();
            snapshots.push({
                classApplied: mapElement.classList.contains("ffv-map-inverted"),
                containerFilter: mapElement.style.filter,
                tileFilter: tilePane.style.filter,
            });

            expect(snapshots).toEqual([
                {
                    classApplied: true,
                    containerFilter: "none",
                    tileFilter: DARK_TILE_FILTER,
                },
                {
                    classApplied: false,
                    containerFilter: "none",
                    tileFilter: "none",
                },
                {
                    classApplied: true,
                    containerFilter: "none",
                    tileFilter: DARK_TILE_FILTER,
                },
            ]);
        });
    });
});

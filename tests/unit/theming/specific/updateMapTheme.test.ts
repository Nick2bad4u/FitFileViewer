// Tests for updateMapTheme utility.
// Comprehensive coverage for map theme updates, event handling, and side effects.

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependency
const mockGetMapThemeInverted = vi.hoisted(() => vi.fn<() => boolean>());
vi.mock(
    import("../../../../electron-app/utils/theming/specific/createMapThemeToggle.js"),
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
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

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

    const getClassList = (element: Element) => [...element.classList];

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
            expect.hasAssertions();

            // Setup
            mockGetMapThemeInverted.mockReturnValue(true);
            const { mapElement, tilePane } = setupLeafletDom();

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalledWith();
            // Container must never be filtered (controls/tooltips live in the map container).
            expect(mapElement.style.filter).toBe("none");
            // Tiles are filtered to create a dark basemap.
            expect(tilePane.style.filter).toBe(DARK_TILE_FILTER);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: true"
            );
        });

        it("should remove filter when map should be light", () => {
            expect.hasAssertions();

            // Setup
            mockGetMapThemeInverted.mockReturnValue(false);
            const { mapElement, tilePane } = setupLeafletDom();

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalledWith();
            expect(mapElement.style.filter).toBe("none");
            expect(tilePane.style.filter).toBe("none");
            expect(consoleLogSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Map theme updated - Map dark: false"
            );
        });

        it("should handle missing map element gracefully", () => {
            expect.hasAssertions();

            // Setup - no map element in DOM
            mockGetMapThemeInverted.mockReturnValue(true);

            // Execute
            updateMapTheme();

            // Verify
            expect(mockGetMapThemeInverted).toHaveBeenCalledWith();
            expect(consoleLogSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(document.querySelector("#leaflet-map")).toBeNull();
        });

        it("should handle errors in getMapThemeInverted", () => {
            expect.hasAssertions();

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
            expect(getClassList(mapElement)).not.toContain("ffv-map-inverted");
            expect(mapElement.style.filter).toBe("");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[updateMapTheme] Error updating map theme:",
                testError
            );
        });

        it("should handle DOM query errors", () => {
            expect.hasAssertions();

            // Setup - mock querySelector to throw
            const { mapElement, tilePane } = setupLeafletDom();
            const querySelectorSpy = vi
                .spyOn(document, "querySelector")
                .mockImplementation((): never => {
                    throw new Error("DOM query error");
                });
            mockGetMapThemeInverted.mockReturnValue(true);

            try {
                updateMapTheme();

                // Verify error handling
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "[updateMapTheme] Error updating map theme:",
                    expect.any(Error)
                );
                expect(mockGetMapThemeInverted).not.toHaveBeenCalled();
                expect(mapElement.parentElement).toBe(document.body);
                expect(mapElement.style.filter).toBe("");
                expect(tilePane.style.filter).toBe("");
            } finally {
                // Restore original querySelector
                querySelectorSpy.mockRestore();
            }
        });
    });

    describe("listener installation", () => {
        it("should install listeners when requested", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

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

    describe("event handling", () => {
        it("should respond to themechange events", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

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

    describe("cleanup handling", () => {
        it("should abort event listeners on beforeunload", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

            const beforeUnloadEvent = new Event("beforeunload");
            const dispatched = window.dispatchEvent(beforeUnloadEvent);

            expect({
                defaultPrevented: beforeUnloadEvent.defaultPrevented,
                dispatched,
            }).toStrictEqual({
                defaultPrevented: false,
                dispatched: true,
            });
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete theme update workflow", () => {
            expect.hasAssertions();

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
            expect.hasAssertions();

            // Setup
            const { mapElement, tilePane } = setupLeafletDom();
            const snapshots: Array<{
                classes: string[];
                containerFilter: string;
                tileFilter: string;
            }> = [];

            // Execute multiple calls with different theme states
            mockGetMapThemeInverted.mockReturnValue(true);
            updateMapTheme();
            snapshots.push({
                classes: getClassList(mapElement),
                containerFilter: mapElement.style.filter,
                tileFilter: tilePane.style.filter,
            });

            mockGetMapThemeInverted.mockReturnValue(false);
            updateMapTheme();
            snapshots.push({
                classes: getClassList(mapElement),
                containerFilter: mapElement.style.filter,
                tileFilter: tilePane.style.filter,
            });

            // Verify consistency
            mockGetMapThemeInverted.mockReturnValue(true);
            updateMapTheme();
            snapshots.push({
                classes: getClassList(mapElement),
                containerFilter: mapElement.style.filter,
                tileFilter: tilePane.style.filter,
            });

            expect(snapshots).toEqual([
                {
                    classes: ["ffv-map-inverted"],
                    containerFilter: "none",
                    tileFilter: DARK_TILE_FILTER,
                },
                {
                    classes: [],
                    containerFilter: "none",
                    tileFilter: "none",
                },
                {
                    classes: ["ffv-map-inverted"],
                    containerFilter: "none",
                    tileFilter: DARK_TILE_FILTER,
                },
            ]);
        });
    });
});

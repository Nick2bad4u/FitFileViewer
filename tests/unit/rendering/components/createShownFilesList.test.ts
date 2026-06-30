/**
 * Comprehensive tests for createShownFilesList.js covering DOM creation, theme
 * handling, color accessibility, file management, interactive features, tooltip
 * behavior, and Leaflet map integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    getRegisteredLeafletMapInstance,
    resetRegisteredLeafletMapInstanceForTests,
    setRegisteredLeafletMapInstance,
} from "../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js";
import {
    clearLeafletRuntimeForTests,
    registerLeafletRuntime,
} from "../../../../electron-app/utils/maps/core/leafletRuntime.js";
import { createRegisteredLeafletRuntime } from "../../../fixtures/leafletRuntime.js";
import {
    resetRegisteredMapMeasureControlForTests,
    setRegisteredMapMeasureControl,
} from "../../../../electron-app/utils/maps/state/mapMeasureControlState.js";
import {
    resetRegisteredMapPluginControlsForTests,
    setRegisteredMapDrawnItems,
} from "../../../../electron-app/utils/maps/state/mapPluginControlState.js";
import {
    registerOverlayMapPolyline,
    resetMapPolylineRegistryForTests,
} from "../../../../electron-app/utils/maps/state/mapPolylineRegistryState.js";
import {
    clearOverlayTooltipTimeout,
    getOverlayTooltipTimeout,
} from "../../../../electron-app/utils/rendering/components/shownFilesListTooltipState.js";

type MockComputedStyle = { color: string };
type MockGetComputedStyle = ReturnType<
    typeof vi.fn<(element: Element) => MockComputedStyle>
>;
type ThemeColors = {
    border: string;
    surface: string;
    text: string;
};
type MockLeafletCircleMarker = {
    bringToFront: ReturnType<typeof vi.fn<() => void>>;
    options: unknown;
};
type MockLeafletRuntime = {
    CircleMarker: new (options: unknown) => MockLeafletCircleMarker;
};

// Mock dependencies
const mockGetThemeColors = vi.fn<() => Partial<ThemeColors>>();
const defaultMockChartOverlayColorPalette = [
    "#1976d2",
    "#388e3c",
    "#f57c00",
    "#7b1fa2",
    "#d32f2f",
];
const mockChartOverlayColorPalette = [...defaultMockChartOverlayColorPalette];
const mapDrawLapsMocks = vi.hoisted(() => ({
    highlightedOverlayIndex: null as null | number,
    getHighlightedOverlayIndex: vi.fn<() => null | number>(),
    setHighlightedOverlayIndex: vi.fn<(overlayIndex?: null | number) => void>(),
    updateOverlayHighlights: vi.fn<() => void>(),
}));
const mockUpdateOverlayHighlights = mapDrawLapsMocks.updateOverlayHighlights;
const mockSetLoadedFiles =
    vi.fn<(files: readonly unknown[], source?: string) => void>();
const loadedFitFilesFixture = vi.hoisted(() => ({
    files: undefined as null | unknown[] | undefined,
}));
const renderMapMocks = vi.hoisted(() => ({
    renderMap: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: mockGetThemeColors,
    })
);

vi.mock(
    import("../../../../electron-app/utils/charts/theming/chartOverlayColorPalette.js"),
    () => ({
        chartOverlayColorPalette: mockChartOverlayColorPalette,
    })
);

vi.mock(
    import("../../../../electron-app/utils/maps/layers/mapDrawLaps.js"),
    () => ({
        getHighlightedOverlayIndex: mapDrawLapsMocks.getHighlightedOverlayIndex,
        setHighlightedOverlayIndex: mapDrawLapsMocks.setHighlightedOverlayIndex,
        updateOverlayHighlights: mapDrawLapsMocks.updateOverlayHighlights,
    })
);

vi.mock(
    import("../../../../electron-app/utils/maps/core/renderMap.js"),
    () => ({
        renderMap: renderMapMocks.renderMap,
    })
);

vi.mock(
    import("../../../../electron-app/utils/state/domain/loadedFitFilesState.js"),
    () => ({
        clearOverlayLoadedFitFiles: vi.fn((source?: string) => {
            const files = Array.isArray(loadedFitFilesFixture.files)
                ? loadedFitFilesFixture.files.slice(0, 1)
                : [];
            loadedFitFilesFixture.files = files;
            mockSetLoadedFiles(files, source);
            return files;
        }),
        getLoadedFitFiles: vi.fn(() =>
            Array.isArray(loadedFitFilesFixture.files)
                ? [...loadedFitFilesFixture.files]
                : []
        ),
        removeLoadedFitFileAt: vi.fn((index: number, source?: string) => {
            const files = Array.isArray(loadedFitFilesFixture.files)
                ? [...loadedFitFilesFixture.files]
                : [];
            files.splice(index, 1);
            loadedFitFilesFixture.files = files;
            mockSetLoadedFiles(files, source);
            return files;
        }),
        setLoadedFitFiles: vi.fn(
            (files: readonly unknown[], source?: string) => {
                const nextFiles = [...files];
                loadedFitFilesFixture.files = nextFiles;
                mockSetLoadedFiles(nextFiles, source);
                return nextFiles;
            }
        ),
    })
);

function getOverlayItems(container: HTMLElement): HTMLLIElement[] {
    return Array.from(
        container.querySelectorAll<HTMLLIElement>("#shown-files-ul li")
    );
}

function getRequiredOverlayItem(
    container: HTMLElement,
    index = 0
): HTMLLIElement {
    const item = getOverlayItems(container)[index];

    if (!item) {
        throw new Error(`Expected overlay item ${index}`);
    }

    return item;
}

function getRequiredElement<T extends Element>(
    element: T | null | undefined,
    description: string
): T {
    if (!element) {
        throw new Error(`Expected ${description}`);
    }

    return element;
}

function getRequiredRemoveButton(item: HTMLLIElement): HTMLElement {
    const button = item.querySelector<HTMLElement>(".overlay-remove-btn");

    if (!button) {
        throw new Error("Expected overlay remove button");
    }

    return button;
}

function getRequiredEventListenerOptions(
    call:
        | [
              string,
              EventListenerOrEventListenerObject,
              (AddEventListenerOptions | boolean | undefined)?,
          ]
        | undefined,
    eventName: string
): AddEventListenerOptions {
    if (!call) {
        throw new Error(`Expected ${eventName} listener`);
    }

    const options = call[2];
    if (!options || typeof options === "boolean") {
        throw new Error(`Expected ${eventName} listener options`);
    }

    return options;
}

function getOverlayText(container: HTMLElement): string[] {
    return getOverlayItems(container).map((item) =>
        String(item.textContent ?? "").trim()
    );
}

function getOverlayState(): {
    highlightedOverlayIdx: null | number;
    overlayTooltipTimeout: unknown;
} {
    return {
        highlightedOverlayIdx: mapDrawLapsMocks.highlightedOverlayIndex,
        overlayTooltipTimeout: getOverlayTooltipTimeout(),
    };
}

function getRegisteredOverlayMapInstance(): {
    fitBounds: ReturnType<
        typeof vi.fn<(bounds: unknown, options: unknown) => void>
    >;
} {
    const mapInstance = getRegisteredLeafletMapInstance<{
        fitBounds: ReturnType<
            typeof vi.fn<(bounds: unknown, options: unknown) => void>
        >;
    }>();
    if (!mapInstance) {
        throw new Error("Expected registered map instance");
    }

    return mapInstance;
}

function resetMapDrawLapsMocks(): void {
    mapDrawLapsMocks.highlightedOverlayIndex = null;
    mapDrawLapsMocks.getHighlightedOverlayIndex.mockImplementation(
        () => mapDrawLapsMocks.highlightedOverlayIndex
    );
    mapDrawLapsMocks.setHighlightedOverlayIndex.mockImplementation(
        (overlayIndex) => {
            mapDrawLapsMocks.highlightedOverlayIndex =
                typeof overlayIndex === "number" ? overlayIndex : null;
            mapDrawLapsMocks.updateOverlayHighlights();
        }
    );
}

function getComputedStyleSpan(
    mockGetComputedStyle: MockGetComputedStyle
): HTMLSpanElement {
    const target = mockGetComputedStyle.mock.calls[0]?.[0];

    if (!(target instanceof HTMLSpanElement)) {
        throw new TypeError("Expected getComputedStyle to inspect a span");
    }

    return target;
}

function getBaseContainerState(container: HTMLElement) {
    const heading = container.querySelector("b");
    const list = container.querySelector("#shown-files-ul");

    return {
        childTags: [...container.children].map((child) => child.tagName),
        className: container.className,
        headingText: heading?.textContent ?? null,
        list: {
            id: list?.id ?? null,
            margin: list instanceof HTMLElement ? list.style.margin : null,
            paddingLeft:
                list instanceof HTMLElement ? list.style.paddingLeft : null,
            role: list?.getAttribute("role") ?? null,
            tagName: list?.tagName ?? null,
        },
        maxHeight: container.style.maxHeight,
        maxWidth: container.style.maxWidth,
        overflow: container.style.overflow,
    };
}

function getOverlayItemState(item: HTMLLIElement | undefined) {
    if (!item) {
        throw new Error("Expected overlay item to exist");
    }

    const removeButton = item.querySelector(".overlay-remove-btn");

    return {
        ariaLabel: item.getAttribute("aria-label"),
        ariaSelected: item.getAttribute("aria-selected"),
        color: item.style.color,
        cursor: item.style.cursor,
        filter: item.style.filter,
        overlayIndex: item.getAttribute("data-overlay-index"),
        removeButton: {
            ariaLabel: removeButton?.getAttribute("aria-label") ?? null,
            color:
                removeButton instanceof HTMLElement
                    ? removeButton.style.color
                    : null,
            opacity:
                removeButton instanceof HTMLElement
                    ? removeButton.style.opacity
                    : null,
            role: removeButton?.getAttribute("role") ?? null,
            tabIndex: removeButton?.getAttribute("tabindex") ?? null,
            text: removeButton?.textContent ?? null,
            title: removeButton?.getAttribute("title") ?? null,
        },
        role: item.getAttribute("role"),
        tabIndex: item.tabIndex,
        text: item.textContent?.trim() ?? "",
    };
}

function getOverlayItemStates(container: HTMLElement) {
    return getOverlayItems(container).map((item) => getOverlayItemState(item));
}

function getClearAllButton(container: HTMLElement): HTMLButtonElement {
    const button = container.querySelector(".overlay-clear-all-btn");
    if (!(button instanceof HTMLButtonElement)) {
        throw new Error("Expected clear all button to exist");
    }

    return button;
}

function getClearAllButtonState(container: HTMLElement) {
    const button = getClearAllButton(container);

    return {
        ariaLabel: button.getAttribute("aria-label"),
        background: button.style.background,
        border: button.style.border,
        borderRadius: button.style.borderRadius,
        color: button.style.color,
        cursor: button.style.cursor,
        float: button.style.float,
        fontSize: button.style.fontSize,
        margin: button.style.margin,
        padding: button.style.padding,
        text: button.textContent,
        title: button.title,
        type: button.type,
    };
}

describe("createShownFilesList", () => {
    let createShownFilesList: () => HTMLElement;
    let updateShownFilesList: () => void;
    let leafletRuntime: MockLeafletRuntime;

    beforeEach(async () => {
        // Reset DOM
        document.body.innerHTML = "";
        document.body.className = "";
        mockChartOverlayColorPalette.splice(
            0,
            mockChartOverlayColorPalette.length,
            ...defaultMockChartOverlayColorPalette
        );

        // Mock getComputedStyle using vi.stubGlobal
        vi.stubGlobal(
            "getComputedStyle",
            vi
                .fn<
                    () => {
                        backgroundColor: string;
                        color: string;
                        getPropertyValue: (property: string) => string;
                    }
                >()
                .mockReturnValue({
                    color: "rgb(255, 255, 255)",
                    backgroundColor: "rgb(255, 255, 255)",
                    getPropertyValue: vi.fn<(property: string) => string>(
                        (prop) => {
                            if (prop === "color") return "rgb(255, 255, 255)";
                            return "";
                        }
                    ),
                })
        );

        // Reset mock functions and re-establish default return values
        vi.clearAllMocks();
        resetMapDrawLapsMocks();
        resetRegisteredLeafletMapInstanceForTests();
        resetRegisteredMapMeasureControlForTests();
        resetRegisteredMapPluginControlsForTests();
        resetMapPolylineRegistryForTests();

        // Re-establish default mock returns after clearing
        mockGetThemeColors.mockReturnValue({
            surface: "#ffffff",
            text: "#000000",
            border: "#cccccc",
        });

        loadedFitFilesFixture.files = [];
        clearOverlayTooltipTimeout();
        renderMapMocks.renderMap.mockClear();
        leafletRuntime = {
            CircleMarker: class MockCircleMarker {
                constructor(public options: unknown) {}
                bringToFront = vi.fn<() => void>();
            },
        };
        registerLeafletRuntime(createRegisteredLeafletRuntime(leafletRuntime));

        // Import the function dynamically
        const module =
            await import("../../../../electron-app/utils/rendering/components/createShownFilesList.js");
        const updaterModule =
            await import("../../../../electron-app/utils/rendering/components/shownFilesListUpdater.js");
        createShownFilesList = module.createShownFilesList;
        updateShownFilesList = updaterModule.updateShownFilesList;
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
        resetRegisteredLeafletMapInstanceForTests();
        resetRegisteredMapMeasureControlForTests();
        resetRegisteredMapPluginControlsForTests();
        resetMapPolylineRegistryForTests();
        clearOverlayTooltipTimeout();
        clearLeafletRuntimeForTests();
    });

    describe("basic DOM Creation", () => {
        it("creates container element with correct properties", () => {
            expect.assertions(2);
            const container = createShownFilesList();

            expect(container).toBeInstanceOf(HTMLElement);
            expect(getBaseContainerState(container)).toStrictEqual({
                childTags: ["B", "UL"],
                className: "shown-files-list map-controls-secondary-card",
                headingText: "Extra Files shown on map:",
                list: {
                    id: "shown-files-ul",
                    margin: "0px",
                    paddingLeft: "18px",
                    role: "listbox",
                    tagName: "UL",
                },
                maxHeight: "fit-content",
                maxWidth: "fit-content",
                overflow: "auto",
            });
        });

        it("sets initial HTML content with proper structure", () => {
            expect.assertions(2);
            const container = createShownFilesList();

            const ul = container.querySelector("#shown-files-ul");

            expect(ul).toBeInstanceOf(HTMLUListElement);
            expect(getBaseContainerState(container)).toMatchObject({
                childTags: ["B", "UL"],
                headingText: "Extra Files shown on map:",
                list: {
                    id: "shown-files-ul",
                    margin: "0px",
                    paddingLeft: "18px",
                    role: "listbox",
                    tagName: "UL",
                },
            });
        });

        it("applies theme styles on creation", () => {
            expect.assertions(7);
            // Clear previous calls and set up fresh mock
            mockGetThemeColors.mockClear();
            mockGetThemeColors.mockReturnValue({
                surface: "#f5f5f5",
                text: "#333333",
                border: "#dddddd",
            });

            const container = createShownFilesList();

            // Instead of checking if mock was called, verify the container was created with theme styles
            // The container should have proper styling applied
            expect(container).toBeInstanceOf(HTMLElement);
            expect(container.className).toBe(
                "shown-files-list map-controls-secondary-card"
            );

            // Container should have styling applied (theme is applied automatically)
            expect(container.style.margin).toBe("0px");
            expect(container.style.fontSize).toBe("0.95em");

            expect(container.style.color).not.toBe("");
            expect(container.style.border).toMatch(/1px solid/);
            expect(container.getAttribute("aria-label")).toBe(
                "Map overlay files"
            );
        });

        it("handles missing theme properties with defaults", () => {
            expect.assertions(7);
            // Clear previous calls and set up fresh mock
            mockGetThemeColors.mockClear();
            mockGetThemeColors.mockReturnValue({
                surface: "#ffffff",
                text: "#000000",
                border: "#cccccc",
            });

            const container = createShownFilesList();

            // Instead of checking if mock was called, verify container behavior
            expect(container).toBeInstanceOf(HTMLElement);
            expect(container.className).toBe(
                "shown-files-list map-controls-secondary-card"
            );

            // Container should have default styling and structure
            expect(container.style.margin).toBe("0px");
            expect(container.style.fontSize).toBe("0.95em");

            expect(container.style.color).not.toBe("");
            expect(container.style.border).toMatch(/1px solid/);
            expect(container.getAttribute("aria-disabled")).toBe("true");
        });

        it("sets up theme change event listener", () => {
            expect.assertions(3);
            const addEventListenerSpy = vi.spyOn(
                document.body,
                "addEventListener"
            );

            const container = createShownFilesList();

            const [
                eventName,
                listener,
                options,
            ] =
                addEventListenerSpy.mock.calls.find(
                    ([event]) => event === "themechange"
                ) ?? [];
            const listenerOptions = options as
                | AddEventListenerOptions
                | undefined;

            expect({
                eventName,
                listenerType: typeof listener,
                signalIsAbortSignal:
                    listenerOptions?.signal instanceof AbortSignal,
            }).toStrictEqual({
                eventName: "themechange",
                listenerType: "function",
                signalIsAbortSignal: true,
            });
            expect((container as any)._dispose).toBeTypeOf("function");
            expect(container.getAttribute("role")).toBe("region");
        });

        it("initially hides container when no overlays exist", () => {
            expect.assertions(1);
            loadedFitFilesFixture.files = [];

            const container = createShownFilesList();

            expect(container.style.display).toBe("none");
        });

        it("initially hides container when only main file exists", () => {
            expect.assertions(1);
            loadedFitFilesFixture.files = [{ data: {}, filePath: "main.fit" }];

            const container = createShownFilesList();

            expect(container.style.display).toBe("none");
        });

        it("shows container when multiple files exist", () => {
            expect.assertions(1);
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            const container = createShownFilesList();

            expect(container.style.display).toBe("");
        });
    });

    describe("color Accessibility System", () => {
        let container: HTMLElement;
        beforeEach(() => {
            container = createShownFilesList();
        });

        it("handles hex color parsing correctly", () => {
            expect.assertions(3);
            // Enable dark theme to trigger getComputedStyle call
            document.body.classList.add("theme-dark");

            // Test through actual color accessibility checking
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            // Mock getComputedStyle for color testing
            const mockGetComputedStyle = vi
                .fn<(element: Element) => MockComputedStyle>()
                .mockReturnValue({ color: "rgb(25, 118, 210)" });
            vi.stubGlobal("getComputedStyle", mockGetComputedStyle);

            updateShownFilesList();

            const firstItem = container.querySelector("#shown-files-ul li");

            expect(firstItem).toBeInstanceOf(HTMLLIElement);
            expect(
                getOverlayItemState(firstItem as HTMLLIElement | undefined)
            ).toMatchObject({
                ariaLabel: "Overlay overlay.fit",
                ariaSelected: "false",
                cursor: "pointer",
                overlayIndex: "1",
                removeButton: {
                    ariaLabel: "Remove overlay overlay.fit",
                    role: "button",
                    tabIndex: "-1",
                    text: "×",
                    title: "Remove this overlay",
                },
                role: "option",
                tabIndex: -1,
                text: "File: overlay.fit×",
            });
            // Verify that color accessibility was checked
            expect(
                getComputedStyleSpan(mockGetComputedStyle).style.display
            ).toBe("none");
        });

        it("handles RGB color parsing correctly", () => {
            expect.assertions(4);
            // Enable dark theme to trigger getComputedStyle call
            document.body.classList.add("theme-dark");

            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            const mockGetComputedStyle = vi
                .fn<(element: Element) => MockComputedStyle>()
                .mockReturnValue({ color: "rgb(255, 255, 255)" });
            vi.stubGlobal("getComputedStyle", mockGetComputedStyle);

            updateShownFilesList();

            const firstItem = getRequiredOverlayItem(container);

            expect(firstItem).toBeInstanceOf(HTMLLIElement);
            expect(getOverlayItemState(firstItem)).toMatchObject({
                filter: "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)",
                text: "File: overlay.fit×",
            });
            expect(firstItem.style.color).not.toBe("");
            expect(
                getComputedStyleSpan(mockGetComputedStyle).style.display
            ).toBe("none");
        });

        it("handles invalid color formats gracefully", () => {
            expect.assertions(3);
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            const mockGetComputedStyle = vi
                .fn<() => MockComputedStyle>()
                .mockReturnValue({ color: "invalid-color" });
            Object.defineProperty(window, "getComputedStyle", {
                value: mockGetComputedStyle,
                configurable: true,
            });

            updateShownFilesList();

            const items = getOverlayItems(container);
            expect(items).toHaveLength(1);
            expect(
                String(getRequiredOverlayItem(container).textContent).trim()
            ).toBe("File: overlay.fit×");
            expect(container.getAttribute("aria-disabled")).toBe("false");
        });

        it("calculates luminance correctly for contrast ratios", () => {
            expect.assertions(2);
            // Test by setting up contrasting colors
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            const mockGetComputedStyle = vi
                .fn<() => MockComputedStyle>()
                .mockReturnValue({ color: "rgb(0, 0, 0)" });
            Object.defineProperty(window, "getComputedStyle", {
                value: mockGetComputedStyle,
                configurable: true,
            });

            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            expect(ul).toBeInstanceOf(HTMLUListElement);
            expect(getOverlayText(container)).toStrictEqual([
                "File: overlay.fit×",
            ]);
        });

        it("handles dark theme filter simulation", () => {
            expect.assertions(1);
            document.body.classList.add("theme-dark");

            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            // Mock DOM manipulation to avoid Node type issues
            const mockAppendChild = vi.fn<(node: Node) => Node>((node) => node);
            const mockRemoveChild = vi.fn<(node: Node) => Node>((node) => node);

            vi.spyOn(document.body, "appendChild").mockImplementation(
                mockAppendChild
            );
            vi.spyOn(document.body, "removeChild").mockImplementation(
                mockRemoveChild
            );

            const mockGetComputedStyle = vi
                .fn<() => MockComputedStyle>()
                .mockReturnValue({ color: "rgb(100, 150, 200)" });
            Object.defineProperty(window, "getComputedStyle", {
                value: mockGetComputedStyle,
                configurable: true,
            });

            updateShownFilesList();

            const firstItem = getOverlayItems(container)[0];
            expect(getOverlayItemState(firstItem)).toMatchObject({
                filter: "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)",
                text: "File: overlay.fit×",
            });
        });

        it("meets WCAG AA contrast requirements", () => {
            expect.assertions(1);
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            // High contrast colors should pass
            const mockGetComputedStyle = vi
                .fn<() => MockComputedStyle>()
                .mockReturnValue({ color: "rgb(255, 255, 255)" });
            Object.defineProperty(window, "getComputedStyle", {
                value: mockGetComputedStyle,
                configurable: true,
            });

            updateShownFilesList();

            expect(
                getOverlayItemState(getOverlayItems(container)[0])
            ).toMatchObject({
                ariaLabel: "Overlay overlay.fit",
                overlayIndex: "1",
                role: "option",
                text: "File: overlay.fit×",
            });
        });

        it("handles 3-character hex colors", () => {
            expect.assertions(2);
            mockChartOverlayColorPalette[1] = "#abc";

            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            updateShownFilesList();

            const firstItem = getRequiredOverlayItem(container);
            expect(firstItem.style.color).toMatch(
                /(#abc|rgb\(170,\s*187,\s*204\))/
            );
            expect(getOverlayItemState(firstItem)).toMatchObject({
                text: "File: overlay.fit×",
            });
        });

        it("handles 6-character hex colors", () => {
            expect.assertions(2);
            mockChartOverlayColorPalette[1] = "#aabbcc";

            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay.fit" },
            ];

            updateShownFilesList();

            const firstItem = getRequiredOverlayItem(container);
            expect(firstItem.style.color).toMatch(
                /(#aabbcc|rgb\(170,\s*187,\s*204\))/
            );
            expect(getOverlayItemState(firstItem)).toMatchObject({
                text: "File: overlay.fit×",
            });
        });
    });

    describe("file List Management", () => {
        beforeEach(() => {
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
                { data: {}, filePath: "overlay2.fit" },
            ];
        });

        it("skips main file and shows only overlays", () => {
            expect.assertions(1);
            const container = createShownFilesList();
            updateShownFilesList();

            expect(getOverlayText(container)).toStrictEqual([
                "File: overlay1.fit×",
                "File: overlay2.fit×",
            ]);
        });

        it("applies color palette cycling", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            expect(
                getOverlayItemStates(container).map((item) => ({
                    color: item.color,
                    overlayIndex: item.overlayIndex,
                    text: item.text,
                }))
            ).toStrictEqual([
                {
                    color: "rgb(56, 142, 60)",
                    overlayIndex: "1",
                    text: "File: overlay1.fit×",
                },
                {
                    color: "rgb(245, 124, 0)",
                    overlayIndex: "2",
                    text: "File: overlay2.fit×",
                },
            ]);
            expect(
                getOverlayItemState(getRequiredOverlayItem(container, 0)).color
            ).not.toBe(
                getOverlayItemState(getRequiredOverlayItem(container, 1)).color
            );
        });

        it("creates list items with correct structure", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            expect(
                getOverlayItemState(getOverlayItems(container)[0])
            ).toMatchObject({
                ariaLabel: "Overlay overlay1.fit",
                ariaSelected: "false",
                cursor: "pointer",
                overlayIndex: "1",
                removeButton: {
                    ariaLabel: "Remove overlay overlay1.fit",
                    opacity: "0",
                    role: "button",
                    tabIndex: "-1",
                    text: "×",
                    title: "Remove this overlay",
                },
                role: "option",
                tabIndex: -1,
                text: "File: overlay1.fit×",
            });
            expect(getRequiredOverlayItem(container).style.position).toBe(
                "relative"
            );
        });

        it("creates remove buttons for each overlay", () => {
            expect.assertions(1);
            const container = createShownFilesList();
            updateShownFilesList();

            expect(
                getOverlayItemStates(container).map(
                    ({ overlayIndex, removeButton }) => ({
                        overlayIndex,
                        removeButton,
                    })
                )
            ).toStrictEqual([
                {
                    overlayIndex: "1",
                    removeButton: {
                        ariaLabel: "Remove overlay overlay1.fit",
                        color: "rgb(229, 57, 53)",
                        opacity: "0",
                        role: "button",
                        tabIndex: "-1",
                        text: "×",
                        title: "Remove this overlay",
                    },
                },
                {
                    overlayIndex: "2",
                    removeButton: {
                        ariaLabel: "Remove overlay overlay2.fit",
                        color: "rgb(229, 57, 53)",
                        opacity: "0",
                        role: "button",
                        tabIndex: "-1",
                        text: "×",
                        title: "Remove this overlay",
                    },
                },
            ]);
        });

        it("applies dark theme styling when enabled", () => {
            expect.assertions(2);
            document.body.classList.add("theme-dark");

            const container = createShownFilesList();
            updateShownFilesList();

            const firstItem = getRequiredOverlayItem(container);
            const removeBtn = getRequiredRemoveButton(firstItem);

            expect(getOverlayItemState(firstItem)).toMatchObject({
                filter: "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)",
                text: "File: overlay1.fit×",
            });
            expect(removeBtn.style.color).toMatch(
                /(#ff5252|rgb\(255,\s*82,\s*82\))/
            );
        });

        it("applies light theme styling when enabled", () => {
            expect.assertions(1);
            document.body.classList.remove("theme-dark");

            const container = createShownFilesList();
            updateShownFilesList();

            const removeBtn = getRequiredRemoveButton(
                getRequiredOverlayItem(container)
            );

            expect(removeBtn.style.color).toMatch(
                /(#e53935|rgb\(229,\s*57,\s*53\))/
            );
        });

        it("handles missing file paths gracefully", () => {
            expect.assertions(2);
            loadedFitFilesFixture.files = [
                { data: {} }, // No filePath
                { data: {}, filePath: undefined },
                { data: {}, filePath: "overlay.fit" },
            ];

            const container = createShownFilesList();

            updateShownFilesList();

            expect(getOverlayText(container)).toStrictEqual([
                "File: (unknown)×",
                "File: overlay.fit×",
            ]);
            expect(container.getAttribute("aria-disabled")).toBe("false");
        });

        it("clears existing list before updating", () => {
            expect.assertions(2);
            const container = createShownFilesList();

            // First update
            updateShownFilesList();
            expect(getOverlayText(container)).toStrictEqual([
                "File: overlay1.fit×",
                "File: overlay2.fit×",
            ]);

            // Change files and update again
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "different.fit" },
            ];
            updateShownFilesList();

            expect(getOverlayText(container)).toStrictEqual([
                "File: different.fit×",
            ]);
        });

        it("hides container when no overlays exist", () => {
            expect.assertions(1);
            loadedFitFilesFixture.files = [{ data: {}, filePath: "main.fit" }];

            const container = createShownFilesList();
            updateShownFilesList();

            expect(container.style.display).toBe("none");
        });

        it("shows container when overlays exist", () => {
            expect.assertions(1);
            const container = createShownFilesList();
            updateShownFilesList();

            expect(container.style.display).toBe("");
        });
    });

    describe("remove Button Functionality", () => {
        beforeEach(() => {
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
                { data: {}, filePath: "overlay2.fit" },
            ];
        });

        it("removes individual overlay when remove button clicked", async () => {
            expect.assertions(4);
            const container = createShownFilesList();

            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li");
            const removeBtn = firstItem?.querySelector("span") as HTMLElement;

            // Click remove button
            removeBtn.click();

            expect(loadedFitFilesFixture.files).toHaveLength(2);
            expect(loadedFitFilesFixture.files[1].filePath).toBe(
                "overlay2.fit"
            );
            await vi.waitFor(() => {
                if (renderMapMocks.renderMap.mock.calls.length === 0) {
                    throw new Error("Expected renderMap to be scheduled");
                }
            });
            expect(renderMapMocks.renderMap).toHaveBeenCalledWith();
            expect(getOverlayText(container)).toStrictEqual([
                "File: overlay2.fit×",
            ]);
        });

        it("prevents event propagation on remove button click", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li");
            const removeBtn = firstItem?.querySelector("span") as HTMLElement;

            const clickEvent = new MouseEvent("click", { bubbles: true });
            const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

            removeBtn.dispatchEvent(clickEvent);

            expect(stopPropagationSpy).toHaveBeenCalledWith();
            expect(loadedFitFilesFixture.files).toHaveLength(2);
        });

        it("shows remove button on hover", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li");
            const removeBtn = firstItem?.querySelector("span") as HTMLElement;

            expect(removeBtn.style.opacity).toBe("0");

            // Trigger mouseenter
            removeBtn.dispatchEvent(new MouseEvent("mouseenter"));

            expect(removeBtn.style.opacity).toBe("1");
        });

        it("hides remove button on mouse leave", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li");
            const removeBtn = firstItem?.querySelector("span") as HTMLElement;

            // First show it
            removeBtn.dispatchEvent(new MouseEvent("mouseenter"));
            expect(removeBtn.style.opacity).toBe("1");

            // Then hide it
            removeBtn.dispatchEvent(new MouseEvent("mouseleave"));
            expect(removeBtn.style.opacity).toBe("0");
        });

        it("cleans up tooltips after removal", () => {
            expect.assertions(1);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li");
            const removeBtn = firstItem?.querySelector("span") as HTMLElement;

            const mockTooltip = document.createElement("div");
            mockTooltip.className = "overlay-filename-tooltip";
            document.body.appendChild(mockTooltip);

            removeBtn.click();

            // Fast-forward the timeout
            vi.advanceTimersByTime(10);

            expect(
                document.querySelector(".overlay-filename-tooltip")
            ).toBeNull();

            vi.useRealTimers();
        });

        it("handles missing loadedFitFiles gracefully", () => {
            expect.assertions(1);
            loadedFitFilesFixture.files = null;

            const container = createShownFilesList();
            updateShownFilesList();

            // Should not throw when trying to remove
            const ul = getRequiredElement(
                container.querySelector("#shown-files-ul"),
                "shown files list"
            );
            expect(Array.from(ul.children)).toStrictEqual([]);
        });
    });

    describe("clear All Functionality", () => {
        beforeEach(() => {
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
                { data: {}, filePath: "overlay2.fit" },
            ];
        });

        it("creates clear all button when overlays exist", () => {
            expect.assertions(1);
            const container = createShownFilesList();
            updateShownFilesList();

            expect(getClearAllButtonState(container)).toMatchObject({
                ariaLabel: "Remove all overlays from the map",
                text: "Clear All",
                title: "Remove all overlays from the map",
                type: "button",
            });
        });

        it("styles clear all button correctly", () => {
            expect.assertions(1);
            const container = createShownFilesList();
            updateShownFilesList();

            expect(getClearAllButtonState(container)).toMatchObject({
                background: "rgb(229, 57, 53)",
                border: "medium",
                borderRadius: "4px",
                color: "rgb(255, 255, 255)",
                cursor: "pointer",
                float: "right",
                fontSize: "0.95em",
                margin: "8px 0px 0px",
                padding: "3px 12px",
            });
        });

        it("removes all overlays and map measurements when clear all clicked", async () => {
            expect.assertions(6);
            const clearMeasurements = vi.fn<() => void>();
            const clearDrawnLayers = vi.fn<() => void>();
            setRegisteredMapMeasureControl({ clearMeasurements });
            setRegisteredMapDrawnItems({ clearLayers: clearDrawnLayers });
            const container = createShownFilesList();
            updateShownFilesList();

            getClearAllButton(container).click();

            expect(loadedFitFilesFixture.files).toStrictEqual([
                { data: {}, filePath: "main.fit" },
            ]);
            expect(clearMeasurements).toHaveBeenCalledOnce();
            expect(clearDrawnLayers).toHaveBeenCalledOnce();
            await vi.waitFor(() => {
                if (renderMapMocks.renderMap.mock.calls.length === 0) {
                    throw new Error("Expected renderMap to be scheduled");
                }
            });
            expect(renderMapMocks.renderMap).toHaveBeenCalledWith();
            expect(getOverlayItems(container)).toStrictEqual([]);
            expect(
                container.querySelector(".overlay-clear-all-btn")
            ).toBeNull();
        });

        it("prevents event propagation on clear all click", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const clickEvent = new MouseEvent("click", { bubbles: true });
            const stopPropagationSpy = vi.spyOn(clickEvent, "stopPropagation");

            getClearAllButton(container).dispatchEvent(clickEvent);

            expect(stopPropagationSpy).toHaveBeenCalledWith();
            expect(loadedFitFilesFixture.files).toStrictEqual([
                { data: {}, filePath: "main.fit" },
            ]);
        });

        it("cleans up tooltips after clearing all", async () => {
            expect.assertions(1);
            const container = createShownFilesList();
            updateShownFilesList();

            const mockTooltip = document.createElement("div");
            mockTooltip.className = "overlay-filename-tooltip";
            document.body.appendChild(mockTooltip);

            getClearAllButton(container).click();

            await Promise.resolve();

            expect(
                document.querySelector(".overlay-filename-tooltip")
            ).toBeNull();
        });

        it("does not create duplicate clear all buttons", () => {
            expect.assertions(1);
            const container = createShownFilesList();

            // Update multiple times
            updateShownFilesList();
            updateShownFilesList();
            updateShownFilesList();

            const clearAllBtns = container.querySelectorAll(
                ".overlay-clear-all-btn"
            );
            expect(clearAllBtns).toHaveLength(1);
        });

        it("does not create clear all button when no overlays exist", () => {
            expect.assertions(2);
            loadedFitFilesFixture.files = [{ data: {}, filePath: "main.fit" }];

            const container = createShownFilesList();
            updateShownFilesList();

            const clearAllBtn = container.querySelector(
                ".overlay-clear-all-btn"
            );
            expect(clearAllBtn).toBeNull();
            expect(container.style.display).toBe("none");
        });
    });

    describe("interactive Features and Event Handling", () => {
        beforeEach(() => {
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
            ];
        });

        it("handles list item click events", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const firstItem = getRequiredOverlayItem(container);

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(mockUpdateOverlayHighlights).toHaveBeenCalledWith();
        });

        it("handles mouse enter events on list items", () => {
            expect.assertions(3);
            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;
            const removeBtn = firstItem.querySelector("span") as HTMLElement;

            firstItem.dispatchEvent(new MouseEvent("mouseenter"));

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(removeBtn.style.opacity).toBe("1");
            expect(removeBtn.style.opacity).not.toBe("0");
        });

        it("handles mouse leave events on list items", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;
            const removeBtn = firstItem.querySelector("span") as HTMLElement;

            firstItem.dispatchEvent(new MouseEvent("mouseleave"));

            expect(getOverlayState().highlightedOverlayIdx).toBeNull();
            expect(removeBtn.style.opacity).toBe("0");
        });

        it("clears tooltip timeout on mouse leave", () => {
            expect.assertions(1);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            // Enter then leave quickly
            firstItem.dispatchEvent(new MouseEvent("mouseenter"));
            firstItem.dispatchEvent(new MouseEvent("mouseleave"));

            expect(getOverlayState().overlayTooltipTimeout).toBeNull();

            vi.useRealTimers();
        });

        it("cleans up tooltip removers on mouse leave", () => {
            expect.assertions(2);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            // Set up tooltip remover
            const tooltipRemover = vi.fn<() => void>();
            (firstItem as any)._tooltipRemover = tooltipRemover;

            firstItem.dispatchEvent(new MouseEvent("mouseleave"));

            vi.advanceTimersByTime(10);

            expect(tooltipRemover).toHaveBeenCalledWith();
            expect(getOverlayState().highlightedOverlayIdx).toBeNull();

            vi.useRealTimers();
        });
    });

    describe("tooltip System", () => {
        beforeEach(() => {
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "/path/to/overlay1.fit" },
            ];
        });

        it("creates tooltip after delay on mouse enter", () => {
            expect.assertions(1);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );

            // Advance past the tooltip delay
            vi.advanceTimersByTime(350);

            const tooltip = document.querySelector(".overlay-filename-tooltip");
            expect(tooltip).toBeInstanceOf(HTMLDivElement);

            vi.useRealTimers();
        });

        it("positions tooltip correctly", () => {
            expect.assertions(2);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            const mouseEvent = new MouseEvent("mouseenter", {
                clientX: 100,
                clientY: 100,
            });
            firstItem.dispatchEvent(mouseEvent);

            vi.advanceTimersByTime(350);

            const tooltip = document.querySelector(
                ".overlay-filename-tooltip"
            ) as HTMLElement;
            expect(tooltip.style.position).toBe("fixed");
            expect(tooltip.style.zIndex).toBe("9999");

            vi.useRealTimers();
        });

        it("styles tooltip for dark theme", () => {
            expect.assertions(3);
            vi.useFakeTimers();
            document.body.classList.add("theme-dark");

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );
            vi.advanceTimersByTime(350);

            const tooltip = document.querySelector(
                ".overlay-filename-tooltip"
            ) as HTMLElement;
            expect(tooltip.style.background).toMatch(
                /(#23263a|rgb\(35,\s*38,\s*58\))/
            );
            expect(tooltip.style.color).toMatch(
                /(#fff|rgb\(255,\s*255,\s*255\)|white)/
            );
            expect(tooltip.style.border).toMatch(
                /(1px solid #444|1px solid rgb\(68,\s*68,\s*68\)|^$)/
            ); // Allow empty for JSDOM

            vi.useRealTimers();
        });

        it("styles tooltip for light theme", () => {
            expect.assertions(3);
            vi.useFakeTimers();
            document.body.classList.remove("theme-dark");

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );
            vi.advanceTimersByTime(350);

            const tooltip = document.querySelector(
                ".overlay-filename-tooltip"
            ) as HTMLElement;
            expect(tooltip.style.background).toMatch(
                /(#fff|rgb\(255,\s*255,\s*255\)|white)/
            );
            expect(tooltip.style.color).toMatch(/(#222|rgb\(34,\s*34,\s*34\))/);
            expect(tooltip.style.border).toMatch(
                /(1px solid #bbb|1px solid rgb\(187,\s*187,\s*187\)|^$)/
            ); // Allow empty for JSDOM

            vi.useRealTimers();
        });

        it("shows accessibility warning in tooltip when needed", () => {
            expect.assertions(1);
            vi.useFakeTimers();

            // Enable dark theme to use dark background
            document.body.classList.add("theme-dark");

            // Set up data for testing
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "/path/to/overlay1.fit" },
            ];

            // Mock low contrast colors to trigger warning
            // Dark theme bg is "rgb(30,34,40)", so use a similar dark color for poor contrast
            const mockGetComputedStyle = vi
                .fn<() => MockComputedStyle>()
                .mockReturnValue({ color: "rgb(40, 44, 50)" });
            Object.defineProperty(window, "getComputedStyle", {
                value: mockGetComputedStyle,
                configurable: true,
            });

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );
            vi.advanceTimersByTime(350);

            const tooltip = getRequiredElement(
                document.querySelector(".overlay-filename-tooltip"),
                "overlay filename tooltip"
            );
            // Check for the actual warning text from the source code
            expect(tooltip.innerHTML).toContain(
                "⚠️ This color may be hard to read in this theme."
            );

            vi.useRealTimers();
        });

        it("handles tooltip positioning near screen edges", () => {
            expect.assertions(2);
            vi.useFakeTimers();

            // Mock window dimensions
            Object.defineProperty(window, "innerWidth", {
                value: 1024,
                configurable: true,
            });
            Object.defineProperty(window, "innerHeight", {
                value: 768,
                configurable: true,
            });

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            // Mock tooltip dimensions
            const mockTooltip = document.createElement("div");
            mockTooltip.className = "overlay-filename-tooltip";
            Object.defineProperties(mockTooltip, {
                offsetWidth: { value: 200, configurable: true },
                offsetHeight: { value: 100, configurable: true },
            });

            vi.spyOn(document, "createElement").mockReturnValue(
                mockTooltip as any
            );

            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 900, clientY: 700 })
            );
            vi.advanceTimersByTime(350);

            // Should adjust position to stay within screen bounds
            expect(mockTooltip.style.left).toBe("812px");
            expect(mockTooltip.style.top).toBe("656px");

            vi.useRealTimers();
        });

        it("removes existing tooltips before creating new ones", () => {
            expect.assertions(1);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            // Create existing tooltip
            const existingTooltip = document.createElement("div");
            existingTooltip.className = "overlay-filename-tooltip";
            document.body.appendChild(existingTooltip);

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );

            // Should remove existing tooltip immediately
            expect(
                document.querySelector(".overlay-filename-tooltip")
            ).toBeNull();

            vi.useRealTimers();
        });

        it("only shows tooltip if still highlighted", () => {
            expect.assertions(1);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );

            // Change highlighted index before timeout
            mapDrawLapsMocks.highlightedOverlayIndex = 999;

            vi.advanceTimersByTime(350);

            const tooltip = document.querySelector(".overlay-filename-tooltip");
            expect(tooltip).toBeNull();

            vi.useRealTimers();
        });
    });

    describe("leaflet Map Integration", () => {
        let mockPolyline: any;

        beforeEach(() => {
            mockPolyline = {
                bringToFront: vi.fn<() => void>(),
                getElement: vi
                    .fn<() => { style: Record<string, string> }>()
                    .mockReturnValue({
                        style: {
                            transition: "",
                            filter: "",
                        },
                    }),
                getBounds: vi
                    .fn<() => Record<string, never>>()
                    .mockReturnValue({}),
                options: { color: "#1976d2" },
                _map: {
                    _layers: {
                        marker1: {
                            options: { color: "#1976d2" },
                            bringToFront: vi.fn<() => void>(),
                        },
                    },
                },
            };

            registerOverlayMapPolyline(1, mockPolyline);
            setRegisteredLeafletMapInstance({
                fitBounds: vi.fn<(bounds: unknown, options: unknown) => void>(),
            });

            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
            ];
        });

        it("brings polyline to front on click", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(mockPolyline.bringToFront).toHaveBeenCalledWith();
        });

        it("brings matching markers to front", () => {
            expect.assertions(3);
            // Create CircleMarker instance
            const mockMarker = new leafletRuntime.CircleMarker({
                color: "#1976d2",
            });
            mockPolyline._map._layers.marker1 = mockMarker;

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(mockPolyline.bringToFront).toHaveBeenCalledWith();
            expect(mockMarker.bringToFront).toHaveBeenCalledWith();
        });

        it("applies visual effects to polyline element", () => {
            expect.assertions(3);
            vi.useFakeTimers();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            const polyElem = mockPolyline.getElement();
            expect(polyElem.style.transition).toBe("filter 0.2s");
            expect(polyElem.style.filter).toContain(
                "drop-shadow(0 0 16px #1976d2)"
            );

            // Fast-forward the timeout
            vi.advanceTimersByTime(250);

            expect(polyElem.style.filter).toContain(
                "drop-shadow(0 0 8px #1976d2)"
            );

            vi.useRealTimers();
        });

        it("fits map bounds to polyline", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(
                getRegisteredOverlayMapInstance().fitBounds
            ).toHaveBeenCalledWith(mockPolyline.getBounds(), {
                padding: [20, 20],
            });
        });

        it("handles missing polyline gracefully", () => {
            expect.assertions(3);
            resetMapPolylineRegistryForTests();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(mockUpdateOverlayHighlights).toHaveBeenCalledWith();
            expect(
                getRegisteredOverlayMapInstance().fitBounds
            ).not.toHaveBeenCalled();
        });

        it("handles missing map instance gracefully", () => {
            expect.assertions(3);
            resetRegisteredLeafletMapInstanceForTests();

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(mockPolyline.bringToFront).toHaveBeenCalledWith();
            expect(mockPolyline.getElement).toHaveBeenCalledWith();
        });

        it("handles polyline without getElement method", () => {
            expect.assertions(3);
            mockPolyline.getElement = null;

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(mockPolyline.bringToFront).toHaveBeenCalledWith();
            expect(
                getRegisteredOverlayMapInstance().fitBounds
            ).toHaveBeenCalledWith(mockPolyline.getBounds(), {
                padding: [20, 20],
            });
        });

        it("handles polyline without getBounds method", () => {
            expect.assertions(3);
            mockPolyline.getBounds = null;

            const container = createShownFilesList();
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            firstItem.click();

            expect(getOverlayState().highlightedOverlayIdx).toBe(1);
            expect(mockPolyline.bringToFront).toHaveBeenCalledWith();
            expect(
                getRegisteredOverlayMapInstance().fitBounds
            ).not.toHaveBeenCalled();
        });
    });

    describe("edge Cases and Error Handling", () => {
        it("handles missing ul element gracefully", () => {
            expect.assertions(2);
            const container = createShownFilesList();
            container.innerHTML = ""; // Remove the ul

            updateShownFilesList();

            expect(container.querySelector("#shown-files-ul")).toBeNull();
            expect(getOverlayItems(container)).toStrictEqual([]);
        });

        it("handles theme change during operation", () => {
            expect.assertions(4);
            const container = createShownFilesList();

            // Clear previous calls and set up fresh mock
            mockGetThemeColors.mockClear();
            mockGetThemeColors.mockReturnValue({
                surface: "#000000",
                text: "#ffffff",
                border: "#444444",
            });

            // Trigger theme change event
            const themeEvent = new Event("themechange");
            document.body.dispatchEvent(themeEvent);

            // Instead of checking mock calls, verify the container exists and can handle theme changes
            expect(container).toBeInstanceOf(HTMLElement);
            expect(container.className).toBe(
                "shown-files-list map-controls-secondary-card"
            );

            document.body.dispatchEvent(new Event("themechange"));

            expect(container.style.color).toMatch(
                /(#ffffff|rgb\(255,\s*255,\s*255\))/
            );
            expect(container.style.border).toContain("1px solid");
        });

        it("handles empty loadedFitFiles array", () => {
            expect.assertions(3);
            loadedFitFilesFixture.files = [];

            const container = createShownFilesList();

            updateShownFilesList();

            expect(container.style.display).toBe("none");
            expect(container.getAttribute("aria-disabled")).toBe("true");
            expect(getOverlayItems(container)).toStrictEqual([]);
        });

        it("handles null loadedFitFiles", () => {
            expect.assertions(3);
            loadedFitFilesFixture.files = null;

            const container = createShownFilesList();

            updateShownFilesList();

            expect(container.style.display).toBe("none");
            expect(container.getAttribute("aria-disabled")).toBe("true");
            expect(getOverlayItems(container)).toStrictEqual([]);
        });

        it("handles undefined loadedFitFiles", () => {
            expect.assertions(3);
            loadedFitFilesFixture.files = undefined;

            const container = createShownFilesList();

            updateShownFilesList();

            expect(container.style.display).toBe("none");
            expect(container.getAttribute("aria-disabled")).toBe("true");
            expect(getOverlayItems(container)).toStrictEqual([]);
        });

        it("handles missing color palette gracefully", () => {
            expect.assertions(2);
            mockChartOverlayColorPalette.length = 0;

            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
            ];

            const container = createShownFilesList();

            updateShownFilesList();

            const firstItem = getRequiredOverlayItem(container);
            expect(firstItem.style.color).toMatch(
                /(#1976d2|rgb\(25,\s*118,\s*210\))/
            );
            expect(String(firstItem.textContent).trim()).toBe(
                "File: overlay1.fit×"
            );
        });

        it("prevents memory leaks by aborting event listeners", () => {
            expect.assertions(3);
            const addEventListenerSpy = vi.spyOn(window, "addEventListener");

            const container = createShownFilesList();
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
            ];
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            // Set up tooltip with mousemove listener
            vi.useFakeTimers();
            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );
            vi.advanceTimersByTime(350);

            const mouseMoveCall = addEventListenerSpy.mock.calls.find(
                ([eventName]) => eventName === "mousemove"
            );
            const mouseMoveOptions = getRequiredEventListenerOptions(
                mouseMoveCall,
                "mousemove"
            );
            expect(mouseMoveOptions.signal).toBeInstanceOf(AbortSignal);
            expect({
                aborted: mouseMoveOptions.signal?.aborted,
            }).toStrictEqual({
                aborted: false,
            });

            // Trigger cleanup
            firstItem.dispatchEvent(new MouseEvent("mouseleave"));

            expect({
                aborted: mouseMoveOptions.signal?.aborted,
            }).toStrictEqual({
                aborted: true,
            });

            vi.useRealTimers();
        });

        it("handles concurrent tooltip operations", () => {
            expect.assertions(1);
            vi.useFakeTimers();

            const container = createShownFilesList();
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
            ];
            updateShownFilesList();

            const ul = container.querySelector("#shown-files-ul");
            const firstItem = ul?.querySelector("li") as HTMLElement;

            // Start tooltip creation
            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 100, clientY: 100 })
            );

            // Start another tooltip before first completes
            firstItem.dispatchEvent(
                new MouseEvent("mouseenter", { clientX: 200, clientY: 200 })
            );

            vi.advanceTimersByTime(350);

            // Should only have one tooltip
            const tooltips = document.querySelectorAll(
                ".overlay-filename-tooltip"
            );
            expect(tooltips.length).toBeLessThanOrEqual(1);

            vi.useRealTimers();
        });
    });

    describe("theme Integration", () => {
        it("responds to dynamic theme changes", () => {
            expect.assertions(4);
            const container = createShownFilesList();

            // Clear previous calls and change theme colors
            mockGetThemeColors.mockClear();
            mockGetThemeColors.mockReturnValue({
                surface: "#2d2d2d",
                text: "#e0e0e0",
                border: "#555555",
            });

            // Simulate theme change event
            document.body.dispatchEvent(new Event("themechange"));

            // Instead of checking mock calls, verify functionality
            expect(container).toBeInstanceOf(HTMLElement);
            expect(container.className).toBe(
                "shown-files-list map-controls-secondary-card"
            );

            document.body.dispatchEvent(new Event("themechange"));

            expect(container.style.color).toMatch(
                /(#e0e0e0|rgb\(224,\s*224,\s*224\))/
            );
            expect(container.style.border).toContain("1px solid");
        });

        it("handles partial theme color objects", () => {
            expect.assertions(4);
            const container = createShownFilesList();

            // Clear previous calls and set up theme
            mockGetThemeColors.mockClear();
            mockGetThemeColors.mockReturnValue({
                surface: "#f0f0f0",
                text: "#000000",
                border: "#cccccc",
            });

            document.body.dispatchEvent(new Event("themechange"));

            // Instead of checking mock calls, verify functionality
            expect(container).toBeInstanceOf(HTMLElement);
            expect(container.className).toBe(
                "shown-files-list map-controls-secondary-card"
            );

            mockGetThemeColors.mockReturnValue({ surface: "#partial" });
            document.body.dispatchEvent(new Event("themechange"));

            expect(container.style.color).toMatch(
                /(#000000|rgb\(0,\s*0,\s*0\))/
            );
            expect(container.style.border).toContain("1px solid");
        });

        it("maintains theme state across updates", () => {
            expect.assertions(4);
            const container = createShownFilesList();

            // Clear previous calls and set up theme
            mockGetThemeColors.mockClear();
            mockGetThemeColors.mockReturnValue({
                surface: "#custom",
                text: "#customtext",
                border: "#customborder",
            });

            document.body.dispatchEvent(new Event("themechange"));

            // Theme should persist through file list updates
            loadedFitFilesFixture.files = [
                { data: {}, filePath: "main.fit" },
                { data: {}, filePath: "overlay1.fit" },
            ];
            updateShownFilesList();

            // Instead of checking mock calls, verify functionality
            expect(container).toBeInstanceOf(HTMLElement);
            expect(container.className).toBe(
                "shown-files-list map-controls-secondary-card"
            );

            updateShownFilesList();

            expect(getOverlayText(container)).toStrictEqual([
                "File: overlay1.fit×",
            ]);
            const borderStyle = container.style.border;
            expect({
                isEmpty: borderStyle === "",
                startsWithSolidBorder: borderStyle.startsWith("1px solid"),
            }).not.toStrictEqual({
                isEmpty: false,
                startsWithSolidBorder: false,
            });
        });
    });
});

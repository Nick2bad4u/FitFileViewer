import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as getThemeColorsModule from "../../../../../electron-app/utils/charts/theming/getThemeColors.js";

import { chartOverlayColorPalette } from "../../../../../electron-app/utils/charts/theming/chartOverlayColorPalette.js";
import { createElevationProfileButton } from "../../../../../electron-app/utils/ui/controls/createElevationProfileButton.js";
import { setActiveFitRawData } from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import {
    __resetStateManagerForTests,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";
import { setLoadedFitFiles } from "../../../../../electron-app/utils/state/domain/loadedFitFilesState.js";
import {
    clearChartRuntimeForTests,
    setChartRuntime,
} from "../../../../../electron-app/utils/charts/core/chartRuntime.js";

type ElevationProfilePoint = { x: number; y: number };
type ElevationProfileFileModel = {
    altitudes: ElevationProfilePoint[];
    color: string;
    filePath: string;
};
type ChartMockImplementation = (
    context: CanvasRenderingContext2D,
    config: unknown
) => void;
type MockElevationPopupWindow = Window;

let openSpy: any;
let chartMock: ReturnType<typeof vi.fn<ChartMockImplementation>>;

const getPopupWindow = (): MockElevationPopupWindow =>
    openSpy.mock.results[0].value as MockElevationPopupWindow;

const getPopupChartContainer = (mockWin: MockElevationPopupWindow) => {
    const container = mockWin.document.querySelector("#elevChartsContainer");

    if (!(container instanceof HTMLDivElement)) {
        throw new TypeError("Expected elevation chart container");
    }

    return container;
};

const requirePopupElement = <TElement extends Element>(
    element: TElement | null,
    label: string
): TElement => {
    if (element === null) {
        throw new TypeError(`Expected ${label}`);
    }

    return element;
};

const getElevationButtonState = (button: HTMLButtonElement) => {
    const icon = requirePopupElement(
            button.querySelector("svg.icon"),
            "elevation button icon"
        ),
        polyline = requirePopupElement(
            icon.querySelector("polyline"),
            "elevation button polyline"
        );

    return {
        className: button.className,
        dotCount: icon.querySelectorAll("circle").length,
        iconHeight: icon.getAttribute("height"),
        iconViewBox: icon.getAttribute("viewBox"),
        iconWidth: icon.getAttribute("width"),
        polylinePoints: polyline.getAttribute("points"),
        text: button.textContent,
        title: button.title,
    };
};

const getPopupHeaderState = (mockWin: MockElevationPopupWindow) => ({
    fileCount: requirePopupElement(
        mockWin.document.querySelector("header span"),
        "popup file count"
    ).textContent,
    heading: requirePopupElement(
        mockWin.document.querySelector("header h2"),
        "popup heading"
    ).textContent,
});

const getPopupFileLabels = (mockWin: MockElevationPopupWindow) =>
    Array.from(
        mockWin.document.querySelectorAll(".elev-profile-label span:not(.dot)"),
        (label) => label.textContent
    );

const getPopupNoDataMessages = (mockWin: MockElevationPopupWindow) =>
    Array.from(
        mockWin.document.querySelectorAll(".no-altitude-data"),
        (message) => message.textContent
    );

const clickElevationButton = async (
    button: HTMLButtonElement,
    waitForRenderedPopup = true
): Promise<void> => {
    button.click();
    await vi.waitFor(() => {
        if (openSpy.mock.calls.length === 0) {
            throw new Error("Expected elevation profile popup to open");
        }
    });

    if (waitForRenderedPopup) {
        await vi.waitFor(() => {
            const popupWindow = getPopupWindow();
            if (popupWindow.document.body.childElementCount === 0) {
                throw new Error("Expected elevation profile popup to render");
            }
        });
    }
};

describe(createElevationProfileButton, () => {
    let originalWindow: any;
    let getContextSpy: ReturnType<typeof vi.spyOn>;

    // eslint-disable-next-line vitest/no-hooks -- Shared DOM/window setup keeps popup state isolated across cases.
    beforeEach(() => {
        __resetStateManagerForTests();
        // Store original window properties
        originalWindow = { ...window };

        // Mock document.createElement
        document.body.replaceChildren();
        document.body.classList.remove("theme-dark");
        vi.spyOn(getThemeColorsModule, "getThemeColors").mockReturnValue({
            primary: "#3b82f6",
            background: "#f8fafc",
            surface: "#ffffff",
            shadowLight: "rgba(0,0,0,0.1)",
            shadowMedium: "rgba(0,0,0,0.15)",
            text: "#1e293b",
            textSecondary: "#64748b",
            border: "#e2e8f0",
            borderLight: "#f1f5f9",
            primaryShadow: "rgba(59,130,246,0.25)",
        });
        getContextSpy = vi
            .spyOn(HTMLCanvasElement.prototype, "getContext")
            .mockReturnValue({} as CanvasRenderingContext2D);

        chartMock = Object.assign(
            vi.fn<ChartMockImplementation>(function MockChart() {}),
            { register: vi.fn() }
        );
        setChartRuntime(chartMock);

        // Setup window.open spy
        openSpy = vi.spyOn(window, "open").mockImplementation(() => {
            const popupDocument =
                document.implementation.createHTMLDocument("");

            return {
                HTMLCanvasElement,
                document: popupDocument,
            } as unknown as MockElevationPopupWindow;
        });
    });

    // eslint-disable-next-line vitest/no-hooks -- Restores mocked browser globals after each popup scenario.
    afterEach(() => {
        __resetStateManagerForTests();
        clearChartRuntimeForTests();
        vi.restoreAllMocks();
        // Reset window properties
        Object.keys(window).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(originalWindow, key)) {
                delete (window as any)[key];
            }
        });
    });

    it("should create a button with correct properties", () => {
        expect.assertions(2);

        // Create the button
        const button = createElevationProfileButton();

        // Check button properties
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(getElevationButtonState(button)).toEqual({
            className: "map-action-btn",
            dotCount: 5,
            iconHeight: "18",
            iconViewBox: "0 0 20 20",
            iconWidth: "18",
            polylinePoints: "2,16 6,10 10,14 14,6 18,12",
            text: "Elevation",
            title: "Show Elevation Profile",
        });
    });

    it("should open a window with no files when clicked and no fit files are loaded", async () => {
        expect.assertions(6);

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        // Verify window.open was called with correct parameters
        expect(openSpy).toHaveBeenCalledWith(
            "",
            "Elevation Profile",
            "width=900,height=600"
        );

        const mockWin = getPopupWindow();

        expect(mockWin.document.body.className).toBe("theme-light");
        expect(getPopupHeaderState(mockWin)).toEqual({
            fileCount: "0 file",
            heading: "Elevation Profiles",
        });
        expect(getPopupChartContainer(mockWin).children).toHaveLength(0);
        expect(mockWin.document.querySelector("script")).toBeNull();

        expect(chartMock).not.toHaveBeenCalled();
    });

    it("should handle loadedFitFiles when available", async () => {
        expect.assertions(5);

        setLoadedFitFiles(
            [
                {
                    filePath: "test-file.fit",
                    data: {
                        recordMesgs: [
                            { positionLat: 1, positionLong: 2, altitude: 100 },
                            { positionLat: 3, positionLong: 4, altitude: 200 },
                        ],
                    },
                },
            ],
            "createElevationProfileButton.test"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalledOnce();

        const mockWin = getPopupWindow();

        expect(getPopupHeaderState(mockWin)).toEqual({
            fileCount: "1 file",
            heading: "Elevation Profiles",
        });
        expect(getPopupFileLabels(mockWin)).toStrictEqual(["test-file.fit"]);
        expect(chartMock).toHaveBeenCalledOnce();
        expect(chartMock.mock.calls[0][1].data.datasets[0].data).toStrictEqual([
            100,
            200,
        ]);
    });

    it("should handle active FIT raw data when no loadedFitFiles are available", async () => {
        expect.assertions(4);

        setActiveFitRawData(
            {
                cachedFilePath: "global-test.fit",
                recordMesgs: [
                    { positionLat: 5, positionLong: 6, altitude: 300 },
                    { positionLat: 7, positionLong: 8, altitude: 400 },
                ],
            },
            { source: "test" }
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalledOnce();

        const mockWin = getPopupWindow();

        expect(getPopupFileLabels(mockWin)).toStrictEqual(["global-test.fit"]);
        expect(chartMock).toHaveBeenCalledOnce();
        expect(chartMock.mock.calls[0][1].data.datasets[0].data).toStrictEqual([
            300,
            400,
        ]);
    });

    it("should use active current-file metadata for raw-data elevation fallback labels", async () => {
        expect.assertions(3);

        setState("fitFile.currentFile", "C:/rides/current-activity.fit", {
            source: "test",
        });
        setActiveFitRawData(
            {
                cachedFilePath: "stale-cache.fit",
                recordMesgs: [
                    { positionLat: 5, positionLong: 6, altitude: 300 },
                    { positionLat: 7, positionLong: 8, altitude: 400 },
                ],
            },
            { source: "test" }
        );

        const button = createElevationProfileButton();
        await clickElevationButton(button);

        const mockWin = getPopupWindow();

        expect(getPopupFileLabels(mockWin)).toStrictEqual([
            "C:/rides/current-activity.fit",
        ]);
        expect(chartMock).toHaveBeenCalledOnce();
        expect(chartMock.mock.calls[0][1].data.datasets[0].data).toStrictEqual([
            300,
            400,
        ]);
    });

    it("should handle active FIT raw data without recordMesgs", async () => {
        expect.assertions(3);

        setActiveFitRawData(
            {
                cachedFilePath: "incomplete-data.fit",
                // No recordMesgs array
            },
            { source: "test" }
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalledOnce();

        const mockWin = getPopupWindow();

        expect(getPopupHeaderState(mockWin)).toEqual({
            fileCount: "0 file",
            heading: "Elevation Profiles",
        });
        expect(getPopupChartContainer(mockWin).children).toHaveLength(0);
    });

    it("should handle popup window being blocked", async () => {
        expect.assertions(2);

        // Make window.open return null to simulate blocked popup
        openSpy.mockReturnValueOnce(null);

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button, false);

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalledOnce();
        expect(document.body.childElementCount).toBe(0);

        // Nothing should happen (function returns early)
    });

    it("should adapt to dark theme", async () => {
        expect.assertions(3);

        // Set dark theme
        document.body.classList.add("theme-dark");

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalledOnce();

        const mockWin = getPopupWindow();

        expect(mockWin.document.body.className).toBe("theme-dark");
        expect(
            requirePopupElement(
                mockWin.document.querySelector("style"),
                "popup style"
            ).textContent
        ).toContain("text-shadow: 0 0 2px #000");
    });

    it("should handle files without altitude data", async () => {
        expect.assertions(3);

        setLoadedFitFiles(
            [
                {
                    filePath: "no-altitude.fit",
                    data: {
                        recordMesgs: [], // Empty array = no altitude data
                    },
                },
            ],
            "createElevationProfileButton.test"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        const mockWin = getPopupWindow();

        expect(getPopupFileLabels(mockWin)).toStrictEqual(["no-altitude.fit"]);
        expect(getPopupNoDataMessages(mockWin)).toStrictEqual([
            "No altitude data.",
        ]);
        expect(chartMock).not.toHaveBeenCalled();
    });

    it("should use the typed chart overlay color palette", async () => {
        expect.assertions(2);

        setLoadedFitFiles(
            [
                {
                    filePath: "test-with-colors.fit",
                    data: {
                        recordMesgs: [
                            { positionLat: 1, positionLong: 2, altitude: 100 },
                        ],
                    },
                },
            ],
            "createElevationProfileButton.test"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        // Verify model uses the palette
        const mockWin = getPopupWindow();

        expect(getPopupFileLabels(mockWin)).toStrictEqual([
            "test-with-colors.fit",
        ]);
        expect(chartMock.mock.calls[0][1].data.datasets[0].borderColor).toBe(
            chartOverlayColorPalette[0]
        );
    });

    it("should handle a mix of files with and without altitude data", async () => {
        expect.assertions(4);

        setLoadedFitFiles(
            [
                {
                    filePath: "with-altitude.fit",
                    data: {
                        recordMesgs: [
                            { positionLat: 1, positionLong: 2, altitude: 100 },
                            { positionLat: 3, positionLong: 4, altitude: 200 },
                        ],
                    },
                },
                {
                    filePath: "without-altitude.fit",
                    data: {
                        recordMesgs: [], // No altitude data
                    },
                },
                {
                    filePath: "partial-data.fit",
                    data: {
                        recordMesgs: [
                            {
                                positionLat: null,
                                positionLong: null,
                                altitude: 300,
                            }, // Missing position data
                            { positionLat: 5, positionLong: 6 }, // Missing altitude
                        ],
                    },
                },
            ],
            "createElevationProfileButton.test"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        await clickElevationButton(button);

        const mockWin = getPopupWindow();

        expect(getPopupHeaderState(mockWin)).toEqual({
            fileCount: "3 files",
            heading: "Elevation Profiles",
        });
        expect(getPopupFileLabels(mockWin)).toStrictEqual([
            "with-altitude.fit",
            "without-altitude.fit",
            "partial-data.fit",
        ]);
        expect(chartMock).toHaveBeenCalledOnce();
        expect(getContextSpy).toHaveBeenCalledOnce();
    });
});

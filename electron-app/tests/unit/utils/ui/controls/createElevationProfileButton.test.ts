import { JSDOM } from "jsdom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStateManagerMock } from "../../../../helpers/createStateManagerMock";
import * as getThemeColorsModule from "../../../../../utils/charts/theming/getThemeColors.js";
import { createElevationProfileButton } from "../../../../../utils/ui/controls/createElevationProfileButton.js";
import { setGlobalData } from "../../../../../utils/state/domain/globalDataState.js";
import { clearOverlayState, setOverlayFiles } from "../../../../../utils/state/domain/overlayState.js";

const ensureDom = () => {
    const createMemoryStorage = () => {
        const store = new Map<string, string>();
        return {
            clear: () => store.clear(),
            getItem: (key: string) => store.get(String(key)) ?? null,
            key: (index: number) => Array.from(store.keys())[index] ?? null,
            removeItem: (key: string) => {
                store.delete(String(key));
            },
            setItem: (key: string, value: string) => {
                store.set(String(key), String(value));
            },
            get length() {
                return store.size;
            },
        } satisfies Storage;
    };

    const installGlobals = (sourceWindow: Window & typeof globalThis) => {
        const assignIfMissing = (key: string, value: unknown) => {
            const current = (globalThis as Record<string, unknown>)[key];
            if (current !== undefined && current !== null) {
                return;
            }
            try {
                Object.defineProperty(globalThis, key, {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value,
                });
            } catch {
                try {
                    (globalThis as Record<string, unknown>)[key] = value as never;
                } catch {
                    /* ignore */
                }
            }
        };

        assignIfMissing("navigator", sourceWindow.navigator);
        assignIfMissing("HTMLElement", sourceWindow.HTMLElement);
        const storage = sourceWindow.localStorage ?? createMemoryStorage();
        assignIfMissing("localStorage", storage);
        if (!sourceWindow.localStorage) {
            try {
                Object.defineProperty(sourceWindow, "localStorage", {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: storage,
                });
            } catch {
                (sourceWindow as any).localStorage = storage;
            }
        }
        assignIfMissing("MouseEvent", sourceWindow.MouseEvent);
        assignIfMissing("HTMLButtonElement", (sourceWindow as any).HTMLButtonElement);
    };

    if (typeof window === "undefined" || typeof document === "undefined") {
        const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
        try {
            Object.defineProperty(globalThis, "window", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: dom.window,
            });
            Object.defineProperty(globalThis, "document", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: dom.window.document,
            });
        } catch {
            (globalThis as any).window = dom.window;
            (globalThis as any).document = dom.window.document;
        }
        installGlobals(dom.window as unknown as Window & typeof globalThis);
        return;
    }

    installGlobals(window as unknown as Window & typeof globalThis);
};

type StateManagerHarness = ReturnType<typeof createStateManagerMock>;
type MockFn = ReturnType<typeof vi.fn>;

type StateManagerRefs = {
    harness?: StateManagerHarness;
    getStateMock?: MockFn;
    setStateMock?: MockFn;
    updateStateMock?: MockFn;
    subscribeMock?: MockFn;
};

const stateManagerRefs = vi.hoisted((): StateManagerRefs => ({
    harness: undefined,
    getStateMock: undefined,
    setStateMock: undefined,
    updateStateMock: undefined,
    subscribeMock: undefined,
}));

vi.mock("../../../../../utils/state/core/stateManager.js", () => {
    if (!stateManagerRefs.harness) {
        const harness = createStateManagerMock();
        stateManagerRefs.harness = harness;
        stateManagerRefs.getStateMock = vi.fn((path?: string) => harness.getState(path));
        stateManagerRefs.setStateMock = vi.fn((path: string, value: unknown, options?: any) =>
            harness.setState(path, value, options)
        );
        stateManagerRefs.updateStateMock = vi.fn((path: string, patch: Record<string, unknown>, options?: any) =>
            harness.updateState(path, patch, options)
        );
        stateManagerRefs.subscribeMock = vi.fn((path: string, listener: (value: unknown) => void) =>
            harness.subscribe(path, listener as any)
        );
    }

    return {
        getState: stateManagerRefs.getStateMock!,
        setState: stateManagerRefs.setStateMock!,
        updateState: stateManagerRefs.updateStateMock!,
        subscribe: stateManagerRefs.subscribeMock!,
    };
});

const ensureStateManagerRefs = () => {
    const { harness, getStateMock, setStateMock, updateStateMock, subscribeMock } = stateManagerRefs;
    if (!harness || !getStateMock || !setStateMock || !updateStateMock || !subscribeMock) {
        throw new Error("State manager mocks failed to initialize");
    }
    return { harness, getStateMock, setStateMock, updateStateMock, subscribeMock };
};

const { harness: stateManagerHarness, getStateMock, setStateMock, updateStateMock, subscribeMock } =
    ensureStateManagerRefs();

describe("createElevationProfileButton", () => {
    let originalWindow: any;
    let openSpy: any;

    beforeEach(() => {
        ensureDom();
        stateManagerHarness.reset();
        vi.clearAllMocks();
        getStateMock.mockImplementation((path?: string) => stateManagerHarness.getState(path));
        setStateMock.mockImplementation((path: string, value: unknown, options?: any) =>
            stateManagerHarness.setState(path, value, options)
        );
        updateStateMock.mockImplementation((path: string, patch: Record<string, unknown>, options?: any) =>
            stateManagerHarness.updateState(path, patch, options)
        );
        subscribeMock.mockImplementation((path: string, listener: (value: unknown) => void) =>
            stateManagerHarness.subscribe(path, listener as any)
        );

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

        clearOverlayState("createElevationProfile.beforeEach");
        setOverlayFiles([], "createElevationProfile.beforeEach");
        setGlobalData(null, "createElevationProfile.beforeEach");

    // Store original window properties
    originalWindow = typeof window === "undefined" ? {} : { ...window };

        // Mock document.createElement
        document.body.innerHTML = "";
        document.body.classList.remove("theme-dark");

        // Setup window.open spy
        openSpy = vi.spyOn(window, "open").mockImplementation(() => {
            // Create a mock window object with document.write and document.close
            return {
                document: {
                    write: vi.fn(),
                    close: vi.fn(),
                },
            } as any;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Reset window properties
        if (typeof window !== "undefined") {
            Object.keys(window).forEach((key) => {
                if (!Object.prototype.hasOwnProperty.call(originalWindow, key)) {
                    delete (window as any)[key];
                }
            });
        }
    });

    it("should create a button with correct properties", () => {
        // Create the button
        const button = createElevationProfileButton();

        // Check button properties
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.className).toBe("map-action-btn");
        expect(button.title).toBe("Show Elevation Profile");
        const iconElement = button.querySelector("iconify-icon");
        expect(iconElement?.getAttribute("icon")).toBe("flat-color-icons:area-chart");
        expect(button.innerHTML).toContain("<span>Elevation</span>");
    });

    it("should open a window with no files when clicked and no fit files are loaded", () => {
        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called with correct parameters
        expect(openSpy).toHaveBeenCalledWith("", "Elevation Profile", "width=900,height=600");

        // Verify document.write was called (with empty files array in HTML)
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        expect(mockWin.document.write.mock.calls[0][0]).toContain("const fitFiles = []");
        expect(mockWin.document.close).toHaveBeenCalled();
    });

    it("should handle loadedFitFiles when available", () => {
        // Mock loaded overlays with test data
        setOverlayFiles(
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
            "createElevationProfile.loaded"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called with correct data
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("test-file.fit");
        expect(writtenHtml).toContain("altitude");
    });

    it("should handle globalData when no loadedFitFiles available", () => {
        setOverlayFiles([], "createElevationProfile.clearLoaded");
        setGlobalData(
            {
                cachedFilePath: "global-test.fit",
                recordMesgs: [
                    { positionLat: 5, positionLong: 6, altitude: 300 },
                    { positionLat: 7, positionLong: 8, altitude: 400 },
                ],
            },
            "createElevationProfile.globalData"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called with correct data
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("global-test.fit");
    });

    it("should handle globalData without recordMesgs", () => {
        setOverlayFiles([], "createElevationProfile.noRecordsLoaded");
        setGlobalData({ cachedFilePath: "incomplete-data.fit" }, "createElevationProfile.noRecordsGlobal");

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();

        // The current implementation only shows files with recordMesgs array
        // If globalData doesn't have recordMesgs, it won't be included
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        // Since there are no fitFiles in this case, we should have "0 file" in the header
        expect(writtenHtml).toContain('<span style="font-size:1.1em;opacity:0.7;">0 file');
        expect(writtenHtml).toContain("const fitFiles = []");
    });
    it("should handle popup window being blocked", () => {
        // Make window.open return null to simulate blocked popup
        openSpy.mockReturnValueOnce(null);

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Nothing should happen (function returns early)
    });

    it("should adapt to dark theme", () => {
        // Set dark theme
        document.body.classList.add("theme-dark");

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify window.open was called
        expect(openSpy).toHaveBeenCalled();

        // Verify document.write was called with dark theme
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain('class="theme-dark"');
        expect(writtenHtml).toContain("const isDark = true");
    });

    it("should handle files without altitude data", () => {
        // Mock overlays with a file that has no altitude data
        setOverlayFiles(
            [
                {
                    filePath: "no-altitude.fit",
                    data: {
                        recordMesgs: [], // Empty array = no altitude data
                    },
                },
            ],
            "createElevationProfile.noAltitude"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify document.write was called with code for handling no data
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("altitudes");
        expect(writtenHtml).toContain("no-altitude.fit");
    });

    it("should use chartOverlayColorPalette from window.opener when available", () => {
        // Mock overlays with test data
        setOverlayFiles(
            [
                {
                    filePath: "test-with-colors.fit",
                    data: {
                        recordMesgs: [{ positionLat: 1, positionLong: 2, altitude: 100 }],
                    },
                },
            ],
            "createElevationProfile.palette"
        );

        // Setup window.opener with chartOverlayColorPalette
        (window as any).opener = {
            chartOverlayColorPalette: ["#ff0000", "#00ff00", "#0000ff"],
        };

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify document.write was called with color from chartOverlayColorPalette
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("#ff0000"); // First color from the palette
        expect(writtenHtml).toContain("test-with-colors.fit");

        // Clean up the mock
        delete (window as any).opener;
    });

    it("should handle a mix of files with and without altitude data", () => {
        // Mock overlays with mix of files with and without altitude data
        setOverlayFiles(
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
                            { positionLat: null, positionLong: null, altitude: 300 }, // Missing position data
                            { positionLat: 5, positionLong: 6 }, // Missing altitude
                        ],
                    },
                },
            ],
            "createElevationProfile.mixed"
        );

        // Create the button and click it
        const button = createElevationProfileButton();
        button.click();

        // Verify document.write was called with appropriate HTML
        const mockWin = openSpy.mock.results[0].value;
        expect(mockWin.document.write).toHaveBeenCalled();
        const writtenHtml = mockWin.document.write.mock.calls[0][0];
        expect(writtenHtml).toContain("with-altitude.fit");
        expect(writtenHtml).toContain("without-altitude.fit");
        expect(writtenHtml).toContain("partial-data.fit");
        expect(writtenHtml).toContain("3 files");
    });
});

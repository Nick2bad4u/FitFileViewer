import { describe, expect, it, vi } from "vitest";

import { getUIStateManagerRuntime } from "../../../../../electron-app/utils/state/domain/uiStateManagerRuntime.js";

describe("uiStateManagerRuntime", () => {
    it("creates abort controllers through the scoped runtime", () => {
        expect.assertions(2);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }

        const runtime = getUIStateManagerRuntime({
            getAbortController: () =>
                TestAbortController as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(created).toBe(true);
    });

    it("throws when abort controllers are unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getUIStateManagerRuntime({}).createAbortController()
        ).toThrow("UI state manager requires an AbortController runtime");
    });

    it("resolves system theme media queries from the scoped runtime", () => {
        expect.assertions(3);

        const mediaQuery = { matches: true } as MediaQueryList;
        const scopedMatchMedia = vi.fn(() => mediaQuery);

        expect(
            getUIStateManagerRuntime({
                getMatchMedia: () => scopedMatchMedia,
            }).getSystemThemeMediaQuery()
        ).toBe(mediaQuery);
        expect(scopedMatchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
        expect(
            getUIStateManagerRuntime({}).getSystemThemeMediaQuery()
        ).toBeNull();
    });

    it("routes document title reads and writes through scoped providers", () => {
        expect.assertions(5);

        const getDocumentTitle = vi.fn(() => "Ride Analysis");
        const setDocumentTitle = vi.fn<(title: string) => void>();
        const runtime = getUIStateManagerRuntime({
            getDocumentTitle,
            getSetDocumentTitle: () => setDocumentTitle,
        });

        expect(runtime.getDefaultDocumentTitle("Fit File Viewer")).toBe(
            "Ride Analysis"
        );
        runtime.setDocumentTitle("Race Recap");
        expect(setDocumentTitle).toHaveBeenCalledExactlyOnceWith("Race Recap");
        expect(getDocumentTitle).toHaveBeenCalledOnce();
        expect(
            getUIStateManagerRuntime({
                getDocumentTitle: () => "",
            }).getDefaultDocumentTitle("Fit File Viewer")
        ).toBe("Fit File Viewer");
        expect(() =>
            getUIStateManagerRuntime({}).setDocumentTitle("Ignored")
        ).not.toThrow();
    });

    it("routes body cursor updates through scoped providers", () => {
        expect.assertions(3);

        const setBodyCursor = vi.fn<(cursor: string) => void>();
        const runtime = getUIStateManagerRuntime({
            getSetBodyCursor: () => setBodyCursor,
        });

        runtime.setBodyCursor("wait");

        expect(setBodyCursor).toHaveBeenCalledExactlyOnceWith("wait");
        expect(() =>
            getUIStateManagerRuntime({}).setBodyCursor("default")
        ).not.toThrow();
        expect(setBodyCursor).not.toHaveBeenCalledWith("default");
    });

    it("routes active file body state through scoped providers", () => {
        expect.assertions(4);

        const toggle = vi.fn();
        const dataset: Record<string, string> = {};
        const runtime = getUIStateManagerRuntime({
            getFileStateBody: () => ({
                classList: { toggle },
                dataset,
            }),
        });

        runtime.setAppHasFileState(true);

        expect(toggle).toHaveBeenCalledExactlyOnceWith("app-has-file", true);
        expect(dataset).toStrictEqual({ hasFitFile: "true" });
        expect(() =>
            getUIStateManagerRuntime({}).setAppHasFileState(false)
        ).not.toThrow();
        expect(toggle).not.toHaveBeenCalledWith("app-has-file", false);
    });

    it("keeps active file body class updates working without DOMTokenList support", () => {
        expect.assertions(4);

        const body = {
            className: "existing app-has-file",
            dataset: {} as Record<string, string>,
        };
        const runtime = getUIStateManagerRuntime({
            getFileStateBody: () => body,
        });

        runtime.setAppHasFileState(false);

        expect(body.className).toBe("existing");
        expect(body.dataset).toStrictEqual({ hasFitFile: "false" });

        runtime.setAppHasFileState(true);

        expect(body.className).toBe("existing app-has-file");
        expect(body.dataset).toStrictEqual({ hasFitFile: "true" });
    });

    it("routes chart, loading, sidebar, and measurement element lookups through scoped providers", () => {
        expect.assertions(45);

        const activeFileName = document.createElement("span");
        const activeFileNameContainer = document.createElement("div");
        const altFitIframe = document.createElement("iframe");
        const chartControlsToggle = document.createElement("button");
        const chartSettingsWrapper = document.createElement("section");
        const createdSpan = document.createElement("span");
        const dropOverlay = document.createElement("div");
        const fileLoadingProgress = document.createElement("progress");
        const loadingIndicator = document.createElement("div");
        const mainContent = document.createElement("main");
        const mapContainer = document.createElement("section");
        const measurementToggle = document.createElement("button");
        const sidebar = document.createElement("aside");
        const unloadButton = document.createElement("button");
        const zwiftIframe = document.createElement("iframe");
        const createSpanElement = vi.fn(() => createdSpan);
        const getActiveFileNameContainerElement = vi.fn(
            () => activeFileNameContainer
        );
        const getActiveFileNameElement = vi.fn(() => activeFileName);
        const getAltFitIframeElement = vi.fn(() => altFitIframe);
        const getChartControlsToggleElement = vi.fn(() => chartControlsToggle);
        const getChartSettingsWrapperElement = vi.fn(
            () => chartSettingsWrapper
        );
        const getDropOverlayElement = vi.fn(() => dropOverlay);
        const getFileLoadingProgressElement = vi.fn(() => fileLoadingProgress);
        const getLoadingIndicatorElement = vi.fn(() => loadingIndicator);
        const getMainContentElement = vi.fn(() => mainContent);
        const getMapContainerElement = vi.fn(() => mapContainer);
        const getMeasurementModeToggleElement = vi.fn(() => measurementToggle);
        const getSidebarElement = vi.fn(() => sidebar);
        const getUnloadFileButtonElement = vi.fn(() => unloadButton);
        const getZwiftIframeElement = vi.fn(() => zwiftIframe);
        const runtime = getUIStateManagerRuntime({
            createSpanElement,
            getActiveFileNameContainerElement,
            getActiveFileNameElement,
            getAltFitIframeElement,
            getChartControlsToggleElement,
            getChartSettingsWrapperElement,
            getDropOverlayElement,
            getFileLoadingProgressElement,
            getLoadingIndicatorElement,
            getMainContentElement,
            getMapContainerElement,
            getMeasurementModeToggleElement,
            getSidebarElement,
            getUnloadFileButtonElement,
            getZwiftIframeElement,
        });

        expect(runtime.createSpanElement()).toBe(createdSpan);
        expect(runtime.getActiveFileNameContainerElement()).toBe(
            activeFileNameContainer
        );
        expect(runtime.getActiveFileNameElement()).toBe(activeFileName);
        expect(runtime.getAltFitIframeElement()).toBe(altFitIframe);
        expect(runtime.getFileLoadingProgressElement()).toBe(
            fileLoadingProgress
        );
        expect(runtime.getChartControlsToggleElement()).toBe(
            chartControlsToggle
        );
        expect(runtime.getChartSettingsWrapperElement()).toBe(
            chartSettingsWrapper
        );
        expect(runtime.getDropOverlayElement()).toBe(dropOverlay);
        expect(runtime.getLoadingIndicatorElement()).toBe(loadingIndicator);
        expect(runtime.getMainContentElement()).toBe(mainContent);
        expect(runtime.getMapContainerElement()).toBe(mapContainer);
        expect(runtime.getMeasurementModeToggleElement()).toBe(
            measurementToggle
        );
        expect(runtime.getSidebarElement()).toBe(sidebar);
        expect(runtime.getUnloadFileButtonElement()).toBe(unloadButton);
        expect(runtime.getZwiftIframeElement()).toBe(zwiftIframe);
        expect(createSpanElement).toHaveBeenCalledOnce();
        expect(getActiveFileNameContainerElement).toHaveBeenCalledOnce();
        expect(getActiveFileNameElement).toHaveBeenCalledOnce();
        expect(getAltFitIframeElement).toHaveBeenCalledOnce();
        expect(getChartControlsToggleElement).toHaveBeenCalledOnce();
        expect(getChartSettingsWrapperElement).toHaveBeenCalledOnce();
        expect(getDropOverlayElement).toHaveBeenCalledOnce();
        expect(getFileLoadingProgressElement).toHaveBeenCalledOnce();
        expect(getLoadingIndicatorElement).toHaveBeenCalledOnce();
        expect(getMainContentElement).toHaveBeenCalledOnce();
        expect(getMapContainerElement).toHaveBeenCalledOnce();
        expect(getMeasurementModeToggleElement).toHaveBeenCalledOnce();
        expect(getSidebarElement).toHaveBeenCalledOnce();
        expect(getUnloadFileButtonElement).toHaveBeenCalledOnce();
        expect(getZwiftIframeElement).toHaveBeenCalledOnce();
        expect(
            getUIStateManagerRuntime({}).getActiveFileNameContainerElement()
        ).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getActiveFileNameElement()
        ).toBeNull();
        expect(() => getUIStateManagerRuntime({}).createSpanElement()).toThrow(
            "UI state manager requires a span element factory runtime"
        );
        expect(
            getUIStateManagerRuntime({}).getAltFitIframeElement()
        ).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getChartControlsToggleElement()
        ).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getChartSettingsWrapperElement()
        ).toBeNull();
        expect(getUIStateManagerRuntime({}).getDropOverlayElement()).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getFileLoadingProgressElement()
        ).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getLoadingIndicatorElement()
        ).toBeNull();
        expect(getUIStateManagerRuntime({}).getMainContentElement()).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getMapContainerElement()
        ).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getMeasurementModeToggleElement()
        ).toBeNull();
        expect(getUIStateManagerRuntime({}).getSidebarElement()).toBeNull();
        expect(
            getUIStateManagerRuntime({}).getUnloadFileButtonElement()
        ).toBeNull();
        expect(getUIStateManagerRuntime({}).getZwiftIframeElement()).toBeNull();
    });

    it("ignores direct scoped matchMedia when no provider is scoped", () => {
        expect.assertions(2);

        const mediaQuery = { matches: false } as MediaQueryList;
        const directMatchMedia = vi.fn(() => mediaQuery);

        expect(
            getUIStateManagerRuntime({
                matchMedia: directMatchMedia,
            } as unknown as Parameters<
                typeof getUIStateManagerRuntime
            >[0]).getSystemThemeMediaQuery()
        ).toBeNull();
        expect(directMatchMedia).not.toHaveBeenCalled();
    });

    it("routes window listeners through the scoped event target provider", () => {
        expect.assertions(4);

        const addEventListener = vi.fn();
        const directAddEventListener = vi.fn();
        const runtime = getUIStateManagerRuntime({
            getEventTarget: () => ({ addEventListener }),
            eventTarget: {
                addEventListener: directAddEventListener,
            },
        } as unknown as Parameters<typeof getUIStateManagerRuntime>[0]);
        const listener = vi.fn();
        const options = { once: true };

        expect(runtime.hasWindow()).toBe(true);
        runtime.addWindowEventListener("resize", listener, options);

        expect(addEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(directAddEventListener).not.toHaveBeenCalled();
        expect(getUIStateManagerRuntime({}).hasWindow()).toBe(false);
    });

    it("reads window state from the scoped viewport provider", () => {
        expect.assertions(2);

        const runtime = getUIStateManagerRuntime({
            getViewportState: () => ({
                innerHeight: 800,
                innerWidth: 1200,
                outerHeight: 850,
                outerWidth: 1250,
                screen: {
                    availHeight: 1080,
                    availWidth: 1920,
                },
                screenX: 100,
                screenY: 200,
            }),
        });

        expect(runtime.getWindowState()).toStrictEqual({
            height: 800,
            maximized: false,
            width: 1200,
            x: 100,
            y: 200,
        });
        expect(
            getUIStateManagerRuntime({
                getViewportState: () => ({
                    innerHeight: 800,
                    innerWidth: 1200,
                    outerHeight: 1080,
                    outerWidth: 1920,
                    screen: {
                        availHeight: 1080,
                        availWidth: 1920,
                    },
                    screenX: 100,
                    screenY: 200,
                }),
            }).getWindowState()
        ).toMatchObject({ maximized: true });
    });

    it("returns null when scoped window state is unavailable", () => {
        expect.assertions(2);

        expect(getUIStateManagerRuntime({}).getWindowState()).toBeNull();
        expect(
            getUIStateManagerRuntime({
                getViewportState: () => ({
                    innerHeight: 800,
                    innerWidth: 1200,
                }),
            }).getWindowState()
        ).toBeNull();
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(45);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }
        const addEventListener = vi.fn();
        const activeFileNameContainerElement = document.createElement("div");
        const activeFileNameElement = document.createElement("span");
        const altFitIframeElement = document.createElement("iframe");
        const chartControlsToggleElement = document.createElement("button");
        const chartSettingsWrapperElement = document.createElement("section");
        const dropOverlayElement = document.createElement("div");
        const fileStateToggle = vi.fn();
        const fileLoadingProgressElement = document.createElement("progress");
        const loadingIndicatorElement = document.createElement("div");
        const mainContentElement = document.createElement("main");
        const mapContainerElement = document.createElement("section");
        const measurementModeToggleElement = document.createElement("button");
        const sidebarElement = document.createElement("aside");
        const unloadFileButtonElement = document.createElement("button");
        const zwiftIframeElement = document.createElement("iframe");
        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
        const setBodyCursor = vi.fn();
        const setDocumentTitle = vi.fn();
        const runtime = getUIStateManagerRuntime({
            AbortController:
                TestAbortController as unknown as typeof AbortController,
            activeFileNameContainerElement,
            activeFileNameElement,
            altFitIframeElement,
            documentTitle: "Legacy title",
            eventTarget: { addEventListener },
            chartControlsToggleElement,
            chartSettingsWrapperElement,
            dropOverlayElement,
            fileLoadingProgressElement,
            fileStateBody: {
                classList: { toggle: fileStateToggle },
                dataset: {},
            },
            loadingIndicatorElement,
            mainContentElement,
            mapContainerElement,
            measurementModeToggleElement,
            sidebarElement,
            unloadFileButtonElement,
            zwiftIframeElement,
            matchMedia,
            setBodyCursor,
            setDocumentTitle,
            viewportState: {
                innerHeight: 800,
                innerWidth: 1200,
                outerHeight: 1080,
                outerWidth: 1920,
                screen: {
                    availHeight: 1080,
                    availWidth: 1920,
                },
                screenX: 100,
                screenY: 200,
            },
        } as unknown as Parameters<typeof getUIStateManagerRuntime>[0]);
        const listener = vi.fn();

        expect(() => runtime.createAbortController()).toThrow(
            "UI state manager requires an AbortController runtime"
        );
        expect(runtime.getSystemThemeMediaQuery()).toBeNull();
        expect(runtime.getDefaultDocumentTitle("Fit File Viewer")).toBe(
            "Fit File Viewer"
        );
        expect(runtime.getActiveFileNameContainerElement()).toBeNull();
        expect(runtime.getActiveFileNameElement()).toBeNull();
        expect(runtime.getAltFitIframeElement()).toBeNull();
        expect(runtime.getChartControlsToggleElement()).toBeNull();
        expect(runtime.getChartSettingsWrapperElement()).toBeNull();
        expect(runtime.getDropOverlayElement()).toBeNull();
        expect(runtime.getFileLoadingProgressElement()).toBeNull();
        expect(runtime.getLoadingIndicatorElement()).toBeNull();
        expect(runtime.getMainContentElement()).toBeNull();
        expect(runtime.getMapContainerElement()).toBeNull();
        expect(runtime.getMeasurementModeToggleElement()).toBeNull();
        expect(runtime.getSidebarElement()).toBeNull();
        expect(runtime.getUnloadFileButtonElement()).toBeNull();
        expect(runtime.getZwiftIframeElement()).toBeNull();
        expect(runtime.getWindowState()).toBeNull();
        expect(runtime.hasWindow()).toBe(false);
        expect(() => runtime.setAppHasFileState(true)).not.toThrow();
        runtime.addWindowEventListener("resize", listener);
        expect(() => runtime.setBodyCursor("wait")).not.toThrow();
        expect(() => runtime.setDocumentTitle("Ignored")).not.toThrow();
        expect(created).toBe(false);
        expect(fileStateToggle).not.toHaveBeenCalled();
        expect(runtime.getActiveFileNameContainerElement()).not.toBe(
            activeFileNameContainerElement
        );
        expect(runtime.getActiveFileNameElement()).not.toBe(
            activeFileNameElement
        );
        expect(runtime.getAltFitIframeElement()).not.toBe(altFitIframeElement);
        expect(runtime.getChartControlsToggleElement()).not.toBe(
            chartControlsToggleElement
        );
        expect(runtime.getChartSettingsWrapperElement()).not.toBe(
            chartSettingsWrapperElement
        );
        expect(runtime.getDropOverlayElement()).not.toBe(dropOverlayElement);
        expect(runtime.getFileLoadingProgressElement()).not.toBe(
            fileLoadingProgressElement
        );
        expect(runtime.getLoadingIndicatorElement()).not.toBe(
            loadingIndicatorElement
        );
        expect(runtime.getMainContentElement()).not.toBe(mainContentElement);
        expect(runtime.getMapContainerElement()).not.toBe(mapContainerElement);
        expect(runtime.getMeasurementModeToggleElement()).not.toBe(
            measurementModeToggleElement
        );
        expect(runtime.getSidebarElement()).not.toBe(sidebarElement);
        expect(runtime.getUnloadFileButtonElement()).not.toBe(
            unloadFileButtonElement
        );
        expect(runtime.getZwiftIframeElement()).not.toBe(zwiftIframeElement);
        expect(matchMedia).not.toHaveBeenCalled();
        expect(setBodyCursor).not.toHaveBeenCalled();
        expect(setDocumentTitle).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
        expect(getUIStateManagerRuntime({}).hasWindow()).toBe(false);
        expect(getUIStateManagerRuntime({}).getWindowState()).toBeNull();
    });
});

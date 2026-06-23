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

    it("routes loading, sidebar, and measurement element lookups through scoped providers", () => {
        expect.assertions(18);

        const fileLoadingProgress = document.createElement("progress");
        const loadingIndicator = document.createElement("div");
        const mainContent = document.createElement("main");
        const mapContainer = document.createElement("section");
        const measurementToggle = document.createElement("button");
        const sidebar = document.createElement("aside");
        const getFileLoadingProgressElement = vi.fn(() => fileLoadingProgress);
        const getLoadingIndicatorElement = vi.fn(() => loadingIndicator);
        const getMainContentElement = vi.fn(() => mainContent);
        const getMapContainerElement = vi.fn(() => mapContainer);
        const getMeasurementModeToggleElement = vi.fn(() => measurementToggle);
        const getSidebarElement = vi.fn(() => sidebar);
        const runtime = getUIStateManagerRuntime({
            getFileLoadingProgressElement,
            getLoadingIndicatorElement,
            getMainContentElement,
            getMapContainerElement,
            getMeasurementModeToggleElement,
            getSidebarElement,
        });

        expect(runtime.getFileLoadingProgressElement()).toBe(
            fileLoadingProgress
        );
        expect(runtime.getLoadingIndicatorElement()).toBe(loadingIndicator);
        expect(runtime.getMainContentElement()).toBe(mainContent);
        expect(runtime.getMapContainerElement()).toBe(mapContainer);
        expect(runtime.getMeasurementModeToggleElement()).toBe(
            measurementToggle
        );
        expect(runtime.getSidebarElement()).toBe(sidebar);
        expect(getFileLoadingProgressElement).toHaveBeenCalledOnce();
        expect(getLoadingIndicatorElement).toHaveBeenCalledOnce();
        expect(getMainContentElement).toHaveBeenCalledOnce();
        expect(getMapContainerElement).toHaveBeenCalledOnce();
        expect(getMeasurementModeToggleElement).toHaveBeenCalledOnce();
        expect(getSidebarElement).toHaveBeenCalledOnce();
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
        expect.assertions(29);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }
        const addEventListener = vi.fn();
        const fileStateToggle = vi.fn();
        const fileLoadingProgressElement = document.createElement("progress");
        const loadingIndicatorElement = document.createElement("div");
        const mainContentElement = document.createElement("main");
        const mapContainerElement = document.createElement("section");
        const measurementModeToggleElement = document.createElement("button");
        const sidebarElement = document.createElement("aside");
        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
        const setBodyCursor = vi.fn();
        const setDocumentTitle = vi.fn();
        const runtime = getUIStateManagerRuntime({
            AbortController:
                TestAbortController as unknown as typeof AbortController,
            documentTitle: "Legacy title",
            eventTarget: { addEventListener },
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
        expect(runtime.getFileLoadingProgressElement()).toBeNull();
        expect(runtime.getLoadingIndicatorElement()).toBeNull();
        expect(runtime.getMainContentElement()).toBeNull();
        expect(runtime.getMapContainerElement()).toBeNull();
        expect(runtime.getMeasurementModeToggleElement()).toBeNull();
        expect(runtime.getSidebarElement()).toBeNull();
        expect(runtime.getWindowState()).toBeNull();
        expect(runtime.hasWindow()).toBe(false);
        expect(() => runtime.setAppHasFileState(true)).not.toThrow();
        runtime.addWindowEventListener("resize", listener);
        expect(() => runtime.setBodyCursor("wait")).not.toThrow();
        expect(() => runtime.setDocumentTitle("Ignored")).not.toThrow();
        expect(created).toBe(false);
        expect(fileStateToggle).not.toHaveBeenCalled();
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
        expect(matchMedia).not.toHaveBeenCalled();
        expect(setBodyCursor).not.toHaveBeenCalled();
        expect(setDocumentTitle).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
        expect(getUIStateManagerRuntime({}).hasWindow()).toBe(false);
        expect(getUIStateManagerRuntime({}).getWindowState()).toBeNull();
    });
});

import { describe, expect, it, vi } from "vitest";

import { getThemeRuntime } from "../../../../../electron-app/utils/theming/core/themeRuntime.js";

describe("getThemeRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getThemeRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production browser defaults", () => {
        expect.assertions(8);

        const mediaQuery = { matches: true } as MediaQueryList;
        const matchMedia = vi.fn(function defaultMatchMedia(
            this: typeof globalThis,
            query: string
        ) {
            void query;
            return mediaQuery;
        });
        vi.stubGlobal("matchMedia", matchMedia);
        const runtime = getThemeRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
        expect(
            runtime.createThemeChangeEvent({ theme: "dark" })
        ).toBeInstanceOf(CustomEvent);
        runtime.addBodyClass("theme-dark");
        expect(document.body.classList.contains("theme-dark")).toBe(true);
        expect(runtime.getDocumentEventTarget()).toBe(document);
        expect(runtime.getBodyElement()).toBe(document.body);
        expect(runtime.getBodyComputedStyleProperty("color-bg")).toBe("");
        expect(runtime.getSystemThemeMediaQuery()).toBe(mediaQuery);
        expect(matchMedia.mock.contexts[0]).toBe(globalThis);
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getThemeRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "theme core requires an AbortController runtime"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 89 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getThemeRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(24);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 91 as ReturnType<typeof globalThis.setTimeout>;
        const mediaQuery = { matches: true } as MediaQueryList;
        const documentRef =
            document.implementation.createHTMLDocument("theme runtime");
        const globalEventTarget = {
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as EventTarget;
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const matchMedia = vi.fn(() => mediaQuery);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as typeof AbortController
        );
        const getClearTimeout = vi.fn(() => clearTimeout);
        class TestCustomEvent<T = unknown> extends CustomEvent<T> {
            public constructor(type: string, init?: CustomEventInit<T>) {
                super(`test:${type}`, init);
            }
        }
        const getCustomEvent = vi.fn(() => TestCustomEvent);
        const getDocument = vi.fn(() => documentRef);
        const getGlobalEventTarget = vi.fn(() => globalEventTarget);
        const getMatchMedia = vi.fn(() => matchMedia);
        const getSetTimeout = vi.fn(() => setTimeout);
        const runtime = getThemeRuntime({
            getAbortController,
            getClearTimeout,
            getCustomEvent,
            getDocument,
            getGlobalEventTarget,
            getMatchMedia,
            getSetTimeout,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);
        expect(runtime.getSystemThemeMediaQuery()).toBe(mediaQuery);
        expect(runtime.getGlobalEventTarget()).toBe(globalEventTarget);
        runtime.addBodyClass("theme-transitioning");
        runtime.addBodyClass("theme-dark");
        runtime.setThemeDataAttributes("dark");
        runtime.removeBodyClasses("theme-transitioning", "theme-light");
        runtime.ensureThemeTransitionStyles(".theme-transitioning{}");
        runtime.updateMetaThemeColor("#181a20");
        const event = runtime.createThemeChangeEvent({ theme: "dark" });

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getCustomEvent).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledTimes(6);
        expect(getMatchMedia).toHaveBeenCalledOnce();
        expect(getGlobalEventTarget).toHaveBeenCalledOnce();
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(event).toBeInstanceOf(TestCustomEvent);
        expect(event.type).toBe("test:themechange");
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
        expect(documentRef.body.classList.contains("theme-transitioning")).toBe(
            false
        );
        expect(documentRef.body.classList.contains("theme-dark")).toBe(true);
        expect(documentRef.body.dataset["theme"]).toBe("dark");
        expect(documentRef.documentElement.dataset["theme"]).toBe("dark");
        expect(
            documentRef.querySelector("#theme-transition-styles")
        ).toBeInstanceOf(HTMLStyleElement);
        expect(
            documentRef.querySelector('meta[name="theme-color"]')
        ).toHaveProperty("content", "#181a20");
        expect(callback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers or storage for explicit scopes", () => {
        expect.assertions(4);

        const utils = getThemeRuntime({});

        expect(() => utils.setTimeout(() => {}, 0)).toThrow(
            "theme core requires a setTimeout runtime"
        );
        expect(() => {
            utils.clearTimeout(89 as ReturnType<typeof globalThis.setTimeout>);
        }).toThrow("theme core requires a clearTimeout runtime");
        expect(() => utils.createThemeChangeEvent({})).toThrow(
            "theme core requires a CustomEvent runtime"
        );
        expect(() => utils.getStorageItem("ffv-theme")).toThrow(
            "theme core requires a localStorage runtime"
        );
    });

    it("routes storage through the injected runtime scope", () => {
        expect.assertions(5);

        const storage = {
            getItem: vi.fn(() => "dark"),
            removeItem: vi.fn(),
            setItem: vi.fn(),
        };
        const getLocalStorage = vi.fn(() => storage);
        const runtime = getThemeRuntime({
            getLocalStorage,
        });

        expect(runtime.getStorageItem("ffv-theme")).toBe("dark");
        runtime.setStorageItem("ffv-theme", "light");
        runtime.removeStorageItem("fitFileViewer_theme");

        expect(getLocalStorage).toHaveBeenCalledTimes(3);
        expect(storage.getItem).toHaveBeenCalledWith("ffv-theme");
        expect(storage.setItem).toHaveBeenCalledWith("ffv-theme", "light");
        expect(storage.removeItem).toHaveBeenCalledWith("fitFileViewer_theme");
    });

    it("creates theme-change events through the injected CustomEvent runtime", () => {
        expect.assertions(6);

        const detail = { effectiveTheme: "dark", theme: "system" };
        class TestCustomEvent<T = unknown> extends CustomEvent<T> {
            public constructor(type: string, init?: CustomEventInit<T>) {
                super(`test:${type}`, init);
            }
        }
        const runtime = getThemeRuntime({
            getCustomEvent: () => TestCustomEvent,
        });
        const event = runtime.createThemeChangeEvent(detail);

        expect(event).toBeInstanceOf(TestCustomEvent);
        expect(event.type).toBe("test:themechange");
        expect(event.detail).toBe(detail);
        expect(event.bubbles).toBe(true);
        expect(event.composed).toBe(true);
        expect(event.cancelable).toBe(false);
    });

    it("resolves system theme media queries from the scoped runtime", () => {
        expect.assertions(3);

        const mediaQuery = { matches: true } as MediaQueryList;
        const scopedMatchMedia = vi.fn(() => mediaQuery);

        expect(
            getThemeRuntime({
                getMatchMedia: () => scopedMatchMedia,
            }).getSystemThemeMediaQuery()
        ).toBe(mediaQuery);
        expect(scopedMatchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
        expect(getThemeRuntime({}).getSystemThemeMediaQuery()).toBeNull();
    });

    it("updates theme DOM elements through the injected document runtime", () => {
        expect.assertions(8);

        const documentRef =
            document.implementation.createHTMLDocument("theme dom");
        const runtime = getThemeRuntime({
            getDocument: () => documentRef,
        });

        runtime.ensureThemeTransitionStyles(".theme-transitioning{color:red}");
        runtime.ensureThemeTransitionStyles(".theme-transitioning{color:blue}");
        runtime.updateMetaThemeColor("#181a20");
        runtime.updateMetaThemeColor("#f8fafc");

        const styleElements = documentRef.querySelectorAll(
            "#theme-transition-styles"
        );
        const styleElement = styleElements[0];
        const metaElements = documentRef.querySelectorAll(
            'meta[name="theme-color"]'
        );
        const metaElement = metaElements[0];

        expect(styleElements).toHaveLength(1);
        expect(styleElement).toBeInstanceOf(HTMLStyleElement);
        expect(styleElement?.textContent).toContain("color:red");
        expect(styleElement?.textContent).not.toContain("color:blue");
        expect(metaElements).toHaveLength(1);
        expect(metaElement).toBeInstanceOf(HTMLMetaElement);
        expect(metaElement?.content).toBe("#f8fafc");
        expect(documentRef.head.contains(metaElement ?? null)).toBe(true);
    });

    it("reads body targets and computed styles through injected runtimes", () => {
        expect.assertions(8);

        const documentRef =
            document.implementation.createHTMLDocument("theme body");
        documentRef.body.style.setProperty("--color-bg", "#123456");
        const getComputedStyle = vi.fn<typeof globalThis.getComputedStyle>(
            (element) => window.getComputedStyle(element)
        );
        const runtime = getThemeRuntime({
            getComputedStyle: () => getComputedStyle,
            getDocument: () => documentRef,
        });

        expect(runtime.getDocumentEventTarget()).toBe(documentRef);
        expect(runtime.getBodyElement()).toBe(documentRef.body);
        expect(runtime.getBodyComputedStyleProperty("color-bg")).toBe(
            "#123456"
        );
        expect(getComputedStyle).toHaveBeenCalledWith(documentRef.body);

        const missingRuntime = getThemeRuntime({
            getDocument: () => ({ body: null }) as unknown as Document,
        });

        expect(missingRuntime.getDocumentEventTarget()).toEqual({
            body: null,
        });
        expect(missingRuntime.getBodyElement()).toBeNull();
        expect(missingRuntime.getBodyComputedStyleProperty("color-bg")).toBe(
            ""
        );
        expect(getThemeRuntime({}).getDocumentEventTarget()).toBeNull();
    });

    it("does not borrow ambient documents for explicit DOM scopes", () => {
        expect.assertions(5);

        const runtime = getThemeRuntime({});

        expect(() => runtime.addBodyClass("theme-dark")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.removeBodyClasses("theme-dark")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.setThemeDataAttributes("dark")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.ensureThemeTransitionStyles("")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.updateMetaThemeColor("#181a20")).toThrow(
            "theme core requires a document runtime"
        );
    });

    it("binds default system theme media queries to globalThis", () => {
        expect.assertions(3);

        const mediaQuery = { matches: true } as MediaQueryList;
        const matchMedia = vi.fn(function defaultMatchMedia(
            this: typeof globalThis,
            query: string
        ) {
            void query;
            return mediaQuery;
        });

        vi.stubGlobal("matchMedia", matchMedia);
        try {
            expect(getThemeRuntime().getSystemThemeMediaQuery()).toBe(
                mediaQuery
            );
            expect(matchMedia).toHaveBeenCalledWith(
                "(prefers-color-scheme: dark)"
            );
            expect(matchMedia.mock.contexts[0]).toBe(globalThis);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it("exposes the scoped theme global event target", () => {
        expect.assertions(1);

        const globalEventTarget = {
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as EventTarget;
        const runtime = getThemeRuntime({
            getGlobalEventTarget: () => globalEventTarget,
        });

        expect(runtime.getGlobalEventTarget()).toBe(globalEventTarget);
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(17);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const callback = vi.fn<() => void>();
        const timer = 89 as ReturnType<typeof globalThis.setTimeout>;
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const CustomEventConstructor = vi.fn(function FakeCustomEvent() {
            return new CustomEvent("legacy");
        });
        const mediaQuery = { matches: true } as MediaQueryList;
        const matchMedia = vi.fn(() => mediaQuery);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const globalEventTarget = {
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as EventTarget;
        const runtime = getThemeRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            CustomEvent:
                CustomEventConstructor as unknown as typeof CustomEvent,
            clearTimeout,
            document,
            globalEventTarget,
            matchMedia,
            setTimeout,
        } as unknown as Parameters<typeof getThemeRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "theme core requires an AbortController runtime"
        );
        expect(() => runtime.setTimeout(callback, 300)).toThrow(
            "theme core requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "theme core requires a clearTimeout runtime"
        );
        expect(() => runtime.createThemeChangeEvent({})).toThrow(
            "theme core requires a CustomEvent runtime"
        );
        expect(() => runtime.addBodyClass("theme-dark")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.removeBodyClasses("theme-dark")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.setThemeDataAttributes("dark")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.ensureThemeTransitionStyles("")).toThrow(
            "theme core requires a document runtime"
        );
        expect(() => runtime.updateMetaThemeColor("#181a20")).toThrow(
            "theme core requires a document runtime"
        );
        expect(runtime.getSystemThemeMediaQuery()).toBeNull();
        expect(runtime.getGlobalEventTarget()).toBeNull();
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(CustomEventConstructor).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(matchMedia).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });
});

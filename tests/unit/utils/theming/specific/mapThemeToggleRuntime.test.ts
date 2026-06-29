import { describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getMapThemeToggleRuntime,
    type MapThemeToggleRuntimeScope,
} from "../../../../../electron-app/utils/theming/specific/mapThemeToggleRuntime.js";

function createMapThemeToggleRuntimeScope(
    overrides: Partial<MapThemeToggleRuntimeScope> = {}
): MapThemeToggleRuntimeScope {
    return {
        getAbortController: () => undefined,
        getClearTimeout: () => undefined,
        getCustomEvent: () => undefined,
        getDocument: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getMapThemeToggleRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-theme-toggle-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope({
                getAbortController: () => TestAbortController,
            })
        );

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getMapThemeToggleRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope()
        );

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapThemeToggle requires an AbortController runtime");
    });

    it("registers document listeners through the injected document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        let changed = false;
        const listener = (): void => {
            changed = true;
        };
        const controller = new AbortController();
        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        runtime.addDocumentListener("mapThemeChanged", listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new Event("mapThemeChanged"));
        controller.abort();

        expect(changed).toBe(true);
    });

    it("uses browser runtime providers for production document defaults", () => {
        expect.assertions(3);

        const button = document.createElement("button");
        button.className = "map-theme-toggle";
        document.body.append(button);
        const runtime = getMapThemeToggleRuntime();

        try {
            expect(runtime.findExistingToggle()).toBe(button);
            expect(runtime.createElement("button")).toBeInstanceOf(
                HTMLButtonElement
            );
            expect(runtime.isBodyThemeDark()).toBe(false);
        } finally {
            button.remove();
        }
    });

    it("finds existing map theme toggles through the injected document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        const button = documentRef.createElement("button");
        button.className = "map-theme-toggle";
        documentRef.body.append(button);
        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        expect(runtime.findExistingToggle()).toBe(button);
    });

    it("reads body theme state through the injected document runtime", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        expect(runtime.isBodyThemeDark()).toBe(false);
        documentRef.body.classList.add("theme-dark");
        expect(runtime.isBodyThemeDark()).toBe(true);
    });

    it("creates HTML and SVG elements through the injected document runtime", () => {
        expect.assertions(6);

        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        const createElement = vi.spyOn(documentRef, "createElement");
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        const button = runtime.createElement("button");
        const svg = runtime.createSvgElement("svg");
        const path = runtime.createSvgElement("path");

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(svg).toBeInstanceOf(SVGSVGElement);
        expect(path.nodeName).toBe("path");
        expect(path.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(createElement).toHaveBeenCalledWith("button");
        expect(createElementNS).toHaveBeenCalledWith(
            "http://www.w3.org/2000/svg",
            "path"
        );
    });

    it("creates and dispatches map theme change events through scoped runtimes", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope({
                getCustomEvent: () => CustomEvent,
                getDocument: () => documentRef,
            })
        );
        const listener = vi.fn<(event: Event) => void>();
        const controller = new AbortController();

        documentRef.addEventListener("mapThemeChanged", listener, {
            signal: controller.signal,
        });

        const event = runtime.createMapThemeChangedEvent(
            "mapThemeChanged",
            false
        );

        expect(event).toBeInstanceOf(CustomEvent);
        expect(event).toMatchObject({
            bubbles: true,
            detail: { inverted: false },
            type: "mapThemeChanged",
        });
        expect(runtime.dispatchDocumentEvent(event)).toBe(true);
        expect(listener).toHaveBeenCalledWith(event);
        controller.abort();
    });

    it("uses browser runtime providers for production CustomEvent defaults", () => {
        expect.assertions(2);

        const runtime = getMapThemeToggleRuntime();
        const event = runtime.createMapThemeChangedEvent(
            "mapThemeChanged",
            true
        );

        expect(event).toBeInstanceOf(CustomEvent);
        expect(event.detail).toStrictEqual({ inverted: true });
    });

    it("fails clearly when event runtimes are unavailable", () => {
        expect.assertions(2);

        expect(() =>
            getMapThemeToggleRuntime({
                ...createMapThemeToggleRuntimeScope(),
                getDocument: () => document,
            }).createMapThemeChangedEvent("mapThemeChanged", true)
        ).toThrow("mapThemeToggle requires a CustomEvent runtime");
        expect(() =>
            getMapThemeToggleRuntime({
                ...createMapThemeToggleRuntimeScope(),
                getCustomEvent: () => CustomEvent,
            }).dispatchDocumentEvent(new Event("mapThemeChanged"))
        ).toThrow("mapThemeToggle requires a document runtime");
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope()
        );
        const controller = new AbortController();

        expect(() => {
            runtime.addDocumentListener("mapThemeChanged", () => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapThemeToggle requires a document runtime");
        controller.abort();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("50");
        const timer = 19 as BrowserTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope({
                getClearTimeout: () => clearTimeout,
                getSetTimeout: () => setTimeout,
            })
        );

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("50");
        const timer = 20 as BrowserTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);
        const runtime = getMapThemeToggleRuntime();

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMapThemeToggleRuntime(
            createMapThemeToggleRuntimeScope()
        );

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapThemeToggle requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "mapThemeToggle requires a clearTimeout runtime"
        );
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(15);

        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        const button = documentRef.createElement("button");
        button.className = "map-theme-toggle";
        documentRef.body.append(button);
        const setTimeout = vi.fn<BrowserSetTimeout>();
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const runtime = getMapThemeToggleRuntime({
            AbortController: TestAbortController,
            clearTimeout,
            CustomEvent,
            document: documentRef,
            setTimeout,
        } as unknown as Parameters<typeof getMapThemeToggleRuntime>[0]);
        const controller = new AbortController();

        expect(() => runtime.createAbortController()).toThrow(
            "mapThemeToggle requires AbortController provider"
        );
        expect(() =>
            runtime.addDocumentListener("mapThemeChanged", vi.fn(), {
                signal: controller.signal,
            })
        ).toThrow("mapThemeToggle requires document provider");
        expect(() =>
            runtime.createMapThemeChangedEvent("mapThemeChanged", true)
        ).toThrow("mapThemeToggle requires CustomEvent provider");
        expect(() =>
            runtime.dispatchDocumentEvent(new Event("mapThemeChanged"))
        ).toThrow("mapThemeToggle requires document provider");
        expect(() => runtime.findExistingToggle()).toThrow(
            "mapThemeToggle requires document provider"
        );
        expect(() => runtime.createElement("button")).toThrow(
            "mapThemeToggle requires document provider"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "mapThemeToggle requires document provider"
        );
        expect(() => runtime.isBodyThemeDark()).toThrow(
            "mapThemeToggle requires document provider"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "mapThemeToggle requires setTimeout provider"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "mapThemeToggle requires clearTimeout provider"
        );
        expect(controllerCount).toBe(0);
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(documentRef.body.childElementCount).toBe(1);
        expect(controller.signal.aborted).toBe(false);
    });

    it("fails clearly when explicit runtime provider slots are omitted", () => {
        expect.assertions(5);

        const runtime = getMapThemeToggleRuntime(
            {} as unknown as MapThemeToggleRuntimeScope
        );

        expect(() => runtime.createAbortController()).toThrow(
            "mapThemeToggle requires AbortController provider"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "mapThemeToggle requires clearTimeout provider"
        );
        expect(() =>
            runtime.createMapThemeChangedEvent("mapThemeChanged", true)
        ).toThrow("mapThemeToggle requires CustomEvent provider");
        expect(() => runtime.createElement("button")).toThrow(
            "mapThemeToggle requires document provider"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "mapThemeToggle requires setTimeout provider"
        );
    });
});

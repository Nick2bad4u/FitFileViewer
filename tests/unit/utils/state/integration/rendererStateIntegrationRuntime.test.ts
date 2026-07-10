// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserClearTimeout,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getRendererStateIntegrationRuntime,
    type RendererStateIntegrationRuntimeScope,
    type RendererStateIntegrationTimer,
} from "../../../../../electron-app/utils/state/integration/rendererStateIntegrationRuntime.js";

function createRendererStateIntegrationRuntimeScope(
    overrides: Partial<RendererStateIntegrationRuntimeScope> = {}
): RendererStateIntegrationRuntimeScope {
    return {
        getAbortController: () => undefined,
        getClearTimeout: () => undefined,
        getDocument: () => undefined,
        getDocumentEventTarget: () => undefined,
        getElement: () => undefined,
        getHTMLElement: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getRendererStateIntegrationRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("5000");
        const timer = 79 as RendererStateIntegrationTimer;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope({
                getClearTimeout: () => clearTimeout,
                getSetTimeout: () => setTimeout,
            })
        );

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient browser primitives for explicit scopes", () => {
        expect.assertions(6);

        const utils = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope()
        );

        expect(() => utils.setTimeout(() => {}, 0)).toThrow(
            "rendererStateIntegration requires a setTimeout runtime"
        );
        expect(() => {
            utils.clearTimeout(79 as RendererStateIntegrationTimer);
        }).toThrow("rendererStateIntegration requires a clearTimeout runtime");
        expect(() =>
            utils.addDocumentClickListener(() => undefined, {})
        ).toThrow(
            "rendererStateIntegration requires a document event-target runtime"
        );
        expect(() => utils.getDocument()).toThrow(
            "rendererStateIntegration requires a document runtime"
        );
        expect(() => utils.isElement(document.createElement("button"))).toThrow(
            "rendererStateIntegration requires an Element runtime"
        );
        expect(() =>
            utils.isHTMLElement(document.createElement("button"))
        ).toThrow("rendererStateIntegration requires an HTMLElement runtime");
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const utils = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope({
                getAbortController: () =>
                    AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            })
        );

        expect(utils.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getRendererStateIntegrationRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(2);

        const { createAbortController: createMissingProviderAbortController } =
            getRendererStateIntegrationRuntime(
                {} as unknown as RendererStateIntegrationRuntimeScope
            );
        const { createAbortController: createUnavailableAbortController } =
            getRendererStateIntegrationRuntime(
                createRendererStateIntegrationRuntimeScope()
            );

        expect(() => createMissingProviderAbortController()).toThrow(
            "rendererStateIntegration requires AbortController provider"
        );
        expect(() => createUnavailableAbortController()).toThrow(
            "rendererStateIntegration requires an AbortController runtime"
        );
    });

    it("registers document click listeners through the injected event target", () => {
        expect.assertions(3);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        let clickCount = 0;
        const listener = () => {
            clickCount += 1;
        };
        const utils = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope({
                getDocumentEventTarget: () => documentEventTarget,
            })
        );

        utils.addDocumentClickListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new MouseEvent("click"));

        expect(addEventListener).toHaveBeenCalledWith("click", listener, {
            signal: controller.signal,
        });
        expect(clickCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("derives document click listeners from the scoped document provider", () => {
        expect.assertions(4);

        const controller = new AbortController();
        const documentRef = document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        let clickCount = 0;
        const listener = () => {
            clickCount += 1;
        };
        const utils = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        utils.addDocumentClickListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new MouseEvent("click"));

        expect(addEventListener).toHaveBeenCalledWith("click", listener, {
            signal: controller.signal,
        });
        expect(addEventListener.mock.contexts[0]).toBe(documentRef);
        expect(clickCount).toBe(1);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("resolves DOM documents through the injected runtime scope", () => {
        expect.assertions(1);

        const documentRef = document.implementation.createHTMLDocument();
        const utils = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        expect(utils.getDocument()).toBe(documentRef);
    });

    it("checks DOM element types through injected constructors", () => {
        expect.assertions(4);

        const element = document.createElement("span");
        const textNode = document.createTextNode("not an element");
        const utils = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope({
                getElement: () => Element,
                getHTMLElement: () => HTMLElement,
            })
        );

        expect(utils.isElement(element)).toBe(true);
        expect(utils.isElement(textNode)).toBe(false);
        expect(utils.isHTMLElement(element)).toBe(true);
        expect(utils.isHTMLElement(textNode)).toBe(false);
    });

    it("ignores legacy direct browser primitive runtime properties", () => {
        expect.assertions(13);

        const callback = vi.fn<() => void>();
        const timer = 79 as RendererStateIntegrationTimer;
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const legacyScope = {
            AbortController:
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            clearTimeout,
            document: documentEventTarget,
            documentEventTarget,
            Element,
            HTMLElement,
            setTimeout,
        } as unknown as Parameters<
            typeof getRendererStateIntegrationRuntime
        >[0];
        const utils = getRendererStateIntegrationRuntime(legacyScope);

        expect(() => utils.createAbortController()).toThrow(
            "rendererStateIntegration requires AbortController provider"
        );
        expect(() => utils.setTimeout(callback, 5000)).toThrow(
            "rendererStateIntegration requires setTimeout provider"
        );
        expect(() => utils.clearTimeout(timer)).toThrow(
            "rendererStateIntegration requires clearTimeout provider"
        );
        expect(() =>
            utils.addDocumentClickListener(() => undefined, {})
        ).toThrow(
            "rendererStateIntegration requires document event-target provider"
        );
        expect(() => utils.getDocument()).toThrow(
            "rendererStateIntegration requires document provider"
        );
        expect(() => utils.isElement(document.createElement("button"))).toThrow(
            "rendererStateIntegration requires Element provider"
        );
        expect(() =>
            utils.isHTMLElement(document.createElement("button"))
        ).toThrow("rendererStateIntegration requires HTMLElement provider");
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("routes document click listeners through provider functions", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        let clickCount = 0;
        const utils = getRendererStateIntegrationRuntime(
            createRendererStateIntegrationRuntimeScope({
                getDocumentEventTarget: () => documentEventTarget,
            })
        );

        utils.addDocumentClickListener(
            () => {
                clickCount += 1;
            },
            { signal: controller.signal }
        );
        documentEventTarget.dispatchEvent(new MouseEvent("click"));

        expect(clickCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(11);

        const callback = vi.fn<() => void>();
        let clickCount = 0;
        const delayMs = Number("5000");
        const timer = 79 as RendererStateIntegrationTimer;
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const utils = getRendererStateIntegrationRuntime();

        vi.stubGlobal("AbortController", AbortControllerConstructor);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("setTimeout", setTimeout);

        expect(utils.createAbortController()).toBe(controller);
        expect(utils.getDocument()).toBe(document);
        expect(utils.isElement(document.createTextNode("no"))).toBe(false);
        expect(utils.isHTMLElement(document.createElement("button"))).toBe(
            true
        );
        utils.addDocumentClickListener(
            () => {
                clickCount += 1;
            },
            { signal: controller.signal }
        );
        document.dispatchEvent(new MouseEvent("click"));
        expect(utils.setTimeout(callback, delayMs)).toBe(timer);
        utils.clearTimeout(timer);

        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(clickCount).toBe(1);
        expect(document.body.childElementCount).toBe(0);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });
});

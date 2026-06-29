import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import { getAddExitFullscreenOverlayRuntime } from "../../../../../electron-app/utils/ui/controls/addExitFullscreenOverlayRuntime.js";

function setFullscreenElement(element: Element | null): void {
    Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: element,
    });
}

function setExitFullscreen(
    implementation: () => Promise<void>
): ReturnType<typeof vi.fn<() => Promise<void>>> {
    const exitFullscreen = vi.fn<() => Promise<void>>(implementation);
    Object.defineProperty(document, "exitFullscreen", {
        configurable: true,
        value: exitFullscreen,
    });

    return exitFullscreen;
}

describe("getAddExitFullscreenOverlayRuntime", () => {
    const unavailableAddExitFullscreenOverlayRuntimeScope = {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
    } satisfies Parameters<typeof getAddExitFullscreenOverlayRuntime>[0];

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getAddExitFullscreenOverlayRuntime({
            getAbortController: () => undefined,
            getDocument: () => document,
            getHTMLElement: () => undefined,
        });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("uses the injected document fullscreen API", async () => {
        expect.assertions(3);

        const fullscreenElement = document.createElement("div");
        const exitFullscreen = setExitFullscreen(() => Promise.resolve());
        setFullscreenElement(fullscreenElement);
        const runtime = getAddExitFullscreenOverlayRuntime({
            getAbortController: () => undefined,
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        await runtime.exitFullscreen();

        expect(runtime.getFullscreenElement()).toBe(fullscreenElement);
        expect(exitFullscreen).toHaveBeenCalledOnce();
        expect(runtime.isHTMLElement(fullscreenElement)).toBe(true);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getAddExitFullscreenOverlayRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
            getHTMLElement: () => undefined,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(4);

        const utils = getAddExitFullscreenOverlayRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
        expect(utils.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(utils.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(utils.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(4);

        const utils = getAddExitFullscreenOverlayRuntime();

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("document", document);

        const controller = utils.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(utils.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(utils.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
        expect(utils.isHTMLElement(document.createElement("div"))).toBe(true);
    });

    it("does not borrow document-window element constructors for explicit documents", () => {
        expect.assertions(1);

        const scopedDocument = {
            defaultView: {
                HTMLElement,
            },
        } as Document;
        const runtime = getAddExitFullscreenOverlayRuntime({
            getAbortController: () => undefined,
            getDocument: () => scopedDocument,
            getHTMLElement: () => undefined,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(4);

        const runtime = getAddExitFullscreenOverlayRuntime(
            unavailableAddExitFullscreenOverlayRuntimeScope
        );
        const runtimeWithoutAbortController =
            getAddExitFullscreenOverlayRuntime({
                ...unavailableAddExitFullscreenOverlayRuntimeScope,
                getDocument: () => document,
            });
        const runtimeWithInvalidAbortController =
            getAddExitFullscreenOverlayRuntime({
                ...unavailableAddExitFullscreenOverlayRuntimeScope,
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
            });

        expect(() => runtime.createButton()).toThrow(
            "addExitFullscreenOverlay requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow(
            "addExitFullscreenOverlay requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "addExitFullscreenOverlay requires an AbortController runtime"
        );
        expect(() => runtime.isHTMLElement({})).toThrow(
            "addExitFullscreenOverlay requires a document runtime"
        );
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(3);

        const runtime = getAddExitFullscreenOverlayRuntime(
            {} as unknown as Parameters<
                typeof getAddExitFullscreenOverlayRuntime
            >[0]
        );

        expect(() => runtime.createButton()).toThrow(
            "addExitFullscreenOverlay requires a document provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "addExitFullscreenOverlay requires an AbortController provider"
        );
        expect(() => runtime.isHTMLElement({})).toThrow(
            "addExitFullscreenOverlay requires a document provider"
        );
    });

    it("fails clearly when the HTMLElement provider is omitted", () => {
        expect.assertions(1);

        const runtime = getAddExitFullscreenOverlayRuntime({
            getAbortController: () => undefined,
            getDocument: () => document,
        } as unknown as Parameters<
            typeof getAddExitFullscreenOverlayRuntime
        >[0]);

        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow("addExitFullscreenOverlay requires an HTMLElement provider");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(5);

        const legacyAbortController = vi.fn();
        const legacyDocument = {
            createElement: vi.fn(),
            defaultView: {
                AbortController: legacyAbortController,
            },
        };
        const runtime = getAddExitFullscreenOverlayRuntime({
            ...unavailableAddExitFullscreenOverlayRuntimeScope,
            AbortController:
                legacyAbortController as unknown as BrowserAbortControllerConstructor,
            document: legacyDocument as unknown as Document,
            HTMLElement,
        } as unknown as Parameters<
            typeof getAddExitFullscreenOverlayRuntime
        >[0]);

        expect(() => runtime.createButton()).toThrow(
            "addExitFullscreenOverlay requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "addExitFullscreenOverlay requires an AbortController runtime"
        );
        expect(() => runtime.isHTMLElement({})).toThrow(
            "addExitFullscreenOverlay requires a document runtime"
        );
        expect(legacyDocument.createElement).not.toHaveBeenCalled();
        expect(legacyAbortController).not.toHaveBeenCalled();
    });

    it("uses the explicit element constructor provider for scoped element checks", () => {
        expect.assertions(2);

        const runtime = getAddExitFullscreenOverlayRuntime({
            getAbortController: () => undefined,
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
    });
});

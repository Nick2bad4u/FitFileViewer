import { afterEach, describe, expect, it, vi } from "vitest";

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
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getAddExitFullscreenOverlayRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("uses the injected document fullscreen API", async () => {
        expect.assertions(3);

        const fullscreenElement = document.createElement("div");
        const exitFullscreen = setExitFullscreen(() => Promise.resolve());
        setFullscreenElement(fullscreenElement);
        const runtime = getAddExitFullscreenOverlayRuntime({ document });

        await runtime.exitFullscreen();

        expect(runtime.getFullscreenElement()).toBe(fullscreenElement);
        expect(exitFullscreen).toHaveBeenCalledOnce();
        expect(runtime.isHTMLElement(fullscreenElement)).toBe(true);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getAddExitFullscreenOverlayRuntime({
            AbortController,
            document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
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

    it("does not borrow ambient element constructors for explicit documents", () => {
        expect.assertions(1);

        const scopedDocument = { defaultView: undefined } as Document;
        const runtime = getAddExitFullscreenOverlayRuntime({
            document: scopedDocument,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getAddExitFullscreenOverlayRuntime({});
        const runtimeWithInvalidAbortController =
            getAddExitFullscreenOverlayRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });

        expect(() => runtime.createButton()).toThrow(
            "addExitFullscreenOverlay requires a document runtime"
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
});

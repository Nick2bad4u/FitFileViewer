import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserEventConstructor,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import { getCreateMarkerCountSelectorRuntime } from "../../../../../electron-app/utils/ui/controls/createMarkerCountSelectorRuntime.js";

describe("getCreateMarkerCountSelectorRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateMarkerCountSelectorRuntime({
            getDocument: () => document,
        });

        expect(runtime.createElement("select")).toBeInstanceOf(
            HTMLSelectElement
        );
        expect(runtime.createElement("option")).toBeInstanceOf(
            HTMLOptionElement
        );
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("creates marker count change events through the injected Event runtime", () => {
        expect.assertions(4);

        const runtime = getCreateMarkerCountSelectorRuntime({
            getDocument: () => document,
            getEvent: () => Event,
        });
        const event = runtime.createChangeEvent();

        expect(event).toBeInstanceOf(Event);
        expect(event.type).toBe("change");
        expect(event.bubbles).toBe(false);
        expect(event.cancelable).toBe(true);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getCreateMarkerCountSelectorRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getCreateMarkerCountSelectorRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("does not borrow ambient constructors for explicit documents", () => {
        expect.assertions(2);

        const scopedDocument = {
            defaultView: {
                AbortController,
                Event,
            },
        } as Document;
        const runtime = getCreateMarkerCountSelectorRuntime({
            getDocument: () => scopedDocument,
        });

        expect(() => runtime.createAbortController()).toThrow(
            "createMarkerCountSelector requires an AbortController runtime"
        );
        expect(() => runtime.createChangeEvent()).toThrow(
            "createMarkerCountSelector requires an Event runtime"
        );
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getCreateMarkerCountSelectorRuntime({});
        const runtimeWithInvalidAbortController =
            getCreateMarkerCountSelectorRuntime({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
            });
        const runtimeWithInvalidEvent = getCreateMarkerCountSelectorRuntime({
            getDocument: () => document,
            getEvent: () => "Event" as unknown as BrowserEventConstructor,
        });

        expect(() => runtime.createElement("div")).toThrow(
            "createMarkerCountSelector requires a document runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createMarkerCountSelector requires an AbortController runtime"
        );
        expect(() => runtimeWithInvalidEvent.createChangeEvent()).toThrow(
            "createMarkerCountSelector requires an Event runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(6);

        const legacyAbortController = vi.fn();
        const legacyDocument = {
            createElement: vi.fn(),
            createElementNS: vi.fn(),
            defaultView: {
                AbortController: legacyAbortController,
                Event,
            },
        };
        const runtime = getCreateMarkerCountSelectorRuntime({
            AbortController:
                legacyAbortController as unknown as BrowserAbortControllerConstructor,
            document: legacyDocument as unknown as Document,
            Event,
        } as unknown as Parameters<
            typeof getCreateMarkerCountSelectorRuntime
        >[0]);

        expect(() => runtime.createElement("select")).toThrow(
            "createMarkerCountSelector requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "createMarkerCountSelector requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createMarkerCountSelector requires an AbortController runtime"
        );
        expect(() => runtime.createChangeEvent()).toThrow(
            "createMarkerCountSelector requires an Event runtime"
        );
        expect(legacyDocument.createElement).not.toHaveBeenCalled();
        expect(legacyAbortController).not.toHaveBeenCalled();
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(4);

        const runtime = getCreateMarkerCountSelectorRuntime();
        const documentRef = document;

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("document", documentRef);
        vi.stubGlobal("Event", Event);

        const event = runtime.createChangeEvent();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
        expect(runtime.createElement("select")).toBeInstanceOf(
            HTMLSelectElement
        );
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
        expect(event).toBeInstanceOf(Event);
    });
});

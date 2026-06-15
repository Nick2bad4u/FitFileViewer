import { describe, expect, it } from "vitest";

import { getCreateMarkerCountSelectorRuntime } from "../../../../../electron-app/utils/ui/controls/createMarkerCountSelectorRuntime.js";

describe("getCreateMarkerCountSelectorRuntime", () => {
    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateMarkerCountSelectorRuntime({ document });

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
            document,
            Event,
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
            AbortController,
            document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("does not borrow ambient constructors for explicit documents", () => {
        expect.assertions(2);

        const scopedDocument = { defaultView: undefined } as Document;
        const runtime = getCreateMarkerCountSelectorRuntime({
            document: scopedDocument,
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
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });
        const runtimeWithInvalidEvent = getCreateMarkerCountSelectorRuntime({
            document,
            Event: "Event" as unknown as typeof Event,
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
});

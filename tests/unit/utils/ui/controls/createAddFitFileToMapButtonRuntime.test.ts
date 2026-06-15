import { afterEach, describe, expect, it, vi } from "vitest";

import { getCreateAddFitFileToMapButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createAddFitFileToMapButtonRuntime.js";

describe("getCreateAddFitFileToMapButtonRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateAddFitFileToMapButtonRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getCreateAddFitFileToMapButtonRuntime({
            AbortController,
            document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(3);

        const utils = getCreateAddFitFileToMapButtonRuntime();

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("document", document);

        const controller = utils.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(utils.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(utils.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getCreateAddFitFileToMapButtonRuntime({});
        const runtimeWithoutAbortController =
            getCreateAddFitFileToMapButtonRuntime({
                document: { defaultView: undefined } as Document,
            });
        const runtimeWithInvalidAbortController =
            getCreateAddFitFileToMapButtonRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });

        expect(() => runtime.createButton()).toThrow(
            "createAddFitFileToMapButton requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow(
            "createAddFitFileToMapButton requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createAddFitFileToMapButton requires an AbortController runtime"
        );
    });
});

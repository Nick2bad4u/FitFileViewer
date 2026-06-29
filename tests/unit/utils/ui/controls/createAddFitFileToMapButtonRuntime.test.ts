import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import { getCreateAddFitFileToMapButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createAddFitFileToMapButtonRuntime.js";

describe("getCreateAddFitFileToMapButtonRuntime", () => {
    const unavailableAddFitFileToMapButtonRuntimeScope = {
        getAbortController: () => undefined,
        getDocument: () => undefined,
    } satisfies Parameters<typeof getCreateAddFitFileToMapButtonRuntime>[0];

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateAddFitFileToMapButtonRuntime({
            getAbortController: () => undefined,
            getDocument: () => document,
        });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getCreateAddFitFileToMapButtonRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(4);

        const utils = getCreateAddFitFileToMapButtonRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
        expect(utils.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(utils.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(utils.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
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

        const runtime = getCreateAddFitFileToMapButtonRuntime(
            unavailableAddFitFileToMapButtonRuntimeScope
        );
        const runtimeWithoutAbortController =
            getCreateAddFitFileToMapButtonRuntime({
                ...unavailableAddFitFileToMapButtonRuntimeScope,
                getDocument: () => document,
            });
        const runtimeWithInvalidAbortController =
            getCreateAddFitFileToMapButtonRuntime({
                ...unavailableAddFitFileToMapButtonRuntimeScope,
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
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

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(2);

        const runtime = getCreateAddFitFileToMapButtonRuntime(
            {} as unknown as Parameters<
                typeof getCreateAddFitFileToMapButtonRuntime
            >[0]
        );

        expect(() => runtime.createButton()).toThrow(
            "createAddFitFileToMapButton requires a document provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createAddFitFileToMapButton requires an AbortController provider"
        );
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
        const runtime = getCreateAddFitFileToMapButtonRuntime({
            ...unavailableAddFitFileToMapButtonRuntimeScope,
            AbortController:
                legacyAbortController as unknown as BrowserAbortControllerConstructor,
            document: legacyDocument as unknown as Document,
        } as unknown as Parameters<
            typeof getCreateAddFitFileToMapButtonRuntime
        >[0]);

        expect(() => runtime.createButton()).toThrow(
            "createAddFitFileToMapButton requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createAddFitFileToMapButton requires an AbortController runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "createAddFitFileToMapButton requires a document runtime"
        );
        expect(legacyDocument.createElement).not.toHaveBeenCalled();
        expect(legacyAbortController).not.toHaveBeenCalled();
    });
});

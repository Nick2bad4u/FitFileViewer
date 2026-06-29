import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import { getCreatePowerEstimationButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createPowerEstimationButtonRuntime.js";

describe("getCreatePowerEstimationButtonRuntime", () => {
    const powerEstimationButtonRuntimeScope = {
        getAbortController: () => AbortController,
        getDocument: () => document,
    } satisfies Parameters<typeof getCreatePowerEstimationButtonRuntime>[0];
    const unavailablePowerEstimationButtonRuntimeScope = {
        getAbortController: () => undefined,
        getDocument: () => undefined,
    } satisfies Parameters<typeof getCreatePowerEstimationButtonRuntime>[0];

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates buttons through the injected document", () => {
        expect.assertions(1);

        const runtime = getCreatePowerEstimationButtonRuntime({
            getAbortController: () => undefined,
            getDocument: () => document,
        });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getCreatePowerEstimationButtonRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getCreatePowerEstimationButtonRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getCreatePowerEstimationButtonRuntime(
            unavailablePowerEstimationButtonRuntimeScope
        );
        const runtimeWithoutAbortController =
            getCreatePowerEstimationButtonRuntime({
                ...unavailablePowerEstimationButtonRuntimeScope,
                getDocument: () => document,
            });
        const runtimeWithInvalidAbortController =
            getCreatePowerEstimationButtonRuntime({
                ...unavailablePowerEstimationButtonRuntimeScope,
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
            });

        expect(() => runtime.createButton()).toThrow(
            "createPowerEstimationButton requires a document runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow(
            "createPowerEstimationButton requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createPowerEstimationButton requires an AbortController runtime"
        );
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(2);

        const runtime = getCreatePowerEstimationButtonRuntime(
            {} as unknown as Parameters<
                typeof getCreatePowerEstimationButtonRuntime
            >[0]
        );

        expect(() => runtime.createButton()).toThrow(
            "createPowerEstimationButton requires a document provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createPowerEstimationButton requires an AbortController provider"
        );
    });

    it("fails clearly when individual provider slots are omitted", () => {
        expect.assertions(2);

        expect(() =>
            getCreatePowerEstimationButtonRuntime({
                ...powerEstimationButtonRuntimeScope,
                getDocument: undefined,
            }).createButton()
        ).toThrow("createPowerEstimationButton requires a document provider");
        expect(() =>
            getCreatePowerEstimationButtonRuntime({
                ...powerEstimationButtonRuntimeScope,
                getAbortController: undefined,
            }).createAbortController()
        ).toThrow(
            "createPowerEstimationButton requires an AbortController provider"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(4);

        const legacyAbortController = vi.fn();
        const legacyDocument = {
            createElement: vi.fn(),
            defaultView: {
                AbortController: legacyAbortController,
            },
        };
        const runtime = getCreatePowerEstimationButtonRuntime({
            AbortController:
                legacyAbortController as unknown as BrowserAbortControllerConstructor,
            document: legacyDocument as unknown as Document,
        } as unknown as Parameters<
            typeof getCreatePowerEstimationButtonRuntime
        >[0]);

        expect(() => runtime.createButton()).toThrow(
            "createPowerEstimationButton requires a document provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createPowerEstimationButton requires an AbortController provider"
        );
        expect(legacyDocument.createElement).not.toHaveBeenCalled();
        expect(legacyAbortController).not.toHaveBeenCalled();
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(2);

        const runtime = getCreatePowerEstimationButtonRuntime();
        const documentRef = document;

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("document", documentRef);

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
    });
});

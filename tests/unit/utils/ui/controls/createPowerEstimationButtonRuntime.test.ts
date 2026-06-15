import { describe, expect, it } from "vitest";

import { getCreatePowerEstimationButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createPowerEstimationButtonRuntime.js";

describe("getCreatePowerEstimationButtonRuntime", () => {
    it("creates buttons through the injected document", () => {
        expect.assertions(1);

        const runtime = getCreatePowerEstimationButtonRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getCreatePowerEstimationButtonRuntime({
            AbortController,
            document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(3);

        const runtime = getCreatePowerEstimationButtonRuntime({});
        const runtimeWithoutAbortController =
            getCreatePowerEstimationButtonRuntime({
                document: { defaultView: undefined } as Document,
            });
        const runtimeWithInvalidAbortController =
            getCreatePowerEstimationButtonRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
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
});

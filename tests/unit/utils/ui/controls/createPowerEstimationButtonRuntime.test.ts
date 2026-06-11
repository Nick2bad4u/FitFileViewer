import { describe, expect, it } from "vitest";

import { getCreatePowerEstimationButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createPowerEstimationButtonRuntime.js";

describe("getCreatePowerEstimationButtonRuntime", () => {
    it("creates buttons through the injected document", () => {
        expect.assertions(1);

        const runtime = getCreatePowerEstimationButtonRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreatePowerEstimationButtonRuntime({});

        expect(() => runtime.createButton()).toThrow(
            "createPowerEstimationButton requires a document runtime"
        );
    });
});

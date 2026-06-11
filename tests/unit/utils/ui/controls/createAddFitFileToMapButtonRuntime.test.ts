import { describe, expect, it } from "vitest";

import { getCreateAddFitFileToMapButtonRuntime } from "../../../../../electron-app/utils/ui/controls/createAddFitFileToMapButtonRuntime.js";

describe("getCreateAddFitFileToMapButtonRuntime", () => {
    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateAddFitFileToMapButtonRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreateAddFitFileToMapButtonRuntime({});

        expect(() => runtime.createButton()).toThrow(
            "createAddFitFileToMapButton requires a document runtime"
        );
    });
});

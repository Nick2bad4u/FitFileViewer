import { describe, expect, it } from "vitest";

import { getCreatePrintButtonRuntime } from "../../../../../electron-app/utils/files/export/createPrintButtonRuntime.js";

describe("getCreatePrintButtonRuntime", () => {
    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreatePrintButtonRuntime({ document });

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("invokes the injected print function", () => {
        expect.assertions(1);

        let printed = false;
        const print = (): void => {
            printed = true;
        };

        getCreatePrintButtonRuntime({ print }).print();

        expect(printed).toBe(true);
    });

    it("does nothing when print is unavailable", () => {
        expect.assertions(1);

        expect(() => getCreatePrintButtonRuntime({}).print()).not.toThrow();
    });
});

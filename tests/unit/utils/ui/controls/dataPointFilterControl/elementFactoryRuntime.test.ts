import { describe, expect, it } from "vitest";

import type { DataPointFilterElementFactoryRuntimeScope } from "../../../../../../electron-app/utils/ui/controls/dataPointFilterControl/elementFactoryRuntime.js";
import { getDataPointFilterElementFactoryRuntime } from "../../../../../../electron-app/utils/ui/controls/dataPointFilterControl/elementFactoryRuntime.js";

describe("getDataPointFilterElementFactoryRuntime", () => {
    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(4);

        const runtime = getDataPointFilterElementFactoryRuntime({
            getDocument: () => document,
        });

        expect(runtime.createElement("div")).toBeInstanceOf(HTMLDivElement);
        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.createElement("select")).toBeInstanceOf(
            HTMLSelectElement
        );
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("uses browser runtime providers for production document defaults", () => {
        expect.assertions(2);

        const runtime = getDataPointFilterElementFactoryRuntime();

        expect(runtime.createElement("div")).toBeInstanceOf(HTMLDivElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(2);

        const runtime = getDataPointFilterElementFactoryRuntime({});

        expect(() => runtime.createElement("div")).toThrow(
            "data point filter element factory requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "data point filter element factory requires a document runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const legacyScope = {
            document,
        } as unknown as DataPointFilterElementFactoryRuntimeScope;
        const runtime = getDataPointFilterElementFactoryRuntime(legacyScope);

        expect(() => runtime.createElement("div")).toThrow(
            "data point filter element factory requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "data point filter element factory requires a document runtime"
        );
    });
});

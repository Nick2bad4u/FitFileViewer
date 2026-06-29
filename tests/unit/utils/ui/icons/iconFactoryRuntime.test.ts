// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    getIconFactoryRuntime,
    SVG_NAMESPACE,
} from "../../../../../electron-app/utils/ui/icons/iconFactoryRuntime.js";

describe("iconFactoryRuntime", () => {
    it("creates SVG elements through the injected document provider", () => {
        expect.assertions(3);

        const createElementNS = vi.spyOn(document, "createElementNS");
        const runtime = getIconFactoryRuntime({
            getDocument: () => document,
        });

        const icon = runtime.createSvgElement("svg");

        expect(icon.tagName.toLowerCase()).toBe("svg");
        expect(icon.namespaceURI).toBe(SVG_NAMESPACE);
        expect(createElementNS).toHaveBeenCalledWith(SVG_NAMESPACE, "svg");

        createElementNS.mockRestore();
    });

    it("creates SVG elements through default browser providers", () => {
        expect.assertions(2);

        const runtime = getIconFactoryRuntime();
        const icon = runtime.createSvgElement("svg");

        expect(icon.tagName.toLowerCase()).toBe("svg");
        expect(icon.namespaceURI).toBe(SVG_NAMESPACE);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getIconFactoryRuntime({ getDocument: () => undefined });

        expect(() => runtime.createSvgElement("svg")).toThrow(
            "icon factory requires a document runtime"
        );
    });

    it("fails clearly when the document provider is omitted", () => {
        expect.assertions(1);

        const runtime = getIconFactoryRuntime(
            {} as unknown as Parameters<typeof getIconFactoryRuntime>[0]
        );

        expect(() => runtime.createSvgElement("svg")).toThrow(
            "icon factory requires a document provider"
        );
    });

    it("does not accept legacy direct document properties on the runtime scope", () => {
        expect.assertions(2);

        const createElementNS = vi.fn();
        const runtime = getIconFactoryRuntime({
            document: { createElementNS },
        } as unknown as Parameters<typeof getIconFactoryRuntime>[0]);

        expect(() => runtime.createSvgElement("svg")).toThrow(
            "icon factory requires a document provider"
        );
        expect(createElementNS).not.toHaveBeenCalled();
    });
});

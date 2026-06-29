import { describe, expect, it, vi } from "vitest";

import {
    getLoadVersionInfoRuntime,
    type LoadVersionInfoRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/loadVersionInfoRuntime.js";

describe("getLoadVersionInfoRuntime", () => {
    const unavailableLoadVersionInfoRuntimeScope = {
        getDocument: () => undefined,
        getProcessStringValue: () => undefined,
        getProcessVersionValue: () => undefined,
    } satisfies LoadVersionInfoRuntimeScope;

    it("queries the version number through the injected document provider", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("version info");
        const versionNumber = documentRef.createElement("span");
        versionNumber.id = "version-number";
        documentRef.body.append(versionNumber);
        const runtime = getLoadVersionInfoRuntime({
            getDocument: () => documentRef,
            getProcessStringValue: () => undefined,
            getProcessVersionValue: () => undefined,
        });

        const result = runtime.queryVersionNumber("#version-number");

        expect(result).toBe(versionNumber);
        expect(result?.id).toBe("version-number");
    });

    it("uses the shared browser document provider for production defaults", () => {
        expect.assertions(1);

        const versionNumber = document.createElement("span");
        versionNumber.id = "version-number";
        document.body.append(versionNumber);

        try {
            const runtime = getLoadVersionInfoRuntime();

            expect(runtime.queryVersionNumber("#version-number")).toBe(
                versionNumber
            );
        } finally {
            versionNumber.remove();
        }
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getLoadVersionInfoRuntime(
            unavailableLoadVersionInfoRuntimeScope
        );

        expect(() => runtime.queryVersionNumber("#version-number")).toThrow(
            "loadVersionInfo requires a document runtime"
        );
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(3);

        const runtime = getLoadVersionInfoRuntime(
            {} as unknown as LoadVersionInfoRuntimeScope
        );

        expect(() => runtime.queryVersionNumber("#version-number")).toThrow(
            "loadVersionInfo requires a document provider"
        );
        expect(() => runtime.getProcessStringValue("platform")).toThrow(
            "loadVersionInfo requires a process string provider"
        );
        expect(() => runtime.getProcessVersionValue("electron")).toThrow(
            "loadVersionInfo requires a process version provider"
        );
    });

    it("reads process fallbacks through injected runtime providers", () => {
        expect.assertions(4);

        const getProcessStringValue = vi.fn((name: string) =>
            name === "arch" ? "x64" : "win32"
        );
        const getProcessVersionValue = vi.fn((name: string) =>
            name === "electron" ? "39.0.0" : undefined
        );
        const runtime = getLoadVersionInfoRuntime({
            getDocument: () => undefined,
            getProcessStringValue,
            getProcessVersionValue,
        });

        expect(runtime.getProcessStringValue("arch")).toBe("x64");
        expect(runtime.getProcessStringValue("platform")).toBe("win32");
        expect(runtime.getProcessVersionValue("electron")).toBe("39.0.0");
        expect(runtime.getProcessVersionValue("chrome")).toBe(undefined);
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(6);

        const getProcessStringValue = vi.fn(() => "win32");
        const getProcessVersionValue = vi.fn(() => "39.0.0");
        const querySelector = vi.fn<Document["querySelector"]>();
        const runtime = getLoadVersionInfoRuntime({
            ...unavailableLoadVersionInfoRuntimeScope,
            document: { querySelector },
            processStringValue: getProcessStringValue,
            processVersionValue: getProcessVersionValue,
        } as unknown as LoadVersionInfoRuntimeScope);

        expect(() => runtime.queryVersionNumber("#version-number")).toThrow(
            "loadVersionInfo requires a document runtime"
        );
        expect(runtime.getProcessStringValue("platform")).toBe(undefined);
        expect(runtime.getProcessVersionValue("electron")).toBe(undefined);
        expect(querySelector).not.toHaveBeenCalled();
        expect(getProcessStringValue).not.toHaveBeenCalled();
        expect(getProcessVersionValue).not.toHaveBeenCalled();
    });
});

import { describe, expect, it, vi } from "vitest";

import {
    getLoadVersionInfoRuntime,
    type LoadVersionInfoRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/loadVersionInfoRuntime.js";

describe("getLoadVersionInfoRuntime", () => {
    it("queries the version number through the injected document provider", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("version info");
        const versionNumber = documentRef.createElement("span");
        versionNumber.id = "version-number";
        documentRef.body.append(versionNumber);
        const runtime = getLoadVersionInfoRuntime({
            getDocument: () => documentRef,
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

        const runtime = getLoadVersionInfoRuntime({});

        expect(() => runtime.queryVersionNumber("#version-number")).toThrow(
            "loadVersionInfo requires a document runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const querySelector = vi.fn<Document["querySelector"]>();
        const runtime = getLoadVersionInfoRuntime({
            document: { querySelector },
        } as unknown as LoadVersionInfoRuntimeScope);

        expect(() => runtime.queryVersionNumber("#version-number")).toThrow(
            "loadVersionInfo requires a document runtime"
        );
        expect(querySelector).not.toHaveBeenCalled();
    });
});

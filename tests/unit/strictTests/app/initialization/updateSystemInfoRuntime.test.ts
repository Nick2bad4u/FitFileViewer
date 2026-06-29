import { describe, expect, it, vi } from "vitest";

import {
    getUpdateSystemInfoRuntime,
    type UpdateSystemInfoRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/updateSystemInfoRuntime.js";

describe("getUpdateSystemInfoRuntime", () => {
    const unavailableUpdateSystemInfoRuntimeScope = {
        getDocument: () => undefined,
    } satisfies UpdateSystemInfoRuntimeScope;

    it("queries system info items through the injected document provider", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("system info");
        const first = documentRef.createElement("span");
        const second = documentRef.createElement("span");
        first.className = "system-info-value";
        second.className = "system-info-value";
        documentRef.body.append(first, second);
        const runtime = getUpdateSystemInfoRuntime({
            getDocument: () => documentRef,
        });

        const items = runtime.querySystemInfoItems(".system-info-value");

        expect(items).toHaveLength(2);
        expect(Array.from(items)).toStrictEqual([first, second]);
    });

    it("uses the shared browser document provider for production defaults", () => {
        expect.assertions(2);

        const first = document.createElement("span");
        const second = document.createElement("span");
        first.className = "system-info-value";
        second.className = "system-info-value";
        document.body.append(first, second);

        try {
            const runtime = getUpdateSystemInfoRuntime();
            const items = runtime.querySystemInfoItems(".system-info-value");

            expect(items).toHaveLength(2);
            expect(Array.from(items)).toContain(first);
        } finally {
            first.remove();
            second.remove();
        }
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getUpdateSystemInfoRuntime(
            unavailableUpdateSystemInfoRuntimeScope
        );

        expect(() =>
            runtime.querySystemInfoItems(".system-info-value")
        ).toThrow("updateSystemInfo requires a document runtime");
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(1);

        const runtime = getUpdateSystemInfoRuntime(
            {} as unknown as UpdateSystemInfoRuntimeScope
        );

        expect(() =>
            runtime.querySystemInfoItems(".system-info-value")
        ).toThrow("updateSystemInfo requires a document provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const querySelectorAll = vi.fn<Document["querySelectorAll"]>();
        const runtime = getUpdateSystemInfoRuntime({
            ...unavailableUpdateSystemInfoRuntimeScope,
            document: { querySelectorAll },
        } as unknown as UpdateSystemInfoRuntimeScope);

        expect(() =>
            runtime.querySystemInfoItems(".system-info-value")
        ).toThrow("updateSystemInfo requires a document runtime");
        expect(querySelectorAll).not.toHaveBeenCalled();
    });
});

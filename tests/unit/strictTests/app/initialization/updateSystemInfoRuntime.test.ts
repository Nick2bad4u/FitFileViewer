import { describe, expect, it, vi } from "vitest";

import {
    getUpdateSystemInfoRuntime,
    type UpdateSystemInfoRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/updateSystemInfoRuntime.js";

describe("getUpdateSystemInfoRuntime", () => {
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

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getUpdateSystemInfoRuntime({});

        expect(() =>
            runtime.querySystemInfoItems(".system-info-value")
        ).toThrow("updateSystemInfo requires a document runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const querySelectorAll = vi.fn<Document["querySelectorAll"]>();
        const runtime = getUpdateSystemInfoRuntime({
            document: { querySelectorAll },
        } as unknown as UpdateSystemInfoRuntimeScope);

        expect(() =>
            runtime.querySystemInfoItems(".system-info-value")
        ).toThrow("updateSystemInfo requires a document runtime");
        expect(querySelectorAll).not.toHaveBeenCalled();
    });
});

// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
    getCreateTablesRuntime,
    type CreateTablesRuntimeScope,
} from "../../../../../electron-app/utils/rendering/components/createTablesRuntime.js";

describe("createTablesRuntime", () => {
    it("resolves the default data-table container through the document provider", () => {
        expect.assertions(3);

        const container = document.createElement("div");
        const querySelector = vi.fn<ParentNode["querySelector"]>((selector) =>
            selector === "#content_data" ? container : null
        );
        const runtime = getCreateTablesRuntime({
            getDocument: () => ({ querySelector }),
        });

        expect(runtime.getDefaultContainer()).toBe(container);
        expect(querySelector).toHaveBeenCalledExactlyOnceWith("#content_data");
        expect(querySelector.mock.contexts[0]).toMatchObject({
            querySelector,
        });
    });

    it("returns null when explicit scopes do not provide a document", () => {
        expect.assertions(1);

        const runtime = getCreateTablesRuntime({});

        expect(runtime.getDefaultContainer()).toBeNull();
    });

    it("ignores legacy direct document scope properties", () => {
        expect.assertions(2);

        const querySelector = vi.fn<ParentNode["querySelector"]>(() =>
            document.createElement("div")
        );
        const runtime = getCreateTablesRuntime({
            document: { querySelector },
        } as unknown as CreateTablesRuntimeScope);

        expect(runtime.getDefaultContainer()).toBeNull();
        expect(querySelector).not.toHaveBeenCalled();
    });
});

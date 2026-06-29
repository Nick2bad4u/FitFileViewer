// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
    getCreateTablesRuntime,
    type CreateTablesRuntimeScope,
} from "../../../../../electron-app/utils/rendering/components/createTablesRuntime.js";

describe("createTablesRuntime", () => {
    const unavailableCreateTablesRuntimeScope = {
        getDocument: () => undefined,
    } satisfies CreateTablesRuntimeScope;

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

    it("resolves the default data-table container through browser providers", () => {
        expect.assertions(1);

        const container = document.createElement("div");
        container.id = "content_data";
        document.body.append(container);
        const runtime = getCreateTablesRuntime();

        expect(runtime.getDefaultContainer()).toBe(container);

        container.remove();
    });

    it("returns null when explicit scopes provide no document", () => {
        expect.assertions(1);

        const runtime = getCreateTablesRuntime(
            unavailableCreateTablesRuntimeScope
        );

        expect(runtime.getDefaultContainer()).toBeNull();
    });

    it("fails clearly when explicit scopes omit the document provider", () => {
        expect.assertions(1);

        expect(() =>
            getCreateTablesRuntime({} as unknown as CreateTablesRuntimeScope)
        ).toThrow("createTablesRuntime requires a document provider");
    });

    it("fails clearly when the document provider slot is undefined", () => {
        expect.assertions(1);

        expect(() =>
            getCreateTablesRuntime({
                getDocument: undefined,
            })
        ).toThrow("createTablesRuntime requires a document provider");
    });

    it("ignores legacy direct document scope properties", () => {
        expect.assertions(2);

        const querySelector = vi.fn<ParentNode["querySelector"]>(() =>
            document.createElement("div")
        );

        expect(() =>
            getCreateTablesRuntime({
                document: { querySelector },
            } as unknown as CreateTablesRuntimeScope)
        ).toThrow("createTablesRuntime requires a document provider");
        expect(querySelector).not.toHaveBeenCalled();
    });
});

// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

type RenderTable = (
    container: HTMLElement,
    tableName: string,
    table: { rows: Record<string, unknown>[] },
    index: number
) => void;

// Mock renderTable so we can assert on calls and avoid heavy DOM ops
vi.mock(
    import("../../../../../electron-app/utils/rendering/core/renderTable.js"),
    () => ({
        renderTable: vi.fn<RenderTable>((container, tableName) => {
            const tableMarker = document.createElement("section");
            tableMarker.dataset.tableName = tableName;
            container.append(tableMarker);
        }),
    })
);

import { renderTable } from "../../../../../electron-app/utils/rendering/core/renderTable.js";
import { createTables } from "../../../../../electron-app/utils/rendering/components/createTables.js";

function getContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "content-data";
    document.body.replaceChildren();
    document.body.append(container);
    return container;
}

describe(createTables, () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // reset DOM
        document.body.replaceChildren();
    });

    it("renders tables without requiring Arquero", () => {
        expect.assertions(2);

        const container = getContainer();
        createTables({ recordMesgs: [{ a: 1 }] }, container);
        expect(renderTable).toHaveBeenCalledOnce();
        expect(
            container.querySelector("[data-table-name='recordMesgs']")
        ).toBeInstanceOf(HTMLElement);
    });

    it("renders into the default data-tab container when no override is provided", () => {
        expect.assertions(3);

        const container = document.createElement("div");
        container.id = "content_data";
        document.body.replaceChildren(container);

        createTables({ recordMesgs: [{ a: 1 }] });

        expect(renderTable).toHaveBeenCalledOnce();
        expect(vi.mocked(renderTable).mock.calls[0]?.[0]).toBe(container);
        expect(
            container.querySelector("[data-table-name='recordMesgs']")
        ).toBeInstanceOf(HTMLElement);
    });

    it("returns early when container not found and no override provided", () => {
        expect.assertions(4);

        // Ensure DOM has no content-data element
        const other = document.createElement("div");
        other.id = "other";
        document.body.replaceChildren(other);
        const errorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);

        createTables({ recordMesgs: [{ a: 1 }] });
        expect(renderTable).not.toHaveBeenCalled();
        expect(document.body.children).toHaveLength(1);
        expect(document.getElementById("other")).toBe(other);
        expect(errorSpy).toHaveBeenCalledWith(
            '[ERROR] Container element with id "content_data" not found. Please ensure the element exists in the DOM or provide a valid containerOverride.'
        );
        errorSpy.mockRestore();
    });

    it("renders only valid tables and in correct order (recordMesgs first)", () => {
        expect.assertions(14);

        const container = getContainer();

        // Mix of valid/invalid tables
        const dataFrames = {
            bTable: [{ b: 1 }, { b: 2 }],
            recordMesgs: [{ r: 1 }],
            aTable: [{ a: 1 }],
            invalid1: "not-an-array",
            invalid2: [
                1,
                2,
                3,
            ],
            invalid3: [{ ok: true }, ["nested-array-not-obj"]],
            empty: [],
        };

        // Pre-fill container to ensure it gets cleared
        container.appendChild(document.createElement("span"));

        createTables(dataFrames, container);

        // expect container to no longer have the pre-filled child (cleared)
        expect(container.querySelector("span")).toBeNull();

        // Should render valid object arrays and in order:
        // recordMesgs first, then alphabetically (aTable, bTable, invalid3)
        const expectedOrder = [
            "recordMesgs",
            "aTable",
            "bTable",
            "invalid3",
        ];
        expect(renderTable).toHaveBeenCalledTimes(expectedOrder.length);

        expectedOrder.forEach((key, idx) => {
            const call = vi.mocked(renderTable).mock.calls[idx];
            expect(call?.[0]).toBe(container);
            expect(call?.[1]).toBe(key);
            // 4th arg is index
            expect(call?.[3]).toBe(idx);
        });

        // No Arquero required
    });

    it("orders numeric-only table keys last", () => {
        expect.assertions(6);

        const container = getContainer();

        const dataFrames = {
            "141": [{ n: 141 }],
            sessionMesgs: [{ s: 1 }],
            recordMesgs: [{ r: 1 }],
            activityMesgs: [{ a: 1 }],
            "140": [{ n: 140 }],
        };

        createTables(dataFrames, container);

        const expectedOrder = [
            "recordMesgs",
            "activityMesgs",
            "sessionMesgs",
            "140",
            "141",
        ];
        expect(renderTable).toHaveBeenCalledTimes(expectedOrder.length);
        expectedOrder.forEach((key, idx) => {
            expect(vi.mocked(renderTable).mock.calls[idx]?.[1]).toBe(key);
        });
    });

    it("continues gracefully when renderTable throws for a table", () => {
        expect.assertions(10);

        const container = getContainer();
        const errorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);
        vi.mocked(renderTable)
            .mockReturnValueOnce(undefined)
            .mockImplementationOnce(() => {
                throw new Error("boom");
            })
            .mockReturnValueOnce(undefined);

        const dataFrames = {
            recordMesgs: [{ r: 1 }],
            aTable: [{ a: 1 }],
            bTable: [{ b: 1 }, { b: 2 }],
        };

        createTables(dataFrames, container);

        // renderTable is invoked for each eligible table; if one invocation throws,
        // createTables should catch and continue with the next tables.
        expect(renderTable).toHaveBeenCalledTimes(3);
        expect(vi.mocked(renderTable).mock.calls[0]?.[1]).toBe("recordMesgs");
        expect(vi.mocked(renderTable).mock.calls[1]?.[1]).toBe("aTable");
        expect(vi.mocked(renderTable).mock.calls[2]?.[1]).toBe("bTable");

        expect(vi.mocked(renderTable).mock.calls[0]?.[3]).toBe(0);
        expect(vi.mocked(renderTable).mock.calls[1]?.[3]).toBe(1);
        expect(vi.mocked(renderTable).mock.calls[2]?.[3]).toBe(2);
        expect(errorSpy).toHaveBeenCalledOnce();
        const [errorMessage, errorStack] = errorSpy.mock.calls[0];
        expect(errorMessage).toBe(
            "[ERROR] Failed to render table for key: aTable. Error message: boom. Stack trace:"
        );
        expect(String(errorStack).split("\n")[0]).toBe("Error: boom");
        errorSpy.mockRestore();
    });
});

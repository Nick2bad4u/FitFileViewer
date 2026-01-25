/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock renderTable so we can assert on calls and avoid heavy DOM ops
vi.mock("../../../../../utils/rendering/core/renderTable.js", () => ({
    renderTable: vi.fn(),
}));

import { renderTable } from "../../../../../utils/rendering/core/renderTable.js";
import { createTables } from "../../../../../utils/rendering/components/createTables.js";

const getContainer = () => {
    const container = document.createElement("div");
    container.id = "content-data";
    document.body.innerHTML = "";
    document.body.appendChild(container);
    return container;
};

describe("createTables", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // reset DOM
        document.body.innerHTML = "";
    });

    it("renders tables without requiring Arquero", () => {
        const container = getContainer();
        createTables({ recordMesgs: [{ a: 1 }] }, container);
        expect(renderTable).toHaveBeenCalledTimes(1);
    });

    it("returns early when container not found and no override provided", () => {
        // Ensure DOM has no content-data element
        document.body.innerHTML = "<div id='other'></div>";

        createTables({ recordMesgs: [{ a: 1 }] });
        expect(renderTable).not.toHaveBeenCalled();
    });

    it("renders only valid tables and in correct order (recordMesgs first)", () => {
        const container = getContainer();

        // Mix of valid/invalid tables
        const dataFrames = {
            bTable: [{ b: 1 }, { b: 2 }],
            recordMesgs: [{ r: 1 }],
            aTable: [{ a: 1 }],
            invalid1: "not-an-array",
            invalid2: [1, 2, 3],
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
        const expectedOrder = ["recordMesgs", "aTable", "bTable", "invalid3"];
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

    it("continues gracefully when renderTable throws for a table", () => {
        const container = getContainer();
        vi.mocked(renderTable)
            .mockImplementationOnce(() => {
                // ok
            })
            .mockImplementationOnce(() => {
                throw new Error("boom");
            })
            .mockImplementationOnce(() => {
                // ok
            });

        const dataFrames = {
            recordMesgs: [{ r: 1 }],
            aTable: [{ a: 1 }],
            bTable: [{ b: 1 }, { b: 2 }],
        };

        createTables(dataFrames, container);

        // renderTable is invoked for each eligible table; if one invocation throws,
        // createTables should catch and continue with the next tables.
        expect(vi.mocked(renderTable).mock.calls.length).toBe(3);
        expect(vi.mocked(renderTable).mock.calls[0]?.[1]).toBe("recordMesgs");
        expect(vi.mocked(renderTable).mock.calls[1]?.[1]).toBe("aTable");
        expect(vi.mocked(renderTable).mock.calls[2]?.[1]).toBe("bTable");

        expect(vi.mocked(renderTable).mock.calls[0]?.[3]).toBe(0);
        expect(vi.mocked(renderTable).mock.calls[1]?.[3]).toBe(1);
        expect(vi.mocked(renderTable).mock.calls[2]?.[3]).toBe(2);
    });
});

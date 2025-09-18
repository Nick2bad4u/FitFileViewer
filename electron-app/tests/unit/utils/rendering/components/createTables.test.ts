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
    // reset window.aq
    // @ts-ignore
    delete window.aq;
  });

  it("returns early when Arquero is missing", () => {
    const container = getContainer();
    createTables({ recordMesgs: [{ a: 1 }] }, container);
    expect(renderTable).not.toHaveBeenCalled();
  });

  it("returns early when container not found and no override provided", () => {
    // Provide aq but do not add #content-data
    /** @type {(rows: any[]) => { numRows: () => number }} */
    const from = (rows) => ({ numRows: () => rows.length });
    /** @type {any} */ (window).aq = { from };
    // Ensure DOM has no content-data element
    document.body.innerHTML = "<div id='other'></div>";

    createTables({ recordMesgs: [{ a: 1 }] });
    expect(renderTable).not.toHaveBeenCalled();
  });

  it("renders only valid tables and in correct order (recordMesgs first)", () => {
    const container = getContainer();
    /** @type {(rows: any[]) => { numRows: () => number }} */
    const from = vi.fn((rows) => ({ numRows: () => rows.length }));
    /** @type {any} */ (window).aq = { from };

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

    // Should call aq.from only for valid object arrays and renderTable in order:
    // recordMesgs (index 0), aTable (1), bTable (2)
    const expectedOrder = ["recordMesgs", "aTable", "bTable"];
    expect(renderTable).toHaveBeenCalledTimes(expectedOrder.length);

    expectedOrder.forEach((key, idx) => {
      const call = vi.mocked(renderTable).mock.calls[idx];
      expect(call?.[0]).toBe(container);
      expect(call?.[1]).toBe(key);
      // 4th arg is index
      expect(call?.[3]).toBe(idx);
    });

    // aq.from called for 3 valid tables
    expect(vi.mocked(/** @type {any} */(window).aq.from)).toHaveBeenCalledTimes(3);
  });

  it("continues gracefully when aq.from throws for a table", () => {
    const container = getContainer();
    const fromMock = vi.fn()
      .mockImplementationOnce(() => ({ numRows: () => 1 })) // recordMesgs ok
      .mockImplementationOnce(() => { throw new Error("boom"); }) // aTable throws
      .mockImplementationOnce(() => ({ numRows: () => 2 })); // bTable ok

  /** @type {any} */ (window).aq = { from: fromMock };

    const dataFrames = {
      recordMesgs: [{ r: 1 }],
      aTable: [{ a: 1 }],
      bTable: [{ b: 1 }, { b: 2 }],
    };

    createTables(dataFrames, container);

    // renderTable should have been called for recordMesgs (index 0) and bTable (index 2 after sorting)
    expect(vi.mocked(renderTable).mock.calls.length).toBe(2);
    expect(vi.mocked(renderTable).mock.calls[0]?.[1]).toBe("recordMesgs");
    expect(vi.mocked(renderTable).mock.calls[1]?.[1]).toBe("bTable");
  });
});

import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getActiveFitTableData,
    getFitTableEntries,
    getFitTableRows,
    hasActiveFitTableData,
    isFitTableDataSource,
    isFitTableEntry,
    isFitTableRow,
} from "../../../../../electron-app/utils/state/domain/fitTableDataState.js";

describe("fitTableDataState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("returns table-ready entries from active FIT state", () => {
        expect.assertions(2);

        const rawData = {
            activityMesgs: [{ activity: "ride" }],
            recordMesgs: [{ timestamp: 1 }, { timestamp: 2 }],
            sessionMesgs: [{ sport: "cycling" }],
        };
        stateManager.setState("fitFile.rawData", rawData, { source: "test" });

        expect(getActiveFitTableData()).toStrictEqual({
            rawData,
            ready: true,
            tableCount: 3,
            tables: [
                { key: "recordMesgs", rows: rawData.recordMesgs },
                { key: "activityMesgs", rows: rawData.activityMesgs },
                { key: "sessionMesgs", rows: rawData.sessionMesgs },
            ],
            totalRows: 4,
        });
        expect(hasActiveFitTableData()).toBe(true);
    });

    it("preserves existing table ordering and valid-row filtering", () => {
        expect.assertions(1);

        const validMixedRow = { ok: true };
        const source = {
            "141": [{ n: 141 }],
            "140": [{ n: 140 }],
            bTable: [{ b: 1 }],
            empty: [],
            invalid: [null, "bad"],
            mixed: [
                null,
                validMixedRow,
                ["nested"],
            ],
            recordMesgs: [{ r: 1 }],
            sessionMesgs: [{ s: 1 }],
        };

        expect(getFitTableEntries(source)).toStrictEqual([
            { key: "recordMesgs", rows: source.recordMesgs },
            { key: "bTable", rows: source.bTable },
            { key: "mixed", rows: [validMixedRow] },
            { key: "sessionMesgs", rows: source.sessionMesgs },
            { key: "140", rows: source["140"] },
            { key: "141", rows: source["141"] },
        ]);
    });

    it("reports not-ready state when raw data or table rows are missing", () => {
        expect.assertions(3);

        expect(getActiveFitTableData(null)).toStrictEqual({
            rawData: null,
            ready: false,
            tableCount: 0,
            tables: [],
            totalRows: 0,
        });
        expect(getActiveFitTableData({ recordMesgs: [] })).toStrictEqual({
            rawData: { recordMesgs: [] },
            ready: false,
            tableCount: 0,
            tables: [],
            totalRows: 0,
        });
        expect(getFitTableRows([null, "bad"])).toStrictEqual([]);
    });

    it("validates table data source, entries, and rows", () => {
        expect.assertions(1);

        expect({
            invalidEntry: isFitTableEntry({ key: "recordMesgs", rows: [null] }),
            invalidSource: isFitTableDataSource([]),
            invalidTableRow: isFitTableRow([]),
            validEntry: isFitTableEntry({
                key: "recordMesgs",
                rows: [{ timestamp: 1 }],
            }),
            validSource: isFitTableDataSource({ recordMesgs: [] }),
            validTableRow: isFitTableRow({ timestamp: 1 }),
        }).toStrictEqual({
            invalidEntry: false,
            invalidSource: false,
            invalidTableRow: false,
            validEntry: true,
            validSource: true,
            validTableRow: true,
        });
    });
});
